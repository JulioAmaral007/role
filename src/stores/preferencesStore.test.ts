import AsyncStorage from '@react-native-async-storage/async-storage';

import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from './preferencesStore';

const readSaved = async () => JSON.parse((await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)) ?? 'null');

describe('preferencesStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState({ language: 'system' });
  });

  it('starts following the device language', () => {
    expect(usePreferencesStore.getState().language).toBe('system');
  });

  it('saves the chosen language with the store version, and only data', async () => {
    usePreferencesStore.getState().setLanguage('es');
    await Promise.resolve();
    expect(await readSaved()).toEqual({ state: { language: 'es' }, version: 1 });
  });

  it('restores the saved language when it hydrates', async () => {
    await AsyncStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ state: { language: 'en' }, version: 1 }),
    );
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().language).toBe('en');
    expect(usePreferencesStore.persist.hasHydrated()).toBe(true);
  });

  it('ignores a corrupted saved language', async () => {
    await AsyncStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ state: { language: 'klingon' }, version: 1 }),
    );
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().language).toBe('system');
  });

  it('keeps the default when nothing was saved', async () => {
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().language).toBe('system');
  });
});
