import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Trip } from '@/types/trip';

import { parseTrip } from './parsers';

// O rolê em andamento (docs/ARCHITECTURE.md, seção 7.3): do "Bora, tô indo" até o "Cheguei!" ou o
// "Mudei de ideia". É persistido para sobreviver ao app fechado e reaberto no meio do caminho.
// Guarda um resumo do lugar, então o "A caminho" abre sem rede e sem o catálogo.
interface TripState {
  /** `undefined` quando não há rolê em andamento. */
  trip: Trip | undefined;
  /** Abre um rolê. Se já havia um, é substituído (só existe um rolê por vez). */
  startTrip: (trip: Trip) => void;
  /** "Mudei de ideia": encerra sem carimbo. */
  cancelTrip: () => void;
  /** "Cheguei!" confirmado: encerra o rolê (o carimbo é criado por quem chama). */
  finishTrip: () => void;
}

interface PersistedTrip {
  trip: Trip | undefined;
}

export const TRIP_STORAGE_KEY = 'role.trip';

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      trip: undefined,
      startTrip: (trip) => set({ trip }),
      cancelTrip: () => set({ trip: undefined }),
      finishTrip: () => set({ trip: undefined }),
    }),
    {
      name: TRIP_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedTrip => ({ trip: state.trip }),
      migrate: (persisted) => persisted as PersistedTrip,
      // um rolê salvo estragado vale como "sem rolê em andamento", e nunca derruba o app
      merge: (persisted, current) => ({
        ...current,
        trip: parseTrip((persisted as { trip?: unknown } | null)?.trip),
      }),
    },
  ),
);
