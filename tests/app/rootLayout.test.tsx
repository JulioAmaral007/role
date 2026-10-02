import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { fireEvent, screen, within } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { renderRouter } from 'expo-router/testing-library';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import * as RootLayoutModule from '@/app/_layout';
import { useAppFonts } from '@/hooks/useAppFonts';
import i18n from '@/i18n';
import { usePreferencesStore } from '@/stores/preferencesStore';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hide: jest.fn(),
}));
jest.mock('@/hooks/useAppFonts');
// No Jest o contêiner de gestos vira uma `View` comum; este mock o torna identificável.
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const actual = jest.requireActual('react-native-gesture-handler');
  return {
    ...actual,
    GestureHandlerRootView: ({ children, style }: { children: unknown; style: unknown }) => (
      <View testID="gesture-root" style={style as never}>
        {children as never}
      </View>
    ),
  };
});
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
  useLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

const mockedFonts = jest.mocked(useAppFonts);
const mockedHide = jest.mocked(SplashScreen.hide);

function Home() {
  const { t } = useTranslation();
  const client = useQueryClient();
  return (
    <>
      <Text>{t('home.cta')}</Text>
      <Text>{client ? 'has query client' : 'no query client'}</Text>
    </>
  );
}

let routeShouldThrow = true;
function Flaky() {
  if (routeShouldThrow) throw new Error('route exploded');
  return <Text>recovered</Text>;
}

describe('root layout', () => {
  beforeEach(async () => {
    mockedHide.mockClear();
    mockedFonts.mockReturnValue(true);
    await AsyncStorage.clear();
    usePreferencesStore.setState({ language: 'pt-BR' });
    await usePreferencesStore.persist.rehydrate();
    await i18n.changeLanguage('en');
  });

  it('holds the splash and shows nothing while the fonts are loading', async () => {
    mockedFonts.mockReturnValue(false);
    await renderRouter({ _layout: RootLayoutModule, index: Home });
    expect(mockedHide).not.toHaveBeenCalled();
    expect(screen.queryByText(/./)).not.toBeOnTheScreen();
  });

  it('keeps the splash up from module load, before anything renders', () => {
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  });

  it('releases the splash once fonts and stores are ready, and shows the route', async () => {
    await renderRouter({ _layout: RootLayoutModule, index: Home });
    expect(await screen.findByText('Me tira da inércia')).toBeOnTheScreen();
    expect(mockedHide).toHaveBeenCalledTimes(1);
  });

  it('opens already in the saved language, never in the device one first', async () => {
    // preferência salva: pt-BR; aparelho e i18next: en
    await renderRouter({ _layout: RootLayoutModule, index: Home });
    expect(await screen.findByText('Me tira da inércia')).toBeOnTheScreen();
    expect(screen.queryByText('Get me out of my rut')).not.toBeOnTheScreen();
  });

  it('gives the routes a query client', async () => {
    await renderRouter({ _layout: RootLayoutModule, index: Home });
    expect(await screen.findByText('has query client')).toBeOnTheScreen();
  });

  it('wraps the app in the gesture handler root, which the slider needs', async () => {
    await renderRouter({ _layout: RootLayoutModule, index: Home });
    const root = await screen.findByTestId('gesture-root');
    expect(root).toHaveStyle({ flex: 1 });
    // o contêiner envolve as telas: o texto da rota está dentro dele
    expect(within(root).getByText('has query client')).toBeOnTheScreen();
  });

  it('shows the translated error screen when a route throws, and can try again', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    routeShouldThrow = true;
    await renderRouter({ _layout: RootLayoutModule, index: Flaky });
    expect(await screen.findByText('Algo deu errado')).toBeOnTheScreen();

    routeShouldThrow = false; // o problema passou
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('recovered')).toBeOnTheScreen();
    expect(screen.queryByText('Algo deu errado')).not.toBeOnTheScreen();
    consoleError.mockRestore();
  });
});
