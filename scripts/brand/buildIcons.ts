// Gera os PNGs do ícone e da splash a partir dos SVGs-mestre de `assets/brand/` (D31, "Dado com
// pin"). Roda com `npm run brand:build` e dá para refazer os ícones a qualquer momento.
//
//   assets/brand/dado-com-pin.svg            fundo amarelo + dado (ícone completo)
//   assets/brand/dado-com-pin-glifo.svg      só o dado, sem fundo
//   assets/brand/dado-com-pin-monocromo.svg  silhueta de uma cor (Android 13+)
//
// Saídas em `assets/images/`: icon.png, android-icon-foreground.png, android-icon-monochrome.png,
// splash-icon.png e favicon.png.
import fs from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

/** Lado do ícone e das camadas do Android, em pixels. */
export const ICON_SIZE = 1024;
export const FAVICON_SIZE = 48;

/** O ícone adaptativo do Android só garante visível um círculo de 66 dp dentro do canvas de 108 dp. */
export const SAFE_ZONE_RATIO = 66 / 108;

/**
 * Grade do SVG-mestre. O dado mede 56 (meio lado 28) e tem cantos de raio 14: o ponto mais distante
 * do centro é o do arco do canto, a (28 − 14)·√2 + 14 unidades, seja qual for o giro.
 */
const GRID = 100;
const DIE_HALF_SIDE = 28;
const DIE_CORNER_RADIUS = 14;
export const DIE_RADIUS_UNITS = (DIE_HALF_SIDE - DIE_CORNER_RADIUS) * Math.SQRT2 + DIE_CORNER_RADIUS;

export interface BrandFile {
  name: string;
  svg: string;
  size: number;
}

/** Escala que faz o dado inteiro, cantos arredondados incluídos, tocar um círculo de `safeZoneRatio` do canvas. */
export function glyphScale(canvasSize: number, safeZoneRatio: number): number {
  return (safeZoneRatio * canvasSize) / (2 * DIE_RADIUS_UNITS);
}

/** Conteúdo de dentro do `<svg>` (sem a tag de abertura nem a de fechamento). */
function innerSvg(svg: string): string {
  const open = svg.indexOf('>', svg.indexOf('<svg')) + 1;
  return svg.slice(open, svg.lastIndexOf('</svg>')).trim();
}

/**
 * Coloca o glifo, centralizado, num canvas quadrado transparente, reduzido para o dado inteiro caber
 * dentro do círculo de segurança. Serve ao `foreground`, ao `monochrome` e à imagem da splash.
 */
export function composeOnCanvas(glyphSvg: string, canvasSize: number, safeZoneRatio = SAFE_ZONE_RATIO): string {
  const scale = glyphScale(canvasSize, safeZoneRatio);
  const offset = (canvasSize - GRID * scale) / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="${canvasSize}" height="${canvasSize}">`,
    `<g transform="translate(${offset} ${offset}) scale(${scale})">`,
    innerSvg(glyphSvg),
    '</g>',
    '</svg>',
  ].join('\n');
}

export function rasterize(svg: string, size: number): Resvg {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } });
}

function readBrand(brandDir: string, file: string): string {
  return fs.readFileSync(path.join(brandDir, file), 'utf8');
}

/** Os cinco arquivos de saída, ainda como SVG já no tamanho final. */
export function brandFiles(brandDir: string): BrandFile[] {
  const master = readBrand(brandDir, 'dado-com-pin.svg');
  const glyph = readBrand(brandDir, 'dado-com-pin-glifo.svg');
  const mono = readBrand(brandDir, 'dado-com-pin-monocromo.svg');
  return [
    { name: 'icon.png', svg: master, size: ICON_SIZE },
    { name: 'android-icon-foreground.png', svg: composeOnCanvas(glyph, ICON_SIZE), size: ICON_SIZE },
    { name: 'android-icon-monochrome.png', svg: composeOnCanvas(mono, ICON_SIZE), size: ICON_SIZE },
    { name: 'splash-icon.png', svg: composeOnCanvas(glyph, ICON_SIZE), size: ICON_SIZE },
    { name: 'favicon.png', svg: master, size: FAVICON_SIZE },
  ];
}

export function buildBrandAssets(brandDir: string, outDir: string): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  return brandFiles(brandDir).map((file) => {
    const target = path.join(outDir, file.name);
    fs.writeFileSync(target, rasterize(file.svg, file.size).render().asPng());
    return target;
  });
}

// Só roda como script (`node scripts/brand/buildIcons.ts`), nunca ao ser importado pelos testes.
if (process.argv[1]?.endsWith('buildIcons.ts')) {
  const written = buildBrandAssets(path.resolve('assets/brand'), path.resolve('assets/images'));
  for (const file of written) console.log(`gerado ${path.relative(process.cwd(), file)}`);
}
