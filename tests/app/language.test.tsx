import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import * as RootLayoutModule from '@/app/_layout';
import * as TabsLayoutModule from '@/app/(tabs)/_layout';
import CrewScreen from '@/app/(tabs)/crew';
import HomeScreen from '@/app/(tabs)/index';
import PassportScreen from '@/app/(tabs)/passport';
import ProfileScreen from '@/app/(tabs)/profile';
import LanguageScreen from '@/app/language';
import { useAppFonts } from '@/hooks/useAppFonts';
import i18n from '@/i18n';
import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from '@/stores/preferencesStore';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hide: jest.fn(),
}));
jest.mock('@/hooks/useAppFonts');
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
  useLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

const STUB_ROUTES = [
  'suggestion',
  'place/[id]',
  'on-the-way',
  'feedback',
  'stamp',
  'stamp/[id]',
  'story',
  'no-match',
  'offline',
  'report-problem',
  'plus',
];

const routes = {
  _layout: RootLayoutModule,
  '(tabs)/_layout': TabsLayoutModule,
  '(tabs)/index': HomeScreen,
  '(tabs)/passport': PassportScreen,
  '(tabs)/crew': CrewScreen,
  '(tabs)/profile': ProfileScreen,
  language: LanguageScreen,
  // o layout raiz declara todas as rotas empilhadas; sem arquivo o Expo Router avisa de cada uma
  ...Object.fromEntries(STUB_ROUTES.map((name) => [name, () => null])),
};

async function startAtProfile(language: 'system' | 'pt-BR' = 'pt-BR') {
  await AsyncStorage.clear();
  usePreferencesStore.setState({ language, onboardingDone: true });
  await usePreferencesStore.persist.rehydrate();
  await i18n.changeLanguage(language === 'system' ? 'en' : language);
  return renderRouter(routes, { initialUrl: '/profile' });
}

describe('language setting', () => {
  beforeEach(() => {
    jest.mocked(useAppFonts).mockReturnValue(true);
  });

  it('shows the Settings section on the profile with the current language', async () => {
    await startAtProfile('pt-BR');
    expect(await screen.findByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Idioma, Português (Brasil)' })).toBeOnTheScreen();
  });

  it('shows "device language" as the current value when following the device', async () => {
    await startAtProfile('system');
    expect(await screen.findByRole('button', { name: 'Language, Device language' })).toBeOnTheScreen();
  });

  it('opens the language list with the active option checked', async () => {
    await startAtProfile('pt-BR');
    await fireEvent.press(await screen.findByRole('button', { name: 'Idioma, Português (Brasil)' }));
    expect(await screen.findByRole('radio', { name: 'Português (Brasil)', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'English', checked: false })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Español', checked: false })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Idioma do aparelho', checked: false })).toBeOnTheScreen();
  });

  it('switches the language right away, saves the choice and updates the tabs', async () => {
    await startAtProfile('pt-BR');
    await fireEvent.press(await screen.findByRole('button', { name: 'Idioma, Português (Brasil)' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'English' }));

    expect(await screen.findByRole('radio', { name: 'English', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Language' })).toBeOnTheScreen();
    expect(usePreferencesStore.getState().language).toBe('en');
    expect(JSON.parse((await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)) ?? '{}').state.language).toBe('en');

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByRole('header', { name: 'Settings' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Language, English' })).toBeOnTheScreen();
  });

  it('goes back to following the device', async () => {
    await startAtProfile('pt-BR');
    await fireEvent.press(await screen.findByRole('button', { name: 'Idioma, Português (Brasil)' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Idioma do aparelho' }));
    expect(usePreferencesStore.getState().language).toBe('system');
    // o aparelho do teste está em inglês
    expect(await screen.findByRole('radio', { name: 'Device language', checked: true })).toBeOnTheScreen();
  });
});
