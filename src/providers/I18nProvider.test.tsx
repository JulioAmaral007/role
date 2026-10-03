import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { useLocales } from 'expo-localization';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import i18n from '@/i18n';
import { usePreferencesStore } from '@/stores/preferencesStore';

import { I18nProvider } from './I18nProvider';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
  useLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

const mockedUseLocales = jest.mocked(useLocales);
const device = (...codes: string[]) =>
  mockedUseLocales.mockReturnValue(codes.map((languageCode) => ({ languageCode })) as never);

/** Mostra o botão da home e anota o idioma de cada render e quantas vezes foi montado. */
function makeProbe() {
  const languages: string[] = [];
  let mounts = 0;
  function Probe() {
    const { t } = useTranslation();
    languages.push(i18n.language);
    useEffect(() => {
      mounts += 1;
    }, []);
    return <Text>{t('home.cta')}</Text>;
  }
  return { Probe, languages, mounts: () => mounts };
}

describe('I18nProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState({ language: 'system' });
    device('en');
    await i18n.changeLanguage('pt-BR');
  });

  it('shows nothing until the effective language has been applied, then the children', async () => {
    const { Probe } = makeProbe();
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(await screen.findByText('Get me out of my rut')).toBeOnTheScreen();
  });

  it('never renders the children in a language other than the effective one', async () => {
    usePreferencesStore.setState({ language: 'es' });
    // o i18next começa em pt-BR: se o provider mostrasse os filhos antes de aplicar, haveria "pt-BR" aqui
    const { Probe, languages } = makeProbe();
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(await screen.findByText('Sácame de la inercia')).toBeOnTheScreen();
    expect(languages.length).toBeGreaterThan(0);
    expect(new Set(languages)).toEqual(new Set(['es']));
  });

  it('applies the saved choice over the device language', async () => {
    device('en');
    usePreferencesStore.setState({ language: 'pt-BR' });
    const { Probe } = makeProbe();
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(await screen.findByText('Me tira da inércia')).toBeOnTheScreen();
  });

  it('follows the device language while the choice is "system"', async () => {
    device('es');
    const { Probe } = makeProbe();
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(await screen.findByText('Sácame de la inercia')).toBeOnTheScreen();
  });

  it('falls back to pt-BR for a device language the app does not have', async () => {
    device('fr');
    const { Probe } = makeProbe();
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(await screen.findByText('Me tira da inércia')).toBeOnTheScreen();
  });

  it('switches language later without unmounting the screens', async () => {
    const { Probe, mounts } = makeProbe();
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(await screen.findByText('Get me out of my rut')).toBeOnTheScreen();

    await act(async () => {
      usePreferencesStore.getState().setLanguage('es');
    });

    expect(await screen.findByText('Sácame de la inercia')).toBeOnTheScreen();
    expect(mounts()).toBe(1);
  });

  it('opens the app anyway when the language cannot be applied', async () => {
    const failing = jest.spyOn(i18n, 'changeLanguage').mockRejectedValueOnce(new Error('boom'));
    const { Probe } = makeProbe();
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(await screen.findByText('Me tira da inércia')).toBeOnTheScreen();
    failing.mockRestore();
  });
});
