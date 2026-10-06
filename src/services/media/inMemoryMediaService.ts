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

/**
 * Fotos para testes, com as mesmas regras do service real (nome `photo-N.ext`, número crescente,
 * id de carimbo validado), mas sem arquivo nenhum: guarda só os nomes. A URI devolvida é
 * `memory://stamps/<id>/photo-N.ext`.
 */
export class InMemoryMediaService implements MediaService {
  /** As origens copiadas, na ordem (para conferir que o original foi o que o chamador passou). */
  readonly copiedFrom: string[] = [];
  private readonly photos = new Map<string, string[]>();

  private static uriOf(stampId: string, fileName: string): string {
    return `memory://${MEDIA_ROOT_DIRECTORY}/${stampId}/${fileName}`;
  }

  private static assertValid(stampId: string): void {
    if (!isValidStampId(stampId)) throw new AppError('unknown', `Invalid stamp id "${stampId}"`);
  }

  async savePhoto(stampId: string, sourceUri: string): Promise<string> {
    InMemoryMediaService.assertValid(stampId);
    const names = this.photos.get(stampId) ?? [];
    const name = getPhotoFileName(getNextPhotoIndex(names), getPhotoExtension(sourceUri));
    this.photos.set(stampId, [...names, name]);
    this.copiedFrom.push(sourceUri);
    return InMemoryMediaService.uriOf(stampId, name);
  }

  async listPhotos(stampId: string): Promise<string[]> {
    InMemoryMediaService.assertValid(stampId);
    const names = sortPhotoFileNames(this.photos.get(stampId) ?? []);
    return names.map((name) => InMemoryMediaService.uriOf(stampId, name));
  }

  async deletePhotos(stampId: string): Promise<void> {
    InMemoryMediaService.assertValid(stampId);
    this.photos.delete(stampId);
  }

  async deleteAll(): Promise<void> {
    this.photos.clear();
  }
}
