import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter, testRouter } from 'expo-router/testing-library';
import * as RootLayoutModule from '@/app/_layout';
import * as OnboardingLayoutModule from '@/app/onboarding/_layout';
import * as TabsLayoutModule from '@/app/(tabs)/_layout';
import CrewScreen from '@/app/(tabs)/crew';
import HomeScreen from '@/app/(tabs)/index';
import PassportScreen from '@/app/(tabs)/passport';
import ProfileScreen from '@/app/(tabs)/profile';
import LocationScreen from '@/app/onboarding/location';
import NoLocationScreen from '@/app/onboarding/no-location';
import WelcomeScreen from '@/app/onboarding/welcome';
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

const WELCOME = 'Diga seu humor. A gente escolhe o lugar.';
const LOCATION = 'Onde você tá?';
const NO_LOCATION = 'Sem localização, a gente chuta no escuro.';
const HOME = 'Bora pra um lugar que não é o de sempre?';

const routes = {
  _layout: RootLayoutModule,
  '(tabs)/_layout': TabsLayoutModule,
  '(tabs)/index': HomeScreen,
  '(tabs)/passport': PassportScreen,
  '(tabs)/crew': CrewScreen,
  '(tabs)/profile': ProfileScreen,
  'onboarding/_layout': OnboardingLayoutModule,
  'onboarding/welcome': WelcomeScreen,
  'onboarding/location': LocationScreen,
  'onboarding/no-location': NoLocationScreen,
};

async function startApp(options?: { onboardingDone?: boolean; initialUrl?: string }) {
  await AsyncStorage.clear();
  usePreferencesStore.setState({ language: 'pt-BR', onboardingDone: options?.onboardingDone ?? false });
  await usePreferencesStore.persist.rehydrate();
  await i18n.changeLanguage('pt-BR');
  return renderRouter(routes, { initialUrl: options?.initialUrl ?? '/' });
}

describe('onboarding gate', () => {
  beforeEach(() => {
    jest.mocked(useAppFonts).mockReturnValue(true);
  });

  describe('first open', () => {
    it('opens the welcome screen, not the home', async () => {
      await startApp();
      expect(await screen.findByText(WELCOME)).toBeOnTheScreen();
      expect(screen.queryByText(HOME)).not.toBeOnTheScreen();
    });

    it('opens the welcome screen even when the link points to a protected route', async () => {
      await startApp({ initialUrl: '/passport' });
      expect(await screen.findByText(WELCOME)).toBeOnTheScreen();
      expect(screen.queryByText('Passaporte')).not.toBeOnTheScreen();
    });

    it('starts the group at the welcome screen, not at the first file in alphabetical order', async () => {
      await startApp();
      await screen.findByText(WELCOME);
      expect(screen.queryByText(LOCATION)).not.toBeOnTheScreen();
    });
  });

  describe('the flow', () => {
    it('goes welcome → location with "Começar"', async () => {
      await startApp();
      await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
      expect(await screen.findByText(LOCATION)).toBeOnTheScreen();
    });

    it('goes location → no-location with "Agora não"', async () => {
      await startApp();
      await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Agora não' }));
      expect(await screen.findByText(NO_LOCATION)).toBeOnTheScreen();
    });

    it('goes back one step with the back button', async () => {
      await startApp();
      await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
      await screen.findByText(LOCATION);
      await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
      expect(await screen.findByText(WELCOME)).toBeOnTheScreen();
    });

    it('finishes from "Usar minha localização" and opens the home', async () => {
      await startApp();
      await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Usar minha localização' }));
      expect(await screen.findByText(HOME)).toBeOnTheScreen();
      expect(usePreferencesStore.getState().onboardingDone).toBe(true);
    });

    it('finishes from "Usar esse ponto" and opens the home', async () => {
      await startApp();
      await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Agora não' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Usar esse ponto' }));
      expect(await screen.findByText(HOME)).toBeOnTheScreen();
      expect(usePreferencesStore.getState().onboardingDone).toBe(true);
    });

    it('does not keep the onboarding in the history after it ends', async () => {
      await startApp();
      await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Usar minha localização' }));
      await screen.findByText(HOME);
      expect(screen.queryByText(WELCOME)).not.toBeOnTheScreen();
      // nada para onde voltar: a `welcome` e as telas do onboarding saíram do histórico
      expect(testRouter.canGoBack()).toBe(false);
    });

    it('saves the flag, so the next open skips the onboarding', async () => {
      await startApp();
      await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Usar minha localização' }));
      await waitFor(async () => {
        const saved = JSON.parse((await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)) ?? 'null');
        expect(saved.state.onboardingDone).toBe(true);
      });
      // deixa a navegação para a home terminar antes do teste acabar: um `act` pendente contaminaria o próximo
      expect(await screen.findByText(HOME)).toBeOnTheScreen();
    });
  });

  describe('after the onboarding', () => {
    it('opens the home straight away', async () => {
      await startApp({ onboardingDone: true });
      expect(await screen.findByText(HOME)).toBeOnTheScreen();
      expect(screen.queryByText(WELCOME)).not.toBeOnTheScreen();
    });

    it('opens a deep link to a released route', async () => {
      await startApp({ onboardingDone: true, initialUrl: '/passport' });
      expect(await screen.findByRole('header', { name: 'Passaporte' })).toBeOnTheScreen();
    });

    it('does not let anyone back into the onboarding', async () => {
      await startApp({ onboardingDone: true, initialUrl: '/onboarding/welcome' });
      expect(await screen.findByText(HOME)).toBeOnTheScreen();
      expect(screen.queryByText(WELCOME)).not.toBeOnTheScreen();
    });
  });
});
