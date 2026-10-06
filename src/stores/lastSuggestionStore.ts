import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SavedSuggestion } from '@/types/trip';

import { parseSavedSuggestion } from './parsers';

// A última sugestão vista, para a tela "Sem internet" (docs/ARCHITECTURE.md, seção 7.3). É uma cópia
// **proposital** de dado que também vive no cache do catálogo, porque precisa existir quando esse
// cache falhar ou expirar: exceção justificada à regra de ouro da seção 7.1.
interface LastSuggestionState {
  /** `undefined` até a primeira sugestão ser vista. */
  lastSuggestion: SavedSuggestion | undefined;
  saveLastSuggestion: (suggestion: SavedSuggestion) => void;
  clearLastSuggestion: () => void;
}

interface PersistedLastSuggestion {
  lastSuggestion: SavedSuggestion | undefined;
}

export const LAST_SUGGESTION_STORAGE_KEY = 'role.lastSuggestion';

export const useLastSuggestionStore = create<LastSuggestionState>()(
  persist(
    (set) => ({
      lastSuggestion: undefined,
      saveLastSuggestion: (lastSuggestion) => set({ lastSuggestion }),
      clearLastSuggestion: () => set({ lastSuggestion: undefined }),
    }),
    {
      name: LAST_SUGGESTION_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedLastSuggestion => ({ lastSuggestion: state.lastSuggestion }),
      migrate: (persisted) => persisted as PersistedLastSuggestion,
      merge: (persisted, current) => ({
        ...current,
        lastSuggestion: parseSavedSuggestion(
          (persisted as { lastSuggestion?: unknown } | null)?.lastSuggestion,
        ),
      }),
    },
  ),
);
