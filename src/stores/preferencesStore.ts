import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isLanguagePreference, type LanguagePreference } from '@/types/language';

// Preferências do usuário no aparelho (docs/ARCHITECTURE.md, seções 7.3 e 7.4). Por enquanto o
// idioma e o onboarding; filtros do Rolê, preferências do Perfil e notificações entram nas tarefas
// que os usam.
interface PreferencesState {
  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
  /** `true` depois que a pessoa passou pelo onboarding. O gate de rotas lê só isto. */
  onboardingDone: boolean;
  completeOnboarding: () => void;
}

interface PersistedPreferences {
  language: LanguagePreference;
  onboardingDone: boolean;
}

export const PREFERENCES_STORAGE_KEY = 'role.preferences';

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'system',
      setLanguage: (language) => set({ language }),
      onboardingDone: false,
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // só dados: nunca funções nem estado transitório
      partialize: (state): PersistedPreferences => ({
        language: state.language,
        onboardingDone: state.onboardingDone,
      }),
      // v1 é o primeiro formato; migrações futuras entram aqui
      migrate: (persisted) => persisted as PersistedPreferences,
      // valor salvo corrompido, ou campo que ainda não existia, não pode derrubar o app: cada campo
      // inválido ou ausente fica com o padrão
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedPreferences>;
        return {
          ...current,
          language: isLanguagePreference(saved.language) ? saved.language : current.language,
          // só o `true` literal conta: qualquer outra coisa volta para o onboarding
          onboardingDone: saved.onboardingDone === true,
        };
      },
    },
  ),
);
