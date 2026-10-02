import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { useLocales } from 'expo-localization';

import i18n from '@/i18n';
import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from '@/stores/preferencesStore';

import { useLanguage } from './useLanguage';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
  useLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

const mockedUseLocales = jest.mocked(useLocales);
const device = (...codes: string[]) =>
  mockedUseLocales.mockReturnValue(codes.map((languageCode) => ({ languageCode })) as never);

describe('useLanguage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState({ language: 'system' });
    device('en');
    await i18n.changeLanguage('pt-BR');
  });

  it('follows the device language while the preference is "system"', async () => {
    device('es');
    const { result } = await renderHook(() => useLanguage());
    expect(result.current.preference).toBe('system');
    expect(result.current.locale).toBe('es');
  });

  it('falls back to pt-BR for an unsupported device language', async () => {
    device('fr');
    const { result } = await renderHook(() => useLanguage());
    expect(result.current.locale).toBe('pt-BR');
  });

  it('switches the language immediately and saves the preference', async () => {
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      result.current.setLanguage('es');
    });

    expect(result.current.preference).toBe('es');
    expect(result.current.locale).toBe('es');
    expect(i18n.language).toBe('es');
    expect(i18n.t('tabs.passport')).toBe('Pasaporte');
    expect(JSON.parse((await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)) ?? 'null')).toEqual({
      state: { language: 'es' },
      version: 1,
    });
  });

  it('applies the device language when switching back to "system"', async () => {
    device('en');
    const { result } = await renderHook(() => useLanguage());
    await act(async () => {
      result.current.setLanguage('pt-BR');
    });
    expect(i18n.language).toBe('pt-BR');

    await act(async () => {
      result.current.setLanguage('system');
    });

    expect(result.current.preference).toBe('system');
    expect(result.current.locale).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('keeps a fixed choice even when the device language differs', async () => {
    device('en');
    usePreferencesStore.setState({ language: 'pt-BR' });
    const { result } = await renderHook(() => useLanguage());
    expect(result.current.locale).toBe('pt-BR');
  });
});
