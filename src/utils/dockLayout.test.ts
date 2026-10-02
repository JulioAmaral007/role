import {
  activeWidth,
  iconLeft,
  iconLeftsByActive,
  innerWidth,
  labelLeft,
  labelWidthOf,
  maxLabelWidth,
  pillStep,
  slotStart,
  type DockGeometry,
} from './dockLayout';

// Medidas do dock no iPhone de referência (390): 20 de margem lateral, 6 de padding, 64 por item
// inativo, 4 de espaço, ícone de 22. Escritas aqui de propósito, para o teste não depender de tokens.
const geometry: DockGeometry = {
  containerWidth: 350,
  padding: 6,
  gap: 4,
  inactiveWidth: 64,
  iconSize: 22,
  labelGap: 8,
  contentPadding: 10,
  itemCount: 3,
  labelWidths: [40, 80, 50],
};

describe('dockLayout', () => {
  it('computes the constant active width from the measured container', () => {
    expect(innerWidth(geometry)).toBe(338);
    // 338 − 2 × 64 − 2 × 4 = 202, como no plano
    expect(activeWidth(geometry)).toBe(202);
  });

  it('keeps the active width the same whichever tab is active', () => {
    for (let active = 0; active < 3; active++) {
      const start = slotStart(geometry, active, active);
      const end = start + activeWidth(geometry);
      const next = active < 2 ? slotStart(geometry, active + 1, active) : innerWidth(geometry) + geometry.gap;
      expect(next - end).toBe(geometry.gap);
    }
  });

  it('lays the items out edge to edge, with no gap or overlap, in every state', () => {
    for (let active = 0; active < 3; active++) {
      let cursor = 0;
      for (let index = 0; index < 3; index++) {
        expect(slotStart(geometry, index, active)).toBe(cursor);
        cursor += (index === active ? activeWidth(geometry) : geometry.inactiveWidth) + geometry.gap;
      }
      expect(cursor - geometry.gap).toBe(innerWidth(geometry));
    }
  });

  it('moves the yellow pill by one step per tab', () => {
    expect(pillStep(geometry)).toBe(68);
    for (let active = 0; active < 3; active++) {
      expect(slotStart(geometry, active, active)).toBe(active * pillStep(geometry));
    }
  });

  it('centers the icon of an inactive item in its 64-wide slot', () => {
    // item 0 inativo com o item 1 ativo: slot em 0, ícone em (64 − 22) / 2
    expect(iconLeft(geometry, 0, 1)).toBe(21);
    // item 2 inativo com o item 0 ativo: slot depois do ativo (202 + 4) e do item 1 (68)
    expect(iconLeft(geometry, 2, 0)).toBe(202 + 4 + 68 + 21);
  });

  it('centers icon and label together inside the active item', () => {
    // item 1 ativo (label de 80): grupo = 22 + 8 + 80 = 110, sobra 202 − 110 = 92, metade 46
    expect(iconLeft(geometry, 1, 1)).toBe(68 + 46);
    expect(labelLeft(geometry, 1)).toBe(68 + 46 + 22 + 8);
  });

  it('gives one icon position per possible active tab, in order', () => {
    const lefts = iconLeftsByActive(geometry, 1);
    expect(lefts).toHaveLength(3);
    expect(lefts).toEqual([iconLeft(geometry, 1, 0), iconLeft(geometry, 1, 1), iconLeft(geometry, 1, 2)]);
    // o ícone do meio vai da direita (aba 0 ativa) para a esquerda (aba 2 ativa)
    expect(lefts[0]).toBeGreaterThan(lefts[1]);
    expect(lefts[1]).toBeGreaterThan(lefts[2]);
  });

  it('clamps a label wider than the room available, so the dock never overflows', () => {
    const wide = { ...geometry, labelWidths: [40, 400, 50] };
    // 202 − 2 × 10 − 22 − 8 = 152
    expect(maxLabelWidth(wide)).toBe(152);
    expect(labelWidthOf(wide, 1)).toBe(152);
    const start = slotStart(wide, 1, 1);
    expect(iconLeft(wide, 1, 1)).toBeGreaterThanOrEqual(start + wide.contentPadding);
    expect(labelLeft(wide, 1) + labelWidthOf(wide, 1)).toBeLessThanOrEqual(start + activeWidth(wide) - wide.contentPadding);
  });

  it('treats a label that was not measured yet as zero width', () => {
    const unmeasured = { ...geometry, labelWidths: [] };
    expect(labelWidthOf(unmeasured, 0)).toBe(0);
    expect(iconLeft(unmeasured, 0, 0)).toBe((202 - 22 - 8) / 2);
  });

  it('adapts the active width to a narrower device', () => {
    const small = { ...geometry, containerWidth: 280 };
    expect(activeWidth(small)).toBe(268 - 128 - 8);
    expect(maxLabelWidth(small)).toBeGreaterThan(0);
  });

  it('works with a different number of tabs', () => {
    const four = { ...geometry, itemCount: 4, labelWidths: [40, 40, 40, 40] };
    expect(activeWidth(four)).toBe(338 - 3 * 64 - 3 * 4);
    expect(iconLeftsByActive(four, 2)).toHaveLength(4);
  });
});
