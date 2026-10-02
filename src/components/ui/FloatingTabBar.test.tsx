import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getAnimatedStyle } from 'react-native-reanimated';

import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import ptBR from '@/i18n/locales/pt-BR.json';
import { colors, dock, height } from '@/theme/tokens';

import { FloatingTabBar, type FloatingTabBarItem } from './FloatingTabBar';
import { Compass } from './icons/Compass';
import { Passport } from './icons/Passport';
import { Users } from './icons/Users';

const CONTAINER_WIDTH = 350; // aparelho de 390 com 20 de margem de cada lado
const ACTIVE_WIDTH = 202; // 350 − 12 − 2 × 64 − 2 × 4

function itemsFor(tabs: { home: string; passport: string; crew: string }): FloatingTabBarItem[] {
  return [
    { key: 'index', label: tabs.home, icon: Compass },
    { key: 'passport', label: tabs.passport, icon: Passport },
    { key: 'crew', label: tabs.crew, icon: Users },
  ];
}

const PT_ITEMS = itemsFor(ptBR.tabs);

const hidden = { includeHiddenElements: true };

function layoutEvent(width: number) {
  return { nativeEvent: { layout: { x: 0, y: 0, width, height: 0 } } };
}

/** O Jest não calcula layout: simulamos as medições que o dispositivo faria. */
async function measure(items: readonly FloatingTabBarItem[], labelWidth = 80) {
  await fireEvent(screen.getByTestId('floating-tab-bar'), 'layout', layoutEvent(CONTAINER_WIDTH));
  for (const item of items) {
    await fireEvent(screen.getByText(item.label, hidden), 'layout', layoutEvent(labelWidth));
  }
}

function styleOf(element: Parameters<typeof getAnimatedStyle>[0]) {
  return getAnimatedStyle(element);
}

function translateXOf(element: Parameters<typeof getAnimatedStyle>[0]) {
  const transform = styleOf(element).transform as { translateX: number }[];
  return transform[0].translateX;
}

describe('FloatingTabBar', () => {
  describe('accessibility and touch', () => {
    it('is a tab list with one tab per item, named after its label', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={0} bottomInset={0} onPress={jest.fn()} />);
      expect(screen.getByTestId('floating-tab-bar')).toHaveProp('accessibilityRole', 'tablist');
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(screen.getByRole('tab', { name: 'Rolê' })).toBeOnTheScreen();
      expect(screen.getByRole('tab', { name: 'Passaporte' })).toBeOnTheScreen();
      expect(screen.getByRole('tab', { name: 'Turma' })).toBeOnTheScreen();
    });

    it('marks only the active tab as selected', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={1} bottomInset={0} onPress={jest.fn()} />);
      expect(screen.getAllByRole('tab', { selected: true })).toHaveLength(1);
      expect(screen.getByRole('tab', { name: 'Passaporte', selected: true })).toBeOnTheScreen();
    });

    it('uses the accessibility label when the item has one (icon-only tabs)', async () => {
      const items = PT_ITEMS.map((item) => ({ ...item, accessibilityLabel: `Ir para ${item.label}` }));
      await render(<FloatingTabBar items={items} activeIndex={0} bottomInset={0} onPress={jest.fn()} />);
      expect(screen.getByRole('tab', { name: 'Ir para Turma' })).toBeOnTheScreen();
    });

    it('reports the index of the pressed tab, and of a long press', async () => {
      const onPress = jest.fn();
      const onLongPress = jest.fn();
      await render(
        <FloatingTabBar items={PT_ITEMS} activeIndex={0} bottomInset={0} onPress={onPress} onLongPress={onLongPress} />,
      );
      await fireEvent.press(screen.getByRole('tab', { name: 'Turma' }));
      expect(onPress).toHaveBeenCalledWith(2);
      await fireEvent(screen.getByRole('tab', { name: 'Passaporte' }), 'longPress');
      expect(onLongPress).toHaveBeenCalledWith(1);
    });

    it('hides the visual layer from screen readers, so each tab is read once', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={0} bottomInset={0} onPress={jest.fn()} />);
      expect(screen.queryByText('Rolê')).not.toBeOnTheScreen();
      expect(screen.getByText('Rolê', hidden)).toBeOnTheScreen();
    });

    it('follows the final layout of each state: wide active touch area, 64-wide inactive ones', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={1} bottomInset={0} onPress={jest.fn()} />);
      await measure(PT_ITEMS);
      expect(screen.getByRole('tab', { name: 'Passaporte' })).toHaveStyle({ width: ACTIVE_WIDTH, height: height.dockItem });
      expect(screen.getByRole('tab', { name: 'Rolê' })).toHaveStyle({ width: dock.inactiveItemWidth, height: height.dockItem });
      expect(screen.getByRole('tab', { name: 'Turma' })).toHaveStyle({ width: dock.inactiveItemWidth });
      expect(dock.inactiveItemWidth).toBeGreaterThanOrEqual(height.minTouch);
      expect(height.dockItem).toBeGreaterThanOrEqual(height.minTouch);
    });
  });

  describe('placement', () => {
    it('sits above the bottom safe area, on top of the content', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={0} bottomInset={34} onPress={jest.fn()} />);
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({
        position: 'absolute',
        left: dock.sideMargin,
        right: dock.sideMargin,
        bottom: dock.bottomMargin + 34,
        backgroundColor: colors.ink,
      });
    });

    it('stays invisible until the dock and every label were measured', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={0} bottomInset={0} onPress={jest.fn()} />);
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 0 });

      await fireEvent(screen.getByTestId('floating-tab-bar'), 'layout', layoutEvent(CONTAINER_WIDTH));
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 0 });

      await measure(PT_ITEMS);
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 1 });
    });
  });

  describe('animation', () => {
    type Styled = Parameters<typeof getAnimatedStyle>[0];

    /** Propriedades de estilo cujo valor mudou entre dois instantes: é o que foi de fato animado. */
    function changedKeys(before: Record<string, unknown>, after: Record<string, unknown>) {
      return Object.keys({ ...before, ...after })
        .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        .sort();
    }

    async function settle() {
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
    }

    /** Renderiza na aba `from`, mede e anima até a aba `to`; devolve os estilos antes e depois. */
    async function slide(element: Styled | (() => Styled), from: number, to: number) {
      jest.useFakeTimers();
      try {
        const view = await render(
          <FloatingTabBar items={PT_ITEMS} activeIndex={from} bottomInset={0} onPress={jest.fn()} />,
        );
        await measure(PT_ITEMS);
        // o estilo animado só se aplica no quadro seguinte: deixa o estado inicial assentar
        await settle();
        const target = typeof element === 'function' ? element() : element;
        const before = { ...styleOf(target) };
        await view.rerender(<FloatingTabBar items={PT_ITEMS} activeIndex={to} bottomInset={0} onPress={jest.fn()} />);
        await settle();
        return { before, after: { ...styleOf(target) } };
      } finally {
        jest.useRealTimers();
      }
    }

    it('draws one fixed-width yellow pill at the position of the active tab', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={1} bottomInset={0} onPress={jest.fn()} />);
      await measure(PT_ITEMS);
      const pill = screen.getByTestId('floating-tab-bar-pill', hidden);
      expect(pill).toHaveStyle({ width: ACTIVE_WIDTH, backgroundColor: colors.yellow });
      expect(translateXOf(pill)).toBe(dock.inactiveItemWidth + dock.gap);
    });

    it('slides the pill with translateX only, keeping its width, to each tab', async () => {
      const { before, after } = await slide(() => screen.getByTestId('floating-tab-bar-pill', hidden), 0, 2);
      expect(changedKeys(before, after)).toEqual(['transform']);
      expect((before.transform as { translateX: number }[])[0].translateX).toBe(0);
      expect((after.transform as { translateX: number }[])[0].translateX).toBeCloseTo(
        2 * (dock.inactiveItemWidth + dock.gap),
        1,
      );
      expect(after.width).toBe(ACTIVE_WIDTH);
      expect(before.width).toBe(ACTIVE_WIDTH);
    });

    it('fades the label of the old tab out with opacity and transform only', async () => {
      const { before, after } = await slide(() => screen.getByText('Rolê', hidden).parent!, 0, 2);
      expect(before.opacity).toBe(1);
      expect(after.opacity).toBe(0);
      expect(changedKeys(before, after).every((key) => key === 'opacity' || key === 'transform')).toBe(true);
    });

    it('fades the label of the new tab in', async () => {
      const { before, after } = await slide(() => screen.getByText('Turma', hidden).parent!, 0, 2);
      expect(before.opacity).toBe(0);
      expect(after.opacity).toBe(1);
    });

    it('moves the icon from inside the wide item to its centered 64-wide slot, with transform only', async () => {
      const { before, after } = await slide(() => screen.getByTestId('floating-tab-bar-icon-index', hidden), 0, 2);
      // ativo (label de 80): grupo 22 + 8 + 80 = 110 centrado em 202 → começa em 46; inativo: (64 − 22) / 2 = 21
      expect((before.transform as { translateX: number }[])[0].translateX).toBeCloseTo(46, 1);
      expect((after.transform as { translateX: number }[])[0].translateX).toBeCloseTo(21, 1);
      expect(changedKeys(before, after)).toEqual(['transform']);
    });

    it('moves the icon of the new tab into the wide item', async () => {
      const { before, after } = await slide(() => screen.getByTestId('floating-tab-bar-icon-crew', hidden), 0, 2);
      // aba 0 ativa: o ícone 2 fica depois do item largo (202 + 4) e do item 1 (68), mais 21 de centralização
      expect((before.transform as { translateX: number }[])[0].translateX).toBeCloseTo(202 + 4 + 68 + 21, 1);
      // aba 2 ativa: grupo 22 + 8 + 80 centrado no item que começa em 136 → 136 + 46
      expect((after.transform as { translateX: number }[])[0].translateX).toBeCloseTo(136 + 46, 1);
    });

    it('shows the label of the active tab and hides the others', async () => {
      await render(<FloatingTabBar items={PT_ITEMS} activeIndex={1} bottomInset={0} onPress={jest.fn()} />);
      await measure(PT_ITEMS);
      const labelOf = (text: string) => screen.getByText(text, hidden).parent!;
      expect(styleOf(labelOf('Passaporte')).opacity).toBe(1);
      expect(styleOf(labelOf('Rolê')).opacity).toBe(0);
      expect(styleOf(labelOf('Turma')).opacity).toBe(0);
    });
  });

  describe('languages', () => {
    const LANGUAGES = { 'pt-BR': ptBR.tabs, en: en.tabs, es: es.tabs };

    it.each(Object.entries(LANGUAGES))('renders the labels in %s', async (_language, tabs) => {
      const items = itemsFor(tabs);
      await render(<FloatingTabBar items={items} activeIndex={1} bottomInset={0} onPress={jest.fn()} />);
      await measure(items);
      expect(screen.getByRole('tab', { name: tabs.passport, selected: true })).toBeOnTheScreen();
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 1 });
    });

    it('re-measures when the language changes and re-centers the icon and label together', async () => {
      const view = await render(
        <FloatingTabBar items={itemsFor(es.tabs)} activeIndex={1} bottomInset={0} onPress={jest.fn()} />,
      );
      await measure(itemsFor(es.tabs), 60);
      const before = screen.getByText(es.tabs.passport, hidden).parent!;
      const leftBefore = (before.props.style as { left: number }[]).flat().find((style) => style?.left != null)!.left;

      await view.rerender(
          <FloatingTabBar items={itemsFor(ptBR.tabs)} activeIndex={1} bottomInset={0} onPress={jest.fn()} />,
        );
      // a tradução nova é mais larga; o dock perde a medida antiga e mede de novo
      await fireEvent(screen.getByText(ptBR.tabs.passport, hidden), 'layout', layoutEvent(100));
      for (const key of ['home', 'crew'] as const) {
        await fireEvent(screen.getByText(ptBR.tabs[key], hidden), 'layout', layoutEvent(100));
      }
      const after = screen.getByText(ptBR.tabs.passport, hidden).parent!;
      const leftAfter = (after.props.style as { left: number }[]).flat().find((style) => style?.left != null)!.left;

      // grupo mais largo (22 + 8 + 100 contra 22 + 8 + 60): o início anda 20 / 2 = 10 para a esquerda
      expect(leftBefore - leftAfter).toBeCloseTo(20, 5);
    });

    it('never lets the widest label overflow the active item', async () => {
      const items = itemsFor({ home: 'Rolê', passport: 'Passaporte muito mais comprido que o normal', crew: 'Turma' });
      await render(<FloatingTabBar items={items} activeIndex={1} bottomInset={0} onPress={jest.fn()} />);
      await measure(items, 400);
      const label = screen.getByText(items[1].label, hidden).parent!;
      const flat = (label.props.style as object[]).flat() as { maxWidth?: number; left?: number }[];
      const { maxWidth, left } = Object.assign({}, ...flat) as { maxWidth: number; left: number };
      // cabe com a folga mínima dos dois lados: 202 − 20 − 22 − 8 = 152
      expect(maxWidth).toBe(152);
      expect(left + maxWidth).toBeLessThanOrEqual(68 + ACTIVE_WIDTH - 10);
    });
  });
});
