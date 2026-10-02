import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isLanguagePreference, type LanguagePreference } from '@/types/language';

// Preferências do usuário no aparelho (docs/ARCHITECTURE.md, seções 7.3 e 7.4). Hoje só o idioma;
// onboarding, filtros do Rolê e notificações entram nas tarefas que os usam.
interface PreferencesState {
  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
}

interface PersistedPreferences {
  language: LanguagePreference;
}

export const PREFERENCES_STORAGE_KEY = 'role.preferences';

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'system',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // só dados: nunca funções nem estado transitório
      partialize: (state): PersistedPreferences => ({ language: state.language }),
      // v1 é o primeiro formato; migrações futuras entram aqui
      migrate: (persisted) => persisted as PersistedPreferences,
      // valor salvo corrompido ou de uma versão desconhecida não pode derrubar o app
      merge: (persisted, current) => {
        const language = (persisted as Partial<PersistedPreferences> | undefined)?.language;
        return { ...current, language: isLanguagePreference(language) ? language : current.language };
      },
    },
  ),
);
