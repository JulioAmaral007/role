import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import { restartApp } from '@/test/persistence';
import type { SavedSuggestion } from '@/types/trip';

import { LAST_SUGGESTION_STORAGE_KEY, useLastSuggestionStore } from './lastSuggestionStore';

const suggestion: SavedSuggestion = {
  place: {
    id: 'place-1',
    name: 'Mirante do Morro',
    address: 'Alto do Morro',
    latitude: -23.54,
    longitude: -46.64,
    kindLabel: 'Mirante',
    photoPath: 'seed/mirante-1.jpg',
  },
  openUntil: '2026-10-02T21:00:00.000Z',
  savedAt: '2026-10-02T15:00:00.000Z',
};

const readSaved = async () =>
  JSON.parse((await AsyncStorage.getItem(LAST_SUGGESTION_STORAGE_KEY)) ?? 'null');

describe('lastSuggestionStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLastSuggestionStore.setState(useLastSuggestionStore.getInitialState(), true);
  });

  it('starts empty', () => {
    expect(useLastSuggestionStore.getState().lastSuggestion).toBeUndefined();
  });

  it('keeps only the last suggestion seen', () => {
    useLastSuggestionStore.getState().saveLastSuggestion(suggestion);
    const newer = { ...suggestion, place: { ...suggestion.place, id: 'place-2' } };
    useLastSuggestionStore.getState().saveLastSuggestion(newer);

    expect(useLastSuggestionStore.getState().lastSuggestion).toEqual(newer);
  });

  it('can be cleared', () => {
    useLastSuggestionStore.getState().saveLastSuggestion(suggestion);
    useLastSuggestionStore.getState().clearLastSuggestion();
    expect(useLastSuggestionStore.getState().lastSuggestion).toBeUndefined();
  });

  describe('persistence', () => {
    it('saves it with the store version, and only data', async () => {
      useLastSuggestionStore.getState().saveLastSuggestion(suggestion);
      await waitFor(async () => {
        expect(await readSaved()).toEqual({ state: { lastSuggestion: suggestion }, version: 1 });
      });
    });

    it('brings it back after the app is closed and opened again, for the offline screen', async () => {
      useLastSuggestionStore.getState().saveLastSuggestion(suggestion);
      await waitFor(async () => expect((await readSaved())?.state.lastSuggestion).toEqual(suggestion));

      await restartApp(useLastSuggestionStore, LAST_SUGGESTION_STORAGE_KEY);

      expect(useLastSuggestionStore.getState().lastSuggestion).toEqual(suggestion);
    });

    it.each([
      ['a broken suggestion', { lastSuggestion: { ...suggestion, savedAt: 'later' } }],
      ['a suggestion without the place text', { lastSuggestion: { ...suggestion, place: { id: 'x' } } }],
      ['no field', {}],
    ])('treats %s as having no last suggestion', async (_name, state) => {
      await AsyncStorage.setItem(LAST_SUGGESTION_STORAGE_KEY, JSON.stringify({ state, version: 1 }));
      await useLastSuggestionStore.persist.rehydrate();
      expect(useLastSuggestionStore.getState().lastSuggestion).toBeUndefined();
    });
  });
});
