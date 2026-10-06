import { Directory, File, Paths } from 'expo-file-system';

import { AppError } from '@/utils/appError';

import {
  getNextPhotoIndex,
  getPhotoExtension,
  getPhotoFileName,
  isValidStampId,
  MEDIA_ROOT_DIRECTORY,
  sortPhotoFileNames,
} from './mediaPaths';
import type { MediaService } from './mediaService';

// Guarda as fotos no diretório de documentos do app (`expo-file-system`, API de `File` e
// `Directory` do SDK 57). Os documentos não são apagados pelo sistema, ao contrário do cache.

function toAppError(action: string, error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);
  return new AppError('unknown', `Could not ${action}: ${message}`, { cause: error });
}

function assertValidStampId(stampId: string): void {
  if (!isValidStampId(stampId)) throw new AppError('unknown', `Invalid stamp id "${stampId}"`);
}

export class FileSystemMediaService implements MediaService {
  // Duas fotos salvas ao mesmo tempo escolheriam o mesmo número: as gravações entram em fila.
  private writes: Promise<unknown> = Promise.resolve();

  private stampDirectory(stampId: string): Directory {
    return new Directory(Paths.document, MEDIA_ROOT_DIRECTORY, stampId);
  }

  async savePhoto(stampId: string, sourceUri: string): Promise<string> {
    assertValidStampId(stampId);
    const save = async () => {
      try {
        const directory = this.stampDirectory(stampId);
        directory.create({ intermediates: true, idempotent: true });
        const index = getNextPhotoIndex(directory.list().map((entry) => entry.name));
        const target = new File(
          directory,
          getPhotoFileName(index, getPhotoExtension(sourceUri)),
        );
        await new File(sourceUri).copy(target);
        return target.uri;
      } catch (error) {
        throw toAppError('save the photo', error);
      }
    };
    const result = this.writes.then(save, save);
    // a fila segue andando mesmo quando uma gravação falha
    this.writes = result.catch(() => undefined);
    return result;
  }

  async listPhotos(stampId: string): Promise<string[]> {
    assertValidStampId(stampId);
    try {
      const directory = this.stampDirectory(stampId);
      if (!directory.exists) return [];
      const urisByName = new Map(directory.list().map((entry) => [entry.name, entry.uri]));
      return sortPhotoFileNames([...urisByName.keys()]).map((name) => urisByName.get(name) ?? '');
    } catch (error) {
      throw toAppError('list the photos', error);
    }
  }

  async deletePhotos(stampId: string): Promise<void> {
    assertValidStampId(stampId);
    await this.deleteDirectory(this.stampDirectory(stampId), 'delete the photos');
  }

  deleteAll(): Promise<void> {
    return this.deleteDirectory(new Directory(Paths.document, MEDIA_ROOT_DIRECTORY), 'delete all photos');
  }

  /** Entra na fila das gravações, para não apagar uma pasta no meio de um `savePhoto`. */
  private deleteDirectory(directory: Directory, action: string): Promise<void> {
    const remove = async () => {
      try {
        if (directory.exists) directory.delete();
      } catch (error) {
        throw toAppError(action, error);
      }
    };
    const result = this.writes.then(remove, remove);
    this.writes = result.catch(() => undefined);
    return result;
  }
}
