import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import { restartApp } from '@/test/persistence';

import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from './preferencesStore';

const readSaved = async () => JSON.parse((await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)) ?? 'null');

// o que vai para o disco num aparelho recém-instalado (campos sem valor não aparecem no JSON)
const DEFAULT_SAVED = {
  language: 'system',
  onboardingDone: false,
  avoidTags: [],
  accessibleOnly: false,
  weeklyReminderEnabled: false,
  quotaRenewedNoticeEnabled: false,
};

describe('preferencesStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState(usePreferencesStore.getInitialState(), true);
  });

  it('starts following the device language', () => {
    expect(usePreferencesStore.getState().language).toBe('system');
  });

  it('saves the chosen language with the store version, and only data', async () => {
    usePreferencesStore.getState().setLanguage('es');
    await waitFor(async () => {
      expect(await readSaved()).toEqual({ state: { ...DEFAULT_SAVED, language: 'es' }, version: 1 });
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
        expect(await readSaved()).toEqual({ state: { ...DEFAULT_SAVED, onboardingDone: true }, version: 1 });
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

describe('preferencesStore: filters, profile preferences and notifications', () => {
  const save = (state: Record<string, unknown>) =>
    AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ state, version: 1 }));

  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState(usePreferencesStore.getInitialState(), true);
  });

  it('starts with no filter chosen, no distance chosen and everything off', () => {
    expect(usePreferencesStore.getState()).toMatchObject({
      mood: undefined,
      timeSlot: undefined,
      budget: undefined,
      maxDistanceKm: undefined,
      avoidTags: [],
      accessibleOnly: false,
      startPoint: undefined,
      profileName: undefined,
      weeklyReminderEnabled: false,
      quotaRenewedNoticeEnabled: false,
    });
  });

  it('sets and clears each filter', () => {
    const { setMood, setTimeSlot, setBudget } = usePreferencesStore.getState();
    setMood('romantic');
    setTimeSlot('half_day');
    setBudget('up_to_30');
    expect(usePreferencesStore.getState()).toMatchObject({
      mood: 'romantic',
      timeSlot: 'half_day',
      budget: 'up_to_30',
    });

    setMood(undefined);
    expect(usePreferencesStore.getState().mood).toBeUndefined();
  });

  describe('maximum distance', () => {
    it('keeps whole kilometers between 1 and 20', () => {
      const { setMaxDistanceKm } = usePreferencesStore.getState();
      setMaxDistanceKm(7);
      expect(usePreferencesStore.getState().maxDistanceKm).toBe(7);
      setMaxDistanceKm(7.4);
      expect(usePreferencesStore.getState().maxDistanceKm).toBe(7);
      setMaxDistanceKm(7.6);
      expect(usePreferencesStore.getState().maxDistanceKm).toBe(8);
    });

    it('stays inside the range of the profile slider', () => {
      const { setMaxDistanceKm } = usePreferencesStore.getState();
      setMaxDistanceKm(0);
      expect(usePreferencesStore.getState().maxDistanceKm).toBe(1);
      setMaxDistanceKm(500);
      expect(usePreferencesStore.getState().maxDistanceKm).toBe(20);
    });
  });

  describe('tags to avoid', () => {
    it('adds a tag, and removes it when toggled again', () => {
      const { toggleAvoidTag } = usePreferencesStore.getState();
      toggleAvoidTag('bar');
      toggleAvoidTag('mall');
      expect(usePreferencesStore.getState().avoidTags).toEqual(['bar', 'mall']);

      toggleAvoidTag('bar');
      expect(usePreferencesStore.getState().avoidTags).toEqual(['mall']);
    });
  });

  it('sets the accessible-only switch', () => {
    usePreferencesStore.getState().setAccessibleOnly(true);
    expect(usePreferencesStore.getState().accessibleOnly).toBe(true);
  });

  it('sets and clears the start point', () => {
    const point = { label: 'Centro', latitude: -23.55, longitude: -46.63 };
    usePreferencesStore.getState().setStartPoint(point);
    expect(usePreferencesStore.getState().startPoint).toEqual(point);
    usePreferencesStore.getState().clearStartPoint();
    expect(usePreferencesStore.getState().startPoint).toBeUndefined();
  });

  describe('profile name', () => {
    it('trims the name, and an empty one goes back to the default', () => {
      const { setProfileName } = usePreferencesStore.getState();
      setProfileName('  Júlio  ');
      expect(usePreferencesStore.getState().profileName).toBe('Júlio');
      setProfileName('   ');
      expect(usePreferencesStore.getState().profileName).toBeUndefined();
    });

    it('cuts a name above the limit', () => {
      usePreferencesStore.getState().setProfileName('a'.repeat(80));
      expect(usePreferencesStore.getState().profileName).toHaveLength(30);
    });
  });

  it('turns the two notification preferences on and off', () => {
    const state = usePreferencesStore.getState();
    state.setWeeklyReminderEnabled(true);
    state.setQuotaRenewedNoticeEnabled(true);
    expect(usePreferencesStore.getState()).toMatchObject({
      weeklyReminderEnabled: true,
      quotaRenewedNoticeEnabled: true,
    });
    state.setWeeklyReminderEnabled(false);
    expect(usePreferencesStore.getState().weeklyReminderEnabled).toBe(false);
  });

  describe('persistence', () => {
    it('brings every preference back after the app is closed and opened again', async () => {
      const state = usePreferencesStore.getState();
      state.setLanguage('en');
      state.setMood('chill');
      state.setTimeSlot('1h');
      state.setBudget('free');
      state.setMaxDistanceKm(12);
      state.toggleAvoidTag('nightclub');
      state.setAccessibleOnly(true);
      state.setStartPoint({ label: 'Centro', latitude: -23.55, longitude: -46.63 });
      state.setProfileName('Júlio');
      state.setWeeklyReminderEnabled(true);
      state.setQuotaRenewedNoticeEnabled(true);
      await waitFor(async () => expect((await readSaved())?.state.profileName).toBe('Júlio'));

      await restartApp(usePreferencesStore, PREFERENCES_STORAGE_KEY);

      expect(usePreferencesStore.getState()).toMatchObject({
        language: 'en',
        mood: 'chill',
        timeSlot: '1h',
        budget: 'free',
        maxDistanceKm: 12,
        avoidTags: ['nightclub'],
        accessibleOnly: true,
        startPoint: { label: 'Centro', latitude: -23.55, longitude: -46.63 },
        profileName: 'Júlio',
        weeklyReminderEnabled: true,
        quotaRenewedNoticeEnabled: true,
      });
    });

    it('saves only data, never the actions', async () => {
      usePreferencesStore.getState().setMood('lazy');
      await waitFor(async () => expect((await readSaved())?.state.mood).toBe('lazy'));
      const saved = await readSaved();
      expect(Object.values(saved.state).some((value) => typeof value === 'function')).toBe(false);
      expect(saved.state).not.toHaveProperty('setMood');
    });

    it('keeps the defaults for a save from before these fields existed', async () => {
      await save({ language: 'es', onboardingDone: true });
      await usePreferencesStore.persist.rehydrate();
      expect(usePreferencesStore.getState()).toMatchObject({
        language: 'es',
        onboardingDone: true,
        mood: undefined,
        maxDistanceKm: undefined,
        avoidTags: [],
        accessibleOnly: false,
        startPoint: undefined,
        profileName: undefined,
        weeklyReminderEnabled: false,
        quotaRenewedNoticeEnabled: false,
      });
    });

    it('ignores each corrupted field without losing the valid ones next to it', async () => {
      await save({
        language: 'en',
        onboardingDone: true,
        mood: 'furious',
        timeSlot: 99,
        budget: ['free'],
        maxDistanceKm: 'far',
        avoidTags: ['bar', 'klingon', 'bar'],
        accessibleOnly: 'yes',
        startPoint: { label: 'x', latitude: 400, longitude: 0 },
        profileName: 42,
        weeklyReminderEnabled: 1,
        quotaRenewedNoticeEnabled: null,
      });
      await usePreferencesStore.persist.rehydrate();

      expect(usePreferencesStore.getState()).toMatchObject({
        language: 'en',
        onboardingDone: true,
        mood: undefined,
        timeSlot: undefined,
        budget: undefined,
        maxDistanceKm: undefined,
        avoidTags: ['bar'],
        accessibleOnly: false,
        startPoint: undefined,
        profileName: undefined,
        weeklyReminderEnabled: false,
        quotaRenewedNoticeEnabled: false,
      });
    });

    it('brings a saved distance back inside the allowed range', async () => {
      await save({ maxDistanceKm: 400 });
      await usePreferencesStore.persist.rehydrate();
      expect(usePreferencesStore.getState().maxDistanceKm).toBe(20);
    });

    it('trims and cuts a saved profile name', async () => {
      await save({ profileName: `  ${'b'.repeat(80)}  ` });
      await usePreferencesStore.persist.rehydrate();
      expect(usePreferencesStore.getState().profileName).toBe('b'.repeat(30));
    });
  });
});
