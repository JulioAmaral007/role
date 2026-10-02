import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  FAVICON_SIZE,
  ICON_SIZE,
  SAFE_ZONE_RATIO,
  brandFiles,
  buildBrandAssets,
  DIE_RADIUS_UNITS,
  composeOnCanvas,
  glyphScale,
  rasterize,
} from './buildIcons';

const BRAND_DIR = path.resolve('assets/brand');
const IMAGES_DIR = path.resolve('assets/images');
const OUTPUTS = [
  'icon.png',
  'android-icon-foreground.png',
  'android-icon-monochrome.png',
  'splash-icon.png',
  'favicon.png',
];

/** Cabeçalho do PNG: largura, altura e tipo de cor (6 = RGBA). */
function pngHeader(buffer: Buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), colorType: buffer[25] };
}

function pixelsOf(svg: string, size: number) {
  const image = rasterize(svg, size).render();
  return { data: image.pixels, width: image.width, height: image.height };
}

function at(image: { data: Buffer; width: number }, x: number, y: number) {
  const index = (Math.round(y) * image.width + Math.round(x)) * 4;
  return { r: image.data[index], g: image.data[index + 1], b: image.data[index + 2], a: image.data[index + 3] };
}

/** Posição de um ponto da grade 100×100 do SVG-mestre depois de girar −10° em torno de (50, 50). */
function rotated(x: number, y: number) {
  const angle = (-10 * Math.PI) / 180;
  const dx = x - 50;
  const dy = y - 50;
  return { x: 50 + dx * Math.cos(angle) - dy * Math.sin(angle), y: 50 + dx * Math.sin(angle) + dy * Math.cos(angle) };
}

const files = Object.fromEntries(brandFiles(BRAND_DIR).map((file) => [file.name, file]));

describe('brand master files', () => {
  const read = (name: string) => fs.readFileSync(path.join(BRAND_DIR, name), 'utf8');

  it('keeps the geometry and colors of the plan (option A, Dado com pin)', () => {
    const master = read('dado-com-pin.svg');
    expect(master).toContain('<rect width="100" height="100" fill="#FFD43B"/>');
    expect(master).toContain('<g transform="rotate(-10 50 50)">');
    expect(master).toContain('<rect x="22" y="22" width="56" height="56" rx="14" fill="#141414"/>');
    expect(master).toContain('<circle cx="34" cy="34" r="5" fill="#FFD43B"/>');
    expect(master).toContain('<circle cx="66" cy="66" r="5" fill="#FFD43B"/>');
    expect(master).toContain(
      'd="M50 37.5c-6.2 0-10.8 4.6-10.8 10.5 0 7.5 10.8 17.2 10.8 17.2s10.8-9.7 10.8-17.2c0-5.9-4.6-10.5-10.8-10.5z"',
    );
    expect(master).toContain('<circle cx="50" cy="48.2" r="3.8" fill="#141414"/>');
  });

  it('has the same drawing in the glyph, only without the background', () => {
    const glyph = read('dado-com-pin-glifo.svg');
    expect(glyph).not.toContain('<rect width="100" height="100"');
    const body = (svg: string) => svg.slice(svg.indexOf('<g '), svg.lastIndexOf('</svg>')).trim();
    expect(body(glyph)).toBe(body(read('dado-com-pin.svg')));
  });
});

describe('safe zone math', () => {
  it('uses the 66 dp circle of the 108 dp Android adaptive canvas', () => {
    expect(SAFE_ZONE_RATIO).toBeCloseTo(66 / 108, 10);
  });

  it('measures the die by its rounded corner, not by the sharp square corner', () => {
    // (28 − 14)·√2 + 14: o arco do canto de raio 14 fica antes do canto vivo de 28·√2
    expect(DIE_RADIUS_UNITS).toBeCloseTo(33.799, 3);
    expect(DIE_RADIUS_UNITS).toBeLessThan(28 * Math.SQRT2);
  });

  it('scales the die so that its farthest point touches the safe circle', () => {
    const scale = glyphScale(1024, SAFE_ZONE_RATIO);
    expect(DIE_RADIUS_UNITS * scale).toBeCloseTo((SAFE_ZONE_RATIO * 1024) / 2, 6);
  });

  it('fits inside the circular crop of the Android 12 splash (192 of 288 dp) too', () => {
    const cornerRadius = DIE_RADIUS_UNITS * glyphScale(1024, SAFE_ZONE_RATIO);
    expect(cornerRadius).toBeLessThanOrEqual(((192 / 288) * 1024) / 2);
  });

  it('wraps the glyph in a centered canvas group', () => {
    const svg = composeOnCanvas('<svg viewBox="0 0 100 100"><circle r="1"/></svg>', 1024);
    expect(svg).toContain('viewBox="0 0 1024 1024"');
    expect(svg).toContain('<circle r="1"/>');
    const scale = glyphScale(1024, SAFE_ZONE_RATIO);
    expect(svg).toContain(`translate(${(1024 - 100 * scale) / 2} ${(1024 - 100 * scale) / 2}) scale(${scale})`);
  });
});

describe('generated images', () => {
  let outDir: string;
  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'role-brand-'));
    buildBrandAssets(BRAND_DIR, outDir);
  });
  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it.each(OUTPUTS)('%s is a PNG with RGBA pixels', (name) => {
    expect(fs.existsSync(path.join(outDir, name))).toBe(true);
    expect(pngHeader(fs.readFileSync(path.join(outDir, name))).colorType).toBe(6);
  });

  it('has the sizes the stores and the platforms expect', () => {
    const size = (name: string) => {
      const { width, height } = pngHeader(fs.readFileSync(path.join(outDir, name)));
      return `${width}x${height}`;
    };
    expect(size('icon.png')).toBe('1024x1024');
    expect(size('android-icon-foreground.png')).toBe('1024x1024');
    expect(size('android-icon-monochrome.png')).toBe('1024x1024');
    expect(size('splash-icon.png')).toBe('1024x1024');
    expect(size('favicon.png')).toBe(`${FAVICON_SIZE}x${FAVICON_SIZE}`);
  });

  it('draws the full icon as an opaque square: no transparent pixel, no rounded corners', () => {
    const image = pixelsOf(files['icon.png'].svg, ICON_SIZE);
    for (let index = 3; index < image.data.length; index += 4) {
      if (image.data[index] !== 255) throw new Error(`transparent pixel at ${(index - 3) / 4}`);
    }
    // os quatro cantos são o amarelo da marca
    for (const [x, y] of [[0, 0], [1023, 0], [0, 1023], [1023, 1023]]) {
      expect(at(image, x, y)).toEqual({ r: 255, g: 212, b: 59, a: 255 });
    }
  });

  it('keeps the dark die and the yellow pin where the master puts them', () => {
    const image = pixelsOf(files['icon.png'].svg, ICON_SIZE);
    const unit = ICON_SIZE / 100;
    const die = rotated(50, 70);
    expect(at(image, die.x * unit, die.y * unit)).toMatchObject({ r: 20, g: 20, b: 20, a: 255 });
    const pip = rotated(34, 34);
    expect(at(image, pip.x * unit, pip.y * unit)).toMatchObject({ r: 255, g: 212, b: 59 });
    const hole = rotated(50, 48.2);
    expect(at(image, hole.x * unit, hole.y * unit)).toMatchObject({ r: 20, g: 20, b: 20 });
  });

  it.each(['android-icon-foreground.png', 'splash-icon.png'])(
    '%s has a transparent background and the whole die inside the safe circle',
    (name) => {
      const image = pixelsOf(files[name].svg, ICON_SIZE);
      expect(at(image, 0, 0).a).toBe(0);
      expect(at(image, 1023, 1023).a).toBe(0);
      const center = ICON_SIZE / 2;
      const limit = (SAFE_ZONE_RATIO * ICON_SIZE) / 2 + 1.5;
      let farthest = 0;
      let painted = 0;
      for (let y = 0; y < ICON_SIZE; y++) {
        for (let x = 0; x < ICON_SIZE; x++) {
          if (image.data[(y * ICON_SIZE + x) * 4 + 3] > 8) {
            painted++;
            farthest = Math.max(farthest, Math.hypot(x - center, y - center));
          }
        }
      }
      expect(painted).toBeGreaterThan(100_000);
      expect(farthest).toBeLessThanOrEqual(limit);
      expect(farthest).toBeGreaterThan(limit - 12); // e não ficou menor do que precisava
    },
  );

  it('uses the same picture for the Android foreground and for the splash', () => {
    expect(files['splash-icon.png'].svg).toBe(files['android-icon-foreground.png'].svg);
  });

  it('draws the monochrome icon in a single color, with the pips and the pin cut out', () => {
    const image = pixelsOf(files['android-icon-monochrome.png'].svg, ICON_SIZE);
    for (let index = 0; index < image.data.length; index += 4) {
      if (image.data[index + 3] > 0 && (image.data[index] !== 0 || image.data[index + 1] !== 0 || image.data[index + 2] !== 0)) {
        throw new Error(`pixel ${index / 4} is not black`);
      }
    }
    const scale = glyphScale(ICON_SIZE, SAFE_ZONE_RATIO);
    const offset = (ICON_SIZE - 100 * scale) / 2;
    const place = (gridX: number, gridY: number) => {
      const point = rotated(gridX, gridY);
      return { x: offset + point.x * scale, y: offset + point.y * scale };
    };
    const body = place(50, 70);
    expect(at(image, body.x, body.y).a).toBe(255); // corpo do dado
    const pip = place(34, 34);
    expect(at(image, pip.x, pip.y).a).toBe(0); // pip vazado
    const pin = place(50, 42);
    expect(at(image, pin.x, pin.y).a).toBe(0); // pin vazado
    const hole = place(50, 48.2);
    expect(at(image, hole.x, hole.y).a).toBe(255); // furo do pin volta a ser opaco
  });

  it('keeps the committed PNGs identical to what the SVGs generate, so nobody forgets to rebuild', () => {
    for (const name of OUTPUTS) {
      const generated = fs.readFileSync(path.join(outDir, name));
      const committed = fs.readFileSync(path.join(IMAGES_DIR, name));
      expect({ name, same: generated.equals(committed) }).toEqual({ name, same: true });
    }
  });
});
