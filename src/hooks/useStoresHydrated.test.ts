import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useLastSuggestionStore } from '@/stores/lastSuggestionStore';
import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from '@/stores/preferencesStore';
import { useSyncQueueStore } from '@/stores/syncQueueStore';
import { useTripStore } from '@/stores/tripStore';

import { useStoresHydrated } from './useStoresHydrated';

describe('useStoresHydrated', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await usePreferencesStore.persist.rehydrate();
  });

  it('is true once the persisted stores have hydrated', async () => {
    const { result } = await renderHook(() => useStoresHydrated());
    expect(result.current).toBe(true);
  });

  it('is false while a store rehydrates and becomes true when it finishes', async () => {
    await AsyncStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ state: { language: 'es' }, version: 1 }),
    );
    const { result } = await renderHook(() => useStoresHydrated());

    let finished: Promise<void> | void = undefined;
    await act(async () => {
      finished = usePreferencesStore.persist.rehydrate();
    });
    await act(async () => {
      await finished;
    });

    await waitFor(() => expect(result.current).toBe(true));
    // e a hidratação trouxe o valor salvo, que é justamente o que a splash esperava
    expect(usePreferencesStore.getState().language).toBe('es');
  });

  it('reports the hydration of a store that was still hydrating when the hook mounted', async () => {
    let finish: () => void = () => {};
    const getItem = jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(JSON.stringify({ state: { language: 'en' }, version: 1 }));
        }),
    );

    let hydration: Promise<void> | void = undefined;
    await act(async () => {
      hydration = usePreferencesStore.persist.rehydrate();
    });
    const { result } = await renderHook(() => useStoresHydrated());
    expect(result.current).toBe(false);

    await act(async () => {
      finish();
      await hydration;
    });

    await waitFor(() => expect(result.current).toBe(true));
    expect(usePreferencesStore.getState().language).toBe('en');
    getItem.mockRestore();
  });
});

describe('useStoresHydrated with every persisted store', () => {
  const stores = [
    ['preferences', usePreferencesStore],
    ['sync queue', useSyncQueueStore],
    ['trip', useTripStore],
    ['last suggestion', useLastSuggestionStore],
  ] as const;

  it.each(stores)('waits for the %s store, not only for the preferences', async (_name, store) => {
    await AsyncStorage.clear();
    await Promise.all(stores.map(([, each]) => each.persist.rehydrate()));

    let finish: () => void = () => {};
    const getItem = jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(
      () => new Promise((resolve) => (finish = () => resolve(null))),
    );

    let hydration: Promise<void> | void = undefined;
    await act(async () => {
      hydration = store.persist.rehydrate();
    });
    const { result } = await renderHook(() => useStoresHydrated());
    expect(result.current).toBe(false);

    await act(async () => {
      finish();
      await hydration;
    });
    await waitFor(() => expect(result.current).toBe(true));
    getItem.mockRestore();
  });
});
