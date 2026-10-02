import type { TextStyle } from 'react-native';

import { fontFamily } from './fonts';
import { displaySize, size, typography } from './typography';

const FAMILIES: string[] = [
  ...Object.values(fontFamily.display),
  ...Object.values(fontFamily.body),
  ...Object.values(fontFamily.mono),
];

/** Todas as variantes como lista de estilos, com o nome para a mensagem de erro. */
function allStyles(): [string, TextStyle][] {
  return Object.entries(typography).flatMap(([name, value]) =>
    'fontFamily' in value
      ? [[name, value as TextStyle] as [string, TextStyle]]
      : Object.entries(value).map(([inner, style]) => [`${name}.${inner}`, style as TextStyle] as [string, TextStyle]),
  );
}

describe('typography scale', () => {
  it('keeps the four body sizes from the plan', () => {
    expect(size).toEqual({ xs: 12, sm: 14, md: 16, lg: 20 });
  });

  it('keeps the display sizes from the prototype', () => {
    expect(displaySize).toEqual([28, 32, 34, 38, 44, 50, 64]);
    expect(Object.keys(typography.display).map(Number)).toEqual([...displaySize]);
  });

  it('uses only declared sizes in every variant', () => {
    const allowed = new Set<number>([...Object.values(size), ...displaySize]);
    for (const [name, style] of allStyles()) {
      expect({ name, ok: allowed.has(style.fontSize as number) }).toEqual({ name, ok: true });
    }
  });

  it('picks the font by family name and never by fontWeight', () => {
    for (const [name, style] of allStyles()) {
      expect({ name, family: FAMILIES.includes(style.fontFamily as string) }).toEqual({ name, family: true });
      expect({ name, weight: style.fontWeight }).toEqual({ name, weight: undefined });
    }
  });
});

describe('typography variants', () => {
  it('converts the prototype em letter spacing and line height to points', () => {
    expect(typography.display[34]).toMatchObject({ fontSize: 34, lineHeight: 35, letterSpacing: -1.19 });
    expect(typography.display[50]).toMatchObject({ fontSize: 50, lineHeight: 48, letterSpacing: -2 });
    expect(typography.display[64]).toMatchObject({ fontSize: 64, lineHeight: 64, letterSpacing: -2.56 });
    expect(typography.display[28]).toMatchObject({ lineHeight: 28, letterSpacing: 0 });
    expect(typography.cta.letterSpacing).toBe(-0.2);
    expect(typography.body.lineHeight).toBe(20);
    expect(typography.bodyLarge.lineHeight).toBe(23);
  });

  it('writes labels in uppercase mono with the prototype letter spacing', () => {
    expect(typography.label).toMatchObject({
      fontFamily: fontFamily.mono.medium,
      fontSize: size.xs,
      letterSpacing: 0.96,
      textTransform: 'uppercase',
    });
  });

  it('uses Bricolage for display, CTA and numbers, and Instrument Sans for reading text', () => {
    expect(typography.display[44].fontFamily).toBe(fontFamily.display.extraBold);
    expect(typography.cta.fontFamily).toBe(fontFamily.display.bold);
    expect(typography.stat.lg.fontFamily).toBe(fontFamily.display.extraBold);
    expect(typography.body.fontFamily).toBe(fontFamily.body.regular);
    expect(typography.title.fontFamily).toBe(fontFamily.body.bold);
  });

  it('keeps hierarchy inside a size by weight, not by new sizes', () => {
    const sm = [typography.body, typography.button, typography.tabLabel].map((style) => style.fontFamily);
    expect(new Set(sm).size).toBe(3);
    for (const style of [typography.body, typography.button, typography.tabLabel]) {
      expect(style.fontSize).toBe(size.sm);
    }
  });
});
