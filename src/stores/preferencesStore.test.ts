import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from './preferencesStore';

const readSaved = async () => JSON.parse((await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)) ?? 'null');

describe('preferencesStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState({ language: 'system', onboardingDone: false });
  });

  it('starts following the device language', () => {
    expect(usePreferencesStore.getState().language).toBe('system');
  });

  it('saves the chosen language with the store version, and only data', async () => {
    usePreferencesStore.getState().setLanguage('es');
    await waitFor(async () => {
      expect(await readSaved()).toEqual({ state: { language: 'es', onboardingDone: false }, version: 1 });
    });
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
  describe('onboarding', () => {
    it('starts as not done', () => {
      expect(usePreferencesStore.getState().onboardingDone).toBe(false);
    });

    it('saves that the onboarding is done, next to the language', async () => {
      usePreferencesStore.getState().completeOnboarding();
      expect(usePreferencesStore.getState().onboardingDone).toBe(true);
      await waitFor(async () => {
        expect(await readSaved()).toEqual({ state: { language: 'system', onboardingDone: true }, version: 1 });
      });
    });

    it('restores a done onboarding when it hydrates', async () => {
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ state: { language: 'en', onboardingDone: true }, version: 1 }),
      );
      await usePreferencesStore.persist.rehydrate();
      expect(usePreferencesStore.getState()).toMatchObject({ language: 'en', onboardingDone: true });
    });

    it('treats a save from before the field existed as not done', async () => {
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ state: { language: 'es' }, version: 1 }),
      );
      await usePreferencesStore.persist.rehydrate();
      expect(usePreferencesStore.getState()).toMatchObject({ language: 'es', onboardingDone: false });
    });

    it.each([['yes'], [1], [null], [{}]])('treats the corrupted value %p as not done', async (value) => {
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ state: { language: 'en', onboardingDone: value }, version: 1 }),
      );
      await usePreferencesStore.persist.rehydrate();
      expect(usePreferencesStore.getState().onboardingDone).toBe(false);
      // e o idioma válido do mesmo salvamento não se perde
      expect(usePreferencesStore.getState().language).toBe('en');
    });
  });
});
