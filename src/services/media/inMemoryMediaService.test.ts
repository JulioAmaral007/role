import { InMemoryMediaService } from './inMemoryMediaService';

const STAMP = 'stamp-1';
const OTHER = 'stamp-2';

describe('InMemoryMediaService', () => {
  it('saves photos with the same names as the real service, and keeps the originals out of the way', async () => {
    const service = new InMemoryMediaService();
    const first = await service.savePhoto(STAMP, 'file:///cache/a.jpg');
    const second = await service.savePhoto(STAMP, 'file:///cache/b.heic');

    expect(first).toBe('memory://stamps/stamp-1/photo-1.jpg');
    expect(second).toBe('memory://stamps/stamp-1/photo-2.heic');
    expect(service.copiedFrom).toEqual(['file:///cache/a.jpg', 'file:///cache/b.heic']);
  });

  it('lists the photos of a stamp in order, and none for a stamp without photos', async () => {
    const service = new InMemoryMediaService();
    const first = await service.savePhoto(STAMP, 'a.jpg');
    const second = await service.savePhoto(STAMP, 'b.jpg');
    await service.savePhoto(OTHER, 'c.jpg');

    await expect(service.listPhotos(STAMP)).resolves.toEqual([first, second]);
    await expect(service.listPhotos('stamp-3')).resolves.toEqual([]);
  });

  it('deletes the photos of one stamp or of all of them', async () => {
    const service = new InMemoryMediaService();
    await service.savePhoto(STAMP, 'a.jpg');
    const kept = await service.savePhoto(OTHER, 'b.jpg');

    await service.deletePhotos(STAMP);
    await expect(service.listPhotos(STAMP)).resolves.toEqual([]);
    await expect(service.listPhotos(OTHER)).resolves.toEqual([kept]);

    await service.deleteAll();
    await expect(service.listPhotos(OTHER)).resolves.toEqual([]);
  });

  it('refuses an invalid stamp id like the real service', async () => {
    const service = new InMemoryMediaService();
    await expect(service.savePhoto('../x', 'a.jpg')).rejects.toMatchObject({ name: 'AppError' });
    await expect(service.listPhotos('a/b')).rejects.toMatchObject({ name: 'AppError' });
    await expect(service.deletePhotos('')).rejects.toMatchObject({ name: 'AppError' });
  });
});
