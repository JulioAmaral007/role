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

// Medidas do dock no iPhone de referência (390) com as 4 abas da revisão de 02/10/2026: 20 de margem
// lateral, 6 de padding, 60 por item inativo, 4 de espaço, ícone de 22. Escritas aqui de propósito,
// para o teste não depender dos tokens.
const geometry: DockGeometry = {
  containerWidth: 350,
  padding: 6,
  gap: 4,
  inactiveWidth: 60,
  iconSize: 22,
  labelGap: 8,
  contentPadding: 10,
  itemCount: 4,
  labelWidths: [40, 80, 50, 45],
};

const COUNT = geometry.itemCount;
const STEP = 64; // 60 + 4

describe('dockLayout', () => {
  it('computes the constant active width from the measured container', () => {
    expect(innerWidth(geometry)).toBe(338);
    // 338 − 3 × 60 − 3 × 4 = 146, como no plano
    expect(activeWidth(geometry)).toBe(146);
  });

  it('keeps the active width the same whichever tab is active', () => {
    for (let active = 0; active < COUNT; active++) {
      const start = slotStart(geometry, active, active);
      const end = start + activeWidth(geometry);
      const next = active < COUNT - 1 ? slotStart(geometry, active + 1, active) : innerWidth(geometry) + geometry.gap;
      expect(next - end).toBe(geometry.gap);
    }
  });

  it('lays the items out edge to edge, with no gap or overlap, in every state', () => {
    for (let active = 0; active < COUNT; active++) {
      let cursor = 0;
      for (let index = 0; index < COUNT; index++) {
        expect(slotStart(geometry, index, active)).toBe(cursor);
        cursor += (index === active ? activeWidth(geometry) : geometry.inactiveWidth) + geometry.gap;
      }
      expect(cursor - geometry.gap).toBe(innerWidth(geometry));
    }
  });

  it('moves the yellow pill by one step per tab', () => {
    expect(pillStep(geometry)).toBe(STEP);
    for (let active = 0; active < COUNT; active++) {
      expect(slotStart(geometry, active, active)).toBe(active * pillStep(geometry));
    }
  });

  it('centers the icon of an inactive item in its 60-wide slot', () => {
    // item 0 inativo com o item 1 ativo: slot em 0, ícone em (60 − 22) / 2
    expect(iconLeft(geometry, 0, 1)).toBe(19);
    // item 3 inativo com o item 0 ativo: depois do ativo (146 + 4) e dos itens 1 e 2 (2 × 64)
    expect(iconLeft(geometry, 3, 0)).toBe(146 + 4 + 2 * STEP + 19);
  });

  it('centers icon and label together inside the active item', () => {
    // item 1 ativo (label de 80): grupo = 22 + 8 + 80 = 110, sobra 146 − 110 = 36, metade 18
    expect(iconLeft(geometry, 1, 1)).toBe(STEP + 18);
    expect(labelLeft(geometry, 1)).toBe(STEP + 18 + 22 + 8);
  });

  it('gives one icon position per possible active tab, in order', () => {
    const lefts = iconLeftsByActive(geometry, 1);
    expect(lefts).toHaveLength(COUNT);
    expect(lefts).toEqual([0, 1, 2, 3].map((active) => iconLeft(geometry, 1, active)));
    // aba 0 ativa: o ícone está depois do item largo, bem à direita do que fica nas outras abas
    expect(lefts[0]).toBeGreaterThan(lefts[2]);
    // ele mesmo ativo: ícone e label centralizados juntos no item largo
    expect(lefts[1]).toBe(STEP + 18);
    // abas 2 e 3 ativas: o ícone fica no mesmo lugar (o item dele está antes do ativo nos dois casos)
    expect(lefts[2]).toBe(lefts[3]);
    expect(lefts[2]).toBe(STEP + 19);
  });

  it('gives the longest label room for 96 points and clamps what is wider', () => {
    // 146 − 2 × 10 − 22 − 8 = 96
    expect(maxLabelWidth(geometry)).toBe(96);
    const wide = { ...geometry, labelWidths: [40, 400, 50, 45] };
    expect(labelWidthOf(wide, 1)).toBe(96);
    const start = slotStart(wide, 1, 1);
    expect(iconLeft(wide, 1, 1)).toBeGreaterThanOrEqual(start + wide.contentPadding);
    expect(labelLeft(wide, 1) + labelWidthOf(wide, 1)).toBeLessThanOrEqual(start + activeWidth(wide) - wide.contentPadding);
  });

  it('treats a label that was not measured yet as zero width', () => {
    const unmeasured = { ...geometry, labelWidths: [] };
    expect(labelWidthOf(unmeasured, 0)).toBe(0);
    expect(iconLeft(unmeasured, 0, 0)).toBe((146 - 22 - 8) / 2);
  });

  it('adapts the active width to a narrower device and still leaves room for the label', () => {
    const small = { ...geometry, containerWidth: 300 };
    expect(activeWidth(small)).toBe(288 - 180 - 12);
    expect(maxLabelWidth(small)).toBeGreaterThan(0);
  });

  it('works with a different number of tabs', () => {
    const three = { ...geometry, itemCount: 3, labelWidths: [40, 40, 40] };
    expect(activeWidth(three)).toBe(338 - 2 * 60 - 2 * 4);
    expect(iconLeftsByActive(three, 2)).toHaveLength(3);
  });
});
