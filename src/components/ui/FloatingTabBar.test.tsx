import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getAnimatedStyle } from 'react-native-reanimated';

import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import ptBR from '@/i18n/locales/pt-BR.json';
import { colors, dock, height } from '@/theme/tokens';

import { FloatingTabBar, type FloatingTabBarItem } from './FloatingTabBar';
import { Compass } from './icons/Compass';
import { Passport } from './icons/Passport';
import { Profile } from './icons/Profile';
import { Users } from './icons/Users';

// Dock com as 4 abas da revisão de 02/10/2026, num aparelho de 390.
const CONTAINER_WIDTH = 350; // 390 com 20 de margem de cada lado
const ACTIVE_WIDTH = 146; // 350 − 12 − 3 × 60 − 3 × 4
const INACTIVE_WIDTH = 60;
const STEP = 64; // 60 + 4 de espaço
const LABEL_WIDTH = 80; // largura simulada dos labels (o Jest não mede texto)

interface Tabs {
  home: string;
  passport: string;
  crew: string;
  profile: string;
}

function itemsFor(tabs: Tabs): FloatingTabBarItem[] {
  return [
    { key: 'index', label: tabs.home, icon: Compass },
    { key: 'passport', label: tabs.passport, icon: Passport },
    { key: 'crew', label: tabs.crew, icon: Users },
    { key: 'profile', label: tabs.profile, icon: Profile },
  ];
}

const PT_ITEMS = itemsFor(ptBR.tabs);

const hidden = { includeHiddenElements: true };

function layoutEvent(width: number) {
  return { nativeEvent: { layout: { x: 0, y: 0, width, height: 0 } } };
}

/** O Jest não calcula layout: simulamos as medições que o dispositivo faria. */
async function measure(items: readonly FloatingTabBarItem[], labelWidth = LABEL_WIDTH) {
  await fireEvent(screen.getByTestId('floating-tab-bar'), 'layout', layoutEvent(CONTAINER_WIDTH));
  for (const item of items) {
    await fireEvent(screen.getByText(item.label, hidden), 'layout', layoutEvent(labelWidth));
  }
}

type Styled = Parameters<typeof getAnimatedStyle>[0];

function styleOf(element: Styled) {
  return getAnimatedStyle(element);
}

function translateXOf(style: object) {
  return ((style as { transform: { translateX: number }[] }).transform)[0].translateX;
}

function bar(activeIndex: number, extra: Partial<Parameters<typeof FloatingTabBar>[0]> = {}) {
  return (
    <FloatingTabBar items={PT_ITEMS} activeIndex={activeIndex} bottomInset={0} onPress={jest.fn()} {...extra} />
  );
}

describe('FloatingTabBar', () => {
  describe('accessibility and touch', () => {
    it('is a tab list with one tab per item, named after its label', async () => {
      await render(bar(0));
      expect(screen.getByTestId('floating-tab-bar')).toHaveProp('accessibilityRole', 'tablist');
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      for (const label of ['Rolê', 'Passaporte', 'Turma', 'Perfil']) {
        expect(screen.getByRole('tab', { name: label })).toBeOnTheScreen();
      }
    });

    it('marks only the active tab as selected', async () => {
      await render(bar(1));
      expect(screen.getAllByRole('tab', { selected: true })).toHaveLength(1);
      expect(screen.getByRole('tab', { name: 'Passaporte', selected: true })).toBeOnTheScreen();
    });

    it('uses the accessibility label when the item has one (icon-only tabs)', async () => {
      const items = PT_ITEMS.map((item) => ({ ...item, accessibilityLabel: `Ir para ${item.label}` }));
      await render(bar(0, { items }));
      expect(screen.getByRole('tab', { name: 'Ir para Perfil' })).toBeOnTheScreen();
    });

    it('reports the index of the pressed tab, and of a long press', async () => {
      const onPress = jest.fn();
      const onLongPress = jest.fn();
      await render(bar(0, { onPress, onLongPress }));
      await fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
      expect(onPress).toHaveBeenCalledWith(3);
      await fireEvent(screen.getByRole('tab', { name: 'Passaporte' }), 'longPress');
      expect(onLongPress).toHaveBeenCalledWith(1);
    });

    it('hides the visual layer from screen readers, so each tab is read once', async () => {
      await render(bar(0));
      expect(screen.queryByText('Rolê')).not.toBeOnTheScreen();
      expect(screen.getByText('Rolê', hidden)).toBeOnTheScreen();
    });

    it('follows the final layout of each state: wide active touch area, 60-wide inactive ones', async () => {
      await render(bar(1));
      await measure(PT_ITEMS);
      expect(screen.getByRole('tab', { name: 'Passaporte' })).toHaveStyle({ width: ACTIVE_WIDTH, height: height.dockItem });
      for (const label of ['Rolê', 'Turma', 'Perfil']) {
        expect(screen.getByRole('tab', { name: label })).toHaveStyle({ width: INACTIVE_WIDTH, height: height.dockItem });
      }
      expect(dock.inactiveItemWidth).toBe(INACTIVE_WIDTH);
      expect(dock.inactiveItemWidth).toBeGreaterThanOrEqual(height.minTouch);
      expect(height.dockItem).toBeGreaterThanOrEqual(height.minTouch);
    });
  });

  describe('placement', () => {
    it('sits above the bottom safe area, on top of the content', async () => {
      await render(bar(0, { bottomInset: 34 }));
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({
        position: 'absolute',
        left: dock.sideMargin,
        right: dock.sideMargin,
        bottom: dock.bottomMargin + 34,
        backgroundColor: colors.ink,
      });
    });

    it('stays invisible until the dock and every label were measured', async () => {
      await render(bar(0));
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 0 });

      await fireEvent(screen.getByTestId('floating-tab-bar'), 'layout', layoutEvent(CONTAINER_WIDTH));
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 0 });

      await measure(PT_ITEMS);
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 1 });
    });
  });

  describe('animation', () => {
    /** Propriedades de estilo cujo valor mudou entre dois instantes: é o que foi de fato animado. */
    function changedKeys(before: Record<string, unknown>, after: Record<string, unknown>) {
      return Object.keys({ ...before, ...after })
        .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        .sort();
    }

    // o estilo animado só se aplica no quadro seguinte: avança os timers para ele assentar
    async function settle() {
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
    }

    /** Renderiza na aba `from`, mede e anima até a aba `to`; devolve os estilos antes e depois. */
    async function slide(target: () => Styled, from: number, to: number) {
      jest.useFakeTimers();
      try {
        const view = await render(bar(from));
        await measure(PT_ITEMS);
        await settle();
        const element = target();
        const before = { ...styleOf(element) };
        await view.rerender(bar(to));
        await settle();
        return { before, after: { ...styleOf(element) } };
      } finally {
        jest.useRealTimers();
      }
    }

    it('draws one fixed-width yellow pill at the position of the active tab', async () => {
      await render(bar(1));
      await measure(PT_ITEMS);
      const pill = screen.getByTestId('floating-tab-bar-pill', hidden);
      expect(pill).toHaveStyle({ width: ACTIVE_WIDTH, backgroundColor: colors.yellow });
      expect(translateXOf(styleOf(pill))).toBe(STEP);
    });

    it('slides the pill with translateX only, keeping its width, to each tab', async () => {
      for (const to of [1, 2, 3]) {
        const { before, after } = await slide(() => screen.getByTestId('floating-tab-bar-pill', hidden), 0, to);
        expect(changedKeys(before, after)).toEqual(['transform']);
        expect(translateXOf(before)).toBe(0);
        expect(translateXOf(after)).toBeCloseTo(to * STEP, 1);
        expect(before.width).toBe(ACTIVE_WIDTH);
        expect(after.width).toBe(ACTIVE_WIDTH);
      }
    });

    it('fades the label of the old tab out with opacity and transform only', async () => {
      const { before, after } = await slide(() => screen.getByText('Rolê', hidden).parent!, 0, 3);
      expect(before.opacity).toBe(1);
      expect(after.opacity).toBe(0);
      expect(changedKeys(before, after).every((key) => key === 'opacity' || key === 'transform')).toBe(true);
    });

    it('fades the label of the new tab in', async () => {
      const { before, after } = await slide(() => screen.getByText('Perfil', hidden).parent!, 0, 3);
      expect(before.opacity).toBe(0);
      expect(after.opacity).toBe(1);
    });

    it('moves the icon from inside the wide item to its centered 60-wide slot, with transform only', async () => {
      const { before, after } = await slide(() => screen.getByTestId('floating-tab-bar-icon-index', hidden), 0, 3);
      // ativo (label de 80): grupo 22 + 8 + 80 = 110 centrado em 146 → começa em 18; inativo: (60 − 22) / 2 = 19
      expect(translateXOf(before)).toBeCloseTo(18, 1);
      expect(translateXOf(after)).toBeCloseTo(19, 1);
      expect(changedKeys(before, after)).toEqual(['transform']);
    });

    it('moves the icon of the new tab into the wide item', async () => {
      const { before, after } = await slide(() => screen.getByTestId('floating-tab-bar-icon-profile', hidden), 0, 3);
      // aba 0 ativa: o ícone 3 fica depois do item largo (146 + 4) e dos itens 1 e 2 (2 × 64), mais 19
      expect(translateXOf(before)).toBeCloseTo(146 + 4 + 2 * STEP + 19, 1);
      // aba 3 ativa: o item largo começa em 3 × 64 = 192; grupo centrado → 192 + 18
      expect(translateXOf(after)).toBeCloseTo(3 * STEP + 18, 1);
    });

    it('shows the label of the active tab and hides the others', async () => {
      await render(bar(1));
      await measure(PT_ITEMS);
      const labelOf = (text: string) => screen.getByText(text, hidden).parent!;
      expect(styleOf(labelOf('Passaporte')).opacity).toBe(1);
      for (const label of ['Rolê', 'Turma', 'Perfil']) {
        expect(styleOf(labelOf(label)).opacity).toBe(0);
      }
    });
  });

  describe('languages', () => {
    const LANGUAGES = { 'pt-BR': ptBR.tabs, en: en.tabs, es: es.tabs };

    it.each(Object.entries(LANGUAGES))('renders the four labels in %s', async (_language, tabs) => {
      const items = itemsFor(tabs);
      await render(bar(1, { items }));
      await measure(items);
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getByRole('tab', { name: tabs.passport, selected: true })).toBeOnTheScreen();
      expect(screen.getByRole('tab', { name: tabs.profile })).toBeOnTheScreen();
      expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ opacity: 1 });
    });

    function labelStyle(text: string) {
      const flat = (screen.getByText(text, hidden).parent!.props.style as object[]).flat() as Record<string, unknown>[];
      return Object.assign({}, ...flat) as { left: number; maxWidth: number };
    }

    it('re-measures when the language changes and re-centers the icon and label together', async () => {
      const view = await render(bar(1, { items: itemsFor(es.tabs) }));
      await measure(itemsFor(es.tabs), 60);
      const leftBefore = labelStyle(es.tabs.passport).left;

      await view.rerender(bar(1, { items: itemsFor(ptBR.tabs) }));
      // a tradução nova é mais larga; o dock mede de novo
      for (const key of ['home', 'passport', 'crew', 'profile'] as const) {
        await fireEvent(screen.getByText(ptBR.tabs[key], hidden), 'layout', layoutEvent(90));
      }
      const leftAfter = labelStyle(ptBR.tabs.passport).left;

      // grupo mais largo (22 + 8 + 90 contra 22 + 8 + 60): o início anda (90 − 60) / 2 = 15 para a esquerda
      expect(leftBefore - leftAfter).toBeCloseTo(15, 5);
    });

    it('never lets the widest label overflow the active item', async () => {
      const items = itemsFor({
        home: 'Rolê',
        passport: 'Passaporte muito mais comprido que o normal',
        crew: 'Turma',
        profile: 'Perfil',
      });
      await render(bar(1, { items }));
      await measure(items, 400);
      const { maxWidth, left } = labelStyle(items[1].label);
      // cabe com a folga mínima dos dois lados: 146 − 20 − 22 − 8 = 96
      expect(maxWidth).toBe(96);
      expect(left + maxWidth).toBeLessThanOrEqual(STEP + ACTIVE_WIDTH - 10);
    });
  });
});
