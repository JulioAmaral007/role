import {
  DEFAULT_PHOTO_EXTENSION,
  getNextPhotoIndex,
  getPhotoExtension,
  getPhotoFileName,
  isValidStampId,
  MEDIA_ROOT_DIRECTORY,
  parsePhotoIndex,
  sortPhotoFileNames,
} from './mediaPaths';

describe('isValidStampId', () => {
  it('accepts a uuid and simple ids', () => {
    expect(isValidStampId('3f2b8c9e-1d4a-4b6e-9a77-0c5d2e8f1a10')).toBe(true);
    expect(isValidStampId('stamp-1')).toBe(true);
  });

  it('refuses anything that could leave the stamp folder or is empty', () => {
    for (const id of ['', '..', '../x', 'a/b', 'a\\b', 'a b', 'a.b', 'file:///x', 'ação']) {
      expect(isValidStampId(id)).toBe(false);
    }
  });
});

describe('getPhotoExtension', () => {
  it('reads the extension of a file uri, in lower case', () => {
    expect(getPhotoExtension('file:///cache/ImagePicker/abc.JPG')).toBe('jpg');
    expect(getPhotoExtension('file:///cache/ImagePicker/abc.heic')).toBe('heic');
    expect(getPhotoExtension('content://media/external/images/1.png')).toBe('png');
  });

  it('ignores the query and the fragment of an uri', () => {
    expect(getPhotoExtension('file:///a/b.webp?x=1.jpg')).toBe('webp');
    expect(getPhotoExtension('file:///a/b.png#frag')).toBe('png');
  });

  it('falls back to jpg without a recognizable extension', () => {
    expect(DEFAULT_PHOTO_EXTENSION).toBe('jpg');
    expect(getPhotoExtension('content://media/external/images/media/42')).toBe('jpg');
    expect(getPhotoExtension('file:///a/b.')).toBe('jpg');
    expect(getPhotoExtension('file:///a/b.toolongext')).toBe('jpg');
    expect(getPhotoExtension('')).toBe('jpg');
  });
});

describe('photo file names', () => {
  it('builds the predictable name', () => {
    expect(MEDIA_ROOT_DIRECTORY).toBe('stamps');
    expect(getPhotoFileName(1, 'jpg')).toBe('photo-1.jpg');
    expect(getPhotoFileName(12, 'heic')).toBe('photo-12.heic');
  });

  it('reads the number back from a photo name, and nothing from other files', () => {
    expect(parsePhotoIndex('photo-3.jpg')).toBe(3);
    expect(parsePhotoIndex('photo-10.PNG')).toBe(10);
    expect(parsePhotoIndex('photo-.jpg')).toBeNull();
    expect(parsePhotoIndex('photo-1')).toBeNull();
    expect(parsePhotoIndex('notes.txt')).toBeNull();
    expect(parsePhotoIndex('my-photo-1.jpg')).toBeNull();
    expect(parsePhotoIndex('.DS_Store')).toBeNull();
  });
});

describe('getNextPhotoIndex', () => {
  it('starts at 1', () => {
    expect(getNextPhotoIndex([])).toBe(1);
    expect(getNextPhotoIndex(['notes.txt'])).toBe(1);
  });

  it('is the highest number plus one, even with gaps and different extensions', () => {
    expect(getNextPhotoIndex(['photo-1.jpg', 'photo-2.jpg'])).toBe(3);
    expect(getNextPhotoIndex(['photo-1.jpg', 'photo-7.heic', 'notes.txt'])).toBe(8);
    expect(getNextPhotoIndex(['photo-10.jpg', 'photo-9.jpg'])).toBe(11);
  });
});

describe('sortPhotoFileNames', () => {
  it('orders by number (not as text) and drops what is not a photo', () => {
    expect(sortPhotoFileNames(['photo-10.jpg', 'notes.txt', 'photo-2.jpg', 'photo-1.png'])).toEqual([
      'photo-1.png',
      'photo-2.jpg',
      'photo-10.jpg',
    ]);
  });

  it('does not change the list it receives', () => {
    const names = ['photo-2.jpg', 'photo-1.jpg'];
    sortPhotoFileNames(names);
    expect(names).toEqual(['photo-2.jpg', 'photo-1.jpg']);
  });
});
