import { borderWidth, colors, dock, height, layout, radius, shadow, space } from './tokens';

const HEX = /^#[0-9A-F]{6}$/;

function flattenColors(tree: Record<string, string | Record<string, string>>): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[key, value] as [string, string]]
      : Object.entries(value).map(([inner, color]) => [`${key}.${inner}`, color] as [string, string]),
  );
}

describe('tokens', () => {
  it('keeps the palette from the plan', () => {
    expect(colors).toEqual({
      yellow: '#FFD43B',
      ink: '#141414',
      cream: '#FFFBEF',
      blue: '#2B3FD6',
      blueDark: '#1E2DA6',
      lavender: '#E6E9FF',
      olive: '#3A3200',
      gray: '#55524A',
      grayLight: '#8C887C',
      stripe: '#F0E8CF',
      sand: '#D6D2C6',
      plus: { tableHeader: '#222220', border: '#4A4842', selected: '#2A2614' },
    });
  });

  it('writes every color as an uppercase 6-digit hex', () => {
    for (const [name, value] of flattenColors(colors)) {
      expect({ name, ok: HEX.test(value) }).toEqual({ name, ok: true });
    }
  });

  it('has no repeated color value under different names', () => {
    const values = flattenColors(colors).map(([, value]) => value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('keeps the scales sorted and unique', () => {
    const numeric = (scale: Record<string, number>) =>
      Object.entries(scale)
        .filter(([key]) => key !== 'pill')
        .map(([, value]) => value);
    for (const scale of [numeric(space), numeric(radius)]) {
      expect(scale).toEqual([...new Set(scale)].sort((a, b) => a - b));
    }
    expect(radius.pill).toBeGreaterThan(radius[24]);
  });

  it('makes every interactive height at least the minimum touch target', () => {
    const interactive = [
      height.chip,
      height.segment,
      height.buttonSecondary,
      height.dockItem,
      height.cta,
      height.ctaLarge,
    ];
    for (const value of interactive) expect(value).toBeGreaterThanOrEqual(height.minTouch);
    expect(dock.inactiveItemWidth).toBeGreaterThanOrEqual(height.minTouch);
  });

  it('reserves enough room under the screens for the floating dock', () => {
    const dockFootprint = height.dockItem + dock.padding * 2 + dock.bottomMargin;
    expect(dock.baseInset).toBeGreaterThan(dockFootprint);
    expect(dock.sideMargin).toBe(layout.screenPaddingX);
  });

  it('describes the dock shadow as two box shadow layers', () => {
    expect(shadow.dock).toHaveLength(2);
    expect(shadow.dock[0]).toMatchObject({ offsetY: 12, blurRadius: 32 });
    expect(shadow.dock[1]).toMatchObject({ offsetY: 2, blurRadius: 6 });
  });

  it('uses the prototype border widths', () => {
    expect(borderWidth).toEqual({ thin: 1.5, regular: 2, thick: 3 });
  });
});
