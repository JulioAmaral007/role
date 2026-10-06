import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import { restartApp } from '@/test/persistence';
import type { Trip } from '@/types/trip';

import { TRIP_STORAGE_KEY, useTripStore } from './tripStore';

const trip: Trip = {
  place: { id: 'place-1', name: 'Café do Porão', address: 'Rua A, 1', latitude: -23.5, longitude: -46.6 },
  travelMode: 'bus',
  departedAt: '2026-10-02T15:00:00.000Z',
  initialDistanceMeters: 1800,
};

const readSaved = async () => JSON.parse((await AsyncStorage.getItem(TRIP_STORAGE_KEY)) ?? 'null');

describe('tripStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useTripStore.setState(useTripStore.getInitialState(), true);
  });

  it('starts with no trip in progress', () => {
    expect(useTripStore.getState().trip).toBeUndefined();
  });

  it('opens a trip and replaces the previous one', () => {
    useTripStore.getState().startTrip(trip);
    expect(useTripStore.getState().trip).toEqual(trip);

    const other = { ...trip, travelMode: 'walk' as const };
    useTripStore.getState().startTrip(other);
    expect(useTripStore.getState().trip).toEqual(other);
  });

  it('ends the trip when the person changes their mind or arrives', () => {
    useTripStore.getState().startTrip(trip);
    useTripStore.getState().cancelTrip();
    expect(useTripStore.getState().trip).toBeUndefined();

    useTripStore.getState().startTrip(trip);
    useTripStore.getState().finishTrip();
    expect(useTripStore.getState().trip).toBeUndefined();
  });

  describe('persistence', () => {
    it('saves the trip with the store version, and only data', async () => {
      useTripStore.getState().startTrip(trip);
      await waitFor(async () => {
        expect(await readSaved()).toEqual({ state: { trip }, version: 1 });
      });
    });

    it('brings the trip back after the app is closed and opened again', async () => {
      useTripStore.getState().startTrip(trip);
      await waitFor(async () => expect((await readSaved())?.state.trip).toEqual(trip));

      // "fechar o app": o estado em memória se perde; ao abrir, hidrata do disco
      await restartApp(useTripStore, TRIP_STORAGE_KEY);

      expect(useTripStore.getState().trip).toEqual(trip);
      expect(useTripStore.persist.hasHydrated()).toBe(true);
    });

    it('does not bring back a trip that was ended', async () => {
      useTripStore.getState().startTrip(trip);
      useTripStore.getState().cancelTrip();
      await waitFor(async () => expect((await readSaved())?.state.trip).toBeUndefined());

      await useTripStore.persist.rehydrate();
      expect(useTripStore.getState().trip).toBeUndefined();
    });

    it.each([
      ['a broken trip', { trip: { ...trip, travelMode: 'helicopter' } }],
      ['a trip that is not an object', { trip: 'on the way' }],
      ['no trip field', {}],
    ])('treats %s as no trip in progress', async (_name, state) => {
      await AsyncStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify({ state, version: 1 }));
      await useTripStore.persist.rehydrate();
      expect(useTripStore.getState().trip).toBeUndefined();
    });

    it('keeps the default when nothing was saved', async () => {
      await useTripStore.persist.rehydrate();
      expect(useTripStore.getState().trip).toBeUndefined();
    });
  });
});
