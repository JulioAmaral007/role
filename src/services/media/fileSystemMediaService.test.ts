import { addFakeFile, listFakeFiles, resetFakeFileSystem } from '@/test/fakeExpoFileSystem';

import { FileSystemMediaService } from './fileSystemMediaService';

jest.mock('expo-file-system', () => jest.requireActual('@/test/fakeExpoFileSystem'));

const STAMP = '3f2b8c9e-1d4a-4b6e-9a77-0c5d2e8f1a10';
const OTHER_STAMP = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const DOCUMENTS = 'file:///data/user/0/app/files';
const PICKED = 'file:///data/user/0/app/cache/ImagePicker/picked.jpg';
const SECOND_PICKED = 'file:///data/user/0/app/cache/ImagePicker/second.heic';

beforeEach(() => {
  resetFakeFileSystem();
  addFakeFile(PICKED);
  addFakeFile(SECOND_PICKED);
});

describe('FileSystemMediaService.savePhoto', () => {
  it('copies the photo into the folder of the stamp and returns the new uri', async () => {
    const uri = await new FileSystemMediaService().savePhoto(STAMP, PICKED);

    expect(uri).toBe(`${DOCUMENTS}/stamps/${STAMP}/photo-1.jpg`);
    expect(listFakeFiles()).toContain(uri);
  });

  it('keeps the original where it was', async () => {
    await new FileSystemMediaService().savePhoto(STAMP, PICKED);
    expect(listFakeFiles()).toContain(PICKED);
  });

  it('gives each new photo of the stamp the next number and keeps its own extension', async () => {
    const service = new FileSystemMediaService();
    const first = await service.savePhoto(STAMP, PICKED);
    const second = await service.savePhoto(STAMP, SECOND_PICKED);

    expect(first.endsWith('/photo-1.jpg')).toBe(true);
    expect(second.endsWith('/photo-2.heic')).toBe(true);
  });

  it('keeps the photos of different stamps apart', async () => {
    const service = new FileSystemMediaService();
    const a = await service.savePhoto(STAMP, PICKED);
    const b = await service.savePhoto(OTHER_STAMP, PICKED);

    expect(a).toContain(`/stamps/${STAMP}/photo-1`);
    expect(b).toContain(`/stamps/${OTHER_STAMP}/photo-1`);
  });

  it('does not mix up two photos saved at the same time', async () => {
    const service = new FileSystemMediaService();
    const [first, second] = await Promise.all([
      service.savePhoto(STAMP, PICKED),
      service.savePhoto(STAMP, SECOND_PICKED),
    ]);

    expect(first).not.toBe(second);
    expect(await service.listPhotos(STAMP)).toHaveLength(2);
  });

  it('fails with an AppError when the source does not exist, and keeps working afterwards', async () => {
    const service = new FileSystemMediaService();
    const error = await service.savePhoto(STAMP, 'file:///nowhere.jpg').catch((e: unknown) => e);

    expect(error).toMatchObject({ name: 'AppError', code: 'unknown' });
    await expect(service.savePhoto(STAMP, PICKED)).resolves.toContain('/photo-1.jpg');
  });

  it('refuses an id that could leave the folder of the stamps', async () => {
    const service = new FileSystemMediaService();
    await expect(service.savePhoto('../escape', PICKED)).rejects.toMatchObject({ name: 'AppError' });
    expect(listFakeFiles()).toEqual([PICKED, SECOND_PICKED].sort());
  });
});

describe('FileSystemMediaService.listPhotos', () => {
  it('is empty for a stamp without photos', async () => {
    await expect(new FileSystemMediaService().listPhotos(STAMP)).resolves.toEqual([]);
  });

  it('lists the photos in the order they were saved', async () => {
    const service = new FileSystemMediaService();
    const first = await service.savePhoto(STAMP, PICKED);
    const second = await service.savePhoto(STAMP, SECOND_PICKED);
    await service.savePhoto(OTHER_STAMP, PICKED);

    await expect(service.listPhotos(STAMP)).resolves.toEqual([first, second]);
  });

  it('orders by number, so the 10th photo comes after the 9th', async () => {
    const service = new FileSystemMediaService();
    const uris: string[] = [];
    for (let n = 0; n < 11; n += 1) uris.push(await service.savePhoto(STAMP, PICKED));

    await expect(service.listPhotos(STAMP)).resolves.toEqual(uris);
  });

  it('ignores files in the folder that are not photos', async () => {
    const service = new FileSystemMediaService();
    const photo = await service.savePhoto(STAMP, PICKED);
    addFakeFile(`${DOCUMENTS}/stamps/${STAMP}/.nomedia`);

    await expect(service.listPhotos(STAMP)).resolves.toEqual([photo]);
  });

  it('refuses an invalid stamp id', async () => {
    await expect(new FileSystemMediaService().listPhotos('a/b')).rejects.toMatchObject({ name: 'AppError' });
  });
});

describe('FileSystemMediaService.deletePhotos', () => {
  it('deletes only the photos of that stamp', async () => {
    const service = new FileSystemMediaService();
    await service.savePhoto(STAMP, PICKED);
    const kept = await service.savePhoto(OTHER_STAMP, PICKED);

    await service.deletePhotos(STAMP);

    await expect(service.listPhotos(STAMP)).resolves.toEqual([]);
    await expect(service.listPhotos(OTHER_STAMP)).resolves.toEqual([kept]);
  });

  it('does nothing when the stamp has no photos', async () => {
    await expect(new FileSystemMediaService().deletePhotos(STAMP)).resolves.toBeUndefined();
  });

  it('starts numbering from 1 again after the photos are deleted', async () => {
    const service = new FileSystemMediaService();
    await service.savePhoto(STAMP, PICKED);
    await service.deletePhotos(STAMP);
    await expect(service.savePhoto(STAMP, PICKED)).resolves.toContain('/photo-1.jpg');
  });

  it('refuses an invalid stamp id', async () => {
    await expect(new FileSystemMediaService().deletePhotos('..')).rejects.toMatchObject({ name: 'AppError' });
  });
});

describe('FileSystemMediaService.deleteAll', () => {
  it('deletes the photos of every stamp and nothing else', async () => {
    const service = new FileSystemMediaService();
    await service.savePhoto(STAMP, PICKED);
    await service.savePhoto(OTHER_STAMP, SECOND_PICKED);
    addFakeFile(`${DOCUMENTS}/other-file.txt`);

    await service.deleteAll();

    await expect(service.listPhotos(STAMP)).resolves.toEqual([]);
    await expect(service.listPhotos(OTHER_STAMP)).resolves.toEqual([]);
    expect(listFakeFiles()).toEqual([`${DOCUMENTS}/other-file.txt`, PICKED, SECOND_PICKED].sort());
  });

  it('does nothing when there are no photos at all', async () => {
    await expect(new FileSystemMediaService().deleteAll()).resolves.toBeUndefined();
  });

  it('waits for a photo that is being saved instead of deleting underneath it', async () => {
    const service = new FileSystemMediaService();
    const saving = service.savePhoto(STAMP, PICKED);
    const deleting = service.deleteAll();
    await Promise.all([saving, deleting]);

    await expect(service.listPhotos(STAMP)).resolves.toEqual([]);
  });
});
