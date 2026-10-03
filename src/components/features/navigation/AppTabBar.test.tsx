import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import i18n from '@/i18n';

import { AppTabBar } from './AppTabBar';

const hidden = { includeHiddenElements: true };

const ROUTES = [
  { key: 'index-1', name: 'index' },
  { key: 'passport-2', name: 'passport' },
  { key: 'crew-3', name: 'crew' },
  { key: 'profile-4', name: 'profile' },
];

const TITLES: Record<string, string> = {
  'index-1': 'Rolê',
  'passport-2': 'Passaporte',
  'crew-3': 'Turma',
  'profile-4': 'Perfil',
};

/** Props mínimas do `tabBar` do React Navigation: só o que o adaptador lê. */
function makeProps(overrides: { index?: number; defaultPrevented?: boolean; bottom?: number } = {}) {
  const emit = jest.fn(() => ({ defaultPrevented: overrides.defaultPrevented ?? false }));
  const navigate = jest.fn();
  const props = {
    state: { index: overrides.index ?? 0, routes: ROUTES },
    descriptors: Object.fromEntries(
      ROUTES.map((route) => [route.key, { options: { title: TITLES[route.key] } }]),
    ),
    navigation: { emit, navigate },
    insets: { top: 0, left: 0, right: 0, bottom: overrides.bottom ?? 0 },
  };
  return { props: props as unknown as BottomTabBarProps, emit, navigate };
}

describe('AppTabBar', () => {
  beforeEach(async () => {
    await act(() => i18n.changeLanguage('pt-BR'));
  });

  it('names the tab list in the active language', async () => {
    const { props } = makeProps();
    const view = await render(<AppTabBar {...props} />);
    expect(screen.getByLabelText('Principal')).toBeOnTheScreen();
    await act(() => i18n.changeLanguage('en'));
    await view.rerender(<AppTabBar {...props} />);
    expect(screen.getByLabelText('Main')).toBeOnTheScreen();
  });

  it('draws one dock item per route, labeled by the screen title', async () => {
    const { props } = makeProps();
    await render(<AppTabBar {...props} />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    for (const title of ['Rolê', 'Passaporte', 'Turma', 'Perfil']) {
      expect(screen.getByRole('tab', { name: title })).toBeOnTheScreen();
    }
    expect(screen.getByText('Rolê', hidden)).toBeOnTheScreen();
  });

  it('marks the focused route as the active tab', async () => {
    const { props } = makeProps({ index: 2 });
    await render(<AppTabBar {...props} />);
    expect(screen.getByRole('tab', { name: 'Turma', selected: true })).toBeOnTheScreen();
    expect(screen.getAllByRole('tab', { selected: true })).toHaveLength(1);
  });

  it('uses the accessibility label of the route when it has one', async () => {
    const { props } = makeProps();
    const withLabel = {
      ...props,
      descriptors: {
        ...props.descriptors,
        'crew-3': { options: { title: 'Turma', tabBarAccessibilityLabel: 'Ir para a Turma' } },
      },
    } as unknown as BottomTabBarProps;
    await render(<AppTabBar {...withLabel} />);
    expect(screen.getByRole('tab', { name: 'Ir para a Turma' })).toBeOnTheScreen();
  });

  it('keeps the dock above the bottom safe area', async () => {
    const { props } = makeProps({ bottom: 34 });
    await render(<AppTabBar {...props} />);
    expect(screen.getByTestId('floating-tab-bar')).toHaveStyle({ bottom: 22 + 34 });
  });

  describe('pressing a tab', () => {
    it('warns the screen first and then navigates to the route', async () => {
      const { props, emit, navigate } = makeProps();
      await render(<AppTabBar {...props} />);
      await fireEvent.press(screen.getByRole('tab', { name: 'Passaporte' }));
      expect(emit).toHaveBeenCalledWith({ type: 'tabPress', target: 'passport-2', canPreventDefault: true });
      expect(navigate).toHaveBeenCalledWith('passport', undefined);
      // o aviso vem antes da navegação
      expect(emit.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
    });

    it('does not navigate when the screen cancels the press', async () => {
      const { props, emit, navigate } = makeProps({ defaultPrevented: true });
      await render(<AppTabBar {...props} />);
      await fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
      expect(emit).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not navigate again to the tab that is already active', async () => {
      const { props, emit, navigate } = makeProps({ index: 1 });
      await render(<AppTabBar {...props} />);
      await fireEvent.press(screen.getByRole('tab', { name: 'Passaporte' }));
      // a tela ainda é avisada (ela pode rolar para o topo), mas não há navegação
      expect(emit).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('emits the long press event of the route', async () => {
      const { props, emit } = makeProps();
      await render(<AppTabBar {...props} />);
      await fireEvent(screen.getByRole('tab', { name: 'Turma' }), 'longPress');
      expect(emit).toHaveBeenCalledWith({ type: 'tabLongPress', target: 'crew-3' });
    });
  });

  it('ignores a route that has no icon instead of breaking the bar', async () => {
    const { props } = makeProps();
    const withExtra = {
      ...props,
      state: { index: 0, routes: [...ROUTES, { key: 'other-5', name: 'other' }] },
    } as unknown as BottomTabBarProps;
    await render(<AppTabBar {...withExtra} />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
});
