import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import * as RootLayoutModule from '@/app/_layout';
import * as TabsLayoutModule from '@/app/(tabs)/_layout';
import CrewScreen from '@/app/(tabs)/crew';
import HomeScreen from '@/app/(tabs)/index';
import PassportScreen from '@/app/(tabs)/passport';
import ProfileScreen from '@/app/(tabs)/profile';
import { useAppFonts } from '@/hooks/useAppFonts';
import i18n from '@/i18n';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { colors } from '@/theme/tokens';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hide: jest.fn(),
}));
jest.mock('@/hooks/useAppFonts');
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
  useLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

const routes = {
  _layout: RootLayoutModule,
  '(tabs)/_layout': TabsLayoutModule,
  '(tabs)/index': HomeScreen,
  '(tabs)/passport': PassportScreen,
  '(tabs)/crew': CrewScreen,
  '(tabs)/profile': ProfileScreen,
};

const HOME = 'Bora pra um lugar que não é o de sempre?';

async function startApp(initialUrl = '/') {
  await AsyncStorage.clear();
  usePreferencesStore.setState({ language: 'pt-BR', onboardingDone: true });
  await usePreferencesStore.persist.rehydrate();
  await i18n.changeLanguage('pt-BR');
  return renderRouter(routes, { initialUrl });
}

describe('tabs', () => {
  beforeEach(() => {
    jest.mocked(useAppFonts).mockReturnValue(true);
  });

  it('opens on the Rolê tab, with the floating dock and its four tabs', async () => {
    await startApp();
    expect(await screen.findByText(HOME)).toBeOnTheScreen();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Rolê', selected: true })).toBeOnTheScreen();
  });

  it('lists the tabs in the order of the prototype: Rolê, Passaporte, Turma, Perfil', async () => {
    await startApp();
    await screen.findByText(HOME);
    expect(screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel)).toEqual([
      'Rolê',
      'Passaporte',
      'Turma',
      'Perfil',
    ]);
  });

  it.each([
    ['Passaporte', 'Passaporte'],
    ['Turma', 'Turma'],
    ['Perfil', 'Perfil'],
  ])('opens the %s screen and marks its tab as active', async (tab, title) => {
    await startApp();
    await fireEvent.press(await screen.findByRole('tab', { name: tab }));
    expect(await screen.findByRole('header', { name: title })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: tab, selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Rolê', selected: false })).toBeOnTheScreen();
  });

  it('shows "Em breve" on the crew tab', async () => {
    await startApp('/crew');
    expect(await screen.findByText('Em breve')).toBeOnTheScreen();
  });

  it('goes back to the Rolê tab', async () => {
    await startApp('/passport');
    await fireEvent.press(await screen.findByRole('tab', { name: 'Rolê' }));
    expect(await screen.findByText(HOME)).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Rolê', selected: true })).toBeOnTheScreen();
  });

  it('opens a deep link straight on the Passaporte tab', async () => {
    await startApp('/passport');
    expect(await screen.findByRole('header', { name: 'Passaporte' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Passaporte', selected: true })).toBeOnTheScreen();
  });

  it('gives each tab its own background, with no stripe of another color behind the dock', async () => {
    const view = await startApp();
    await screen.findByText(HOME);
    const home = JSON.stringify(await view.toJSON());
    expect(home).toContain(`"backgroundColor":"${colors.yellow}"`);
    expect(home).not.toContain(`"backgroundColor":"${colors.cream}"`);

    await fireEvent.press(screen.getByRole('tab', { name: 'Passaporte' }));
    await screen.findByRole('header', { name: 'Passaporte' });
    expect(JSON.stringify(await view.toJSON())).toContain(`"backgroundColor":"${colors.cream}"`);
  });

  it('translates the dock and the titles when the language changes, without leaving the tab', async () => {
    await startApp('/passport');
    await screen.findByRole('header', { name: 'Passaporte' });

    await act(async () => {
      usePreferencesStore.getState().setLanguage('en');
    });

    expect(await screen.findByRole('header', { name: 'Passport' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Passport', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Crew' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeOnTheScreen();
  });

  it('leaves room for the dock under every tab screen', async () => {
    await startApp();
    await screen.findByText(HOME);
    const scroll = screen.getByTestId('tab-screen-scroll');
    const flat = (scroll.props.contentContainerStyle as object[]).flat() as { paddingBottom?: number }[];
    expect(Object.assign({}, ...flat).paddingBottom).toBeGreaterThanOrEqual(106);
  });
});
