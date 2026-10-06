import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  isBudget,
  isMood,
  isTimeSlot,
  type AvoidTag,
  type Budget,
  type Mood,
  type TimeSlot,
} from '@/types/ids';
import { isLanguagePreference, type LanguagePreference } from '@/types/language';
import {
  MAX_MAX_DISTANCE_KM,
  MAX_PROFILE_NAME_LENGTH,
  MIN_MAX_DISTANCE_KM,
  type StartPoint,
} from '@/types/preferences';
import { snapToStep } from '@/utils/slider';

import { parseAvoidTags, parseStartPoint } from './parsers';

// Preferências do usuário no aparelho (docs/ARCHITECTURE.md, seções 7.3 e 7.4): idioma, onboarding,
// os filtros do Rolê, as preferências do Perfil (distância máxima, tipos a evitar, só acessíveis),
// o ponto de partida digitado (D35), o nome opcional (D37) e as notificações.
//
// Campo sem valor (`undefined`) quer dizer "a pessoa ainda não escolheu" (regra `react-state-fallback`):
// quem lê aplica o padrão. Em particular, `maxDistanceKm` ausente vale 5 km (`DEFAULT_MAX_DISTANCE_KM`
// do domínio; o store não importa o `domain/`).
interface PreferencesState {
  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
  /** `true` depois que a pessoa passou pelo onboarding. O gate de rotas lê só isto. */
  onboardingDone: boolean;
  completeOnboarding: () => void;

  /** Os três filtros do Rolê. `undefined` até a pessoa escolher. */
  mood: Mood | undefined;
  timeSlot: TimeSlot | undefined;
  budget: Budget | undefined;
  setMood: (mood: Mood | undefined) => void;
  setTimeSlot: (timeSlot: TimeSlot | undefined) => void;
  setBudget: (budget: Budget | undefined) => void;

  /** "Distância máxima" do Perfil, de 1 a 20 km (inteiro). `undefined` = o padrão. */
  maxDistanceKm: number | undefined;
  setMaxDistanceKm: (km: number) => void;
  /** "Não quero sugestões de". */
  avoidTags: AvoidTag[];
  toggleAvoidTag: (tag: AvoidTag) => void;
  /** "Só lugares acessíveis". */
  accessibleOnly: boolean;
  setAccessibleOnly: (accessibleOnly: boolean) => void;

  /** O ponto de partida digitado; `undefined` usa a localização do aparelho. */
  startPoint: StartPoint | undefined;
  setStartPoint: (startPoint: StartPoint) => void;
  clearStartPoint: () => void;

  /** Nome opcional do Perfil; `undefined` mostra o padrão ("Você"). */
  profileName: string | undefined;
  setProfileName: (name: string) => void;

  /** "Lembrete semanal da ofensiva" e "Avisar quando a cota renovar". Começam desligados. */
  weeklyReminderEnabled: boolean;
  setWeeklyReminderEnabled: (enabled: boolean) => void;
  quotaRenewedNoticeEnabled: boolean;
  setQuotaRenewedNoticeEnabled: (enabled: boolean) => void;
}

/** Só dados: o que vai para o disco (nunca funções). */
type PersistedPreferences = {
  [K in keyof PreferencesState as PreferencesState[K] extends (...args: never[]) => unknown
    ? never
    : K]: PreferencesState[K];
};

export const PREFERENCES_STORAGE_KEY = 'role.preferences';

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'system',
      setLanguage: (language) => set({ language }),
      onboardingDone: false,
      completeOnboarding: () => set({ onboardingDone: true }),

      mood: undefined,
      timeSlot: undefined,
      budget: undefined,
      setMood: (mood) => set({ mood }),
      setTimeSlot: (timeSlot) => set({ timeSlot }),
      setBudget: (budget) => set({ budget }),

      maxDistanceKm: undefined,
      setMaxDistanceKm: (km) =>
        set({ maxDistanceKm: snapToStep(km, MIN_MAX_DISTANCE_KM, MAX_MAX_DISTANCE_KM, 1) }),
      avoidTags: [],
      toggleAvoidTag: (tag) =>
        set((state) => ({
          avoidTags: state.avoidTags.includes(tag)
            ? state.avoidTags.filter((current) => current !== tag)
            : [...state.avoidTags, tag],
        })),
      accessibleOnly: false,
      setAccessibleOnly: (accessibleOnly) => set({ accessibleOnly }),

      startPoint: undefined,
      setStartPoint: (startPoint) => set({ startPoint }),
      clearStartPoint: () => set({ startPoint: undefined }),

      profileName: undefined,
      // vazio volta ao padrão; acima do limite, corta
      setProfileName: (name) => {
        const trimmed = name.trim().slice(0, MAX_PROFILE_NAME_LENGTH).trim();
        set({ profileName: trimmed.length > 0 ? trimmed : undefined });
      },

      weeklyReminderEnabled: false,
      setWeeklyReminderEnabled: (weeklyReminderEnabled) => set({ weeklyReminderEnabled }),
      quotaRenewedNoticeEnabled: false,
      setQuotaRenewedNoticeEnabled: (quotaRenewedNoticeEnabled) => set({ quotaRenewedNoticeEnabled }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      // v1 continua: campo novo com padrão não pede migração (o `merge` abaixo preenche o que falta)
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // só dados: nunca funções nem estado transitório
      partialize: (state): PersistedPreferences => ({
        language: state.language,
        onboardingDone: state.onboardingDone,
        mood: state.mood,
        timeSlot: state.timeSlot,
        budget: state.budget,
        maxDistanceKm: state.maxDistanceKm,
        avoidTags: state.avoidTags,
        accessibleOnly: state.accessibleOnly,
        startPoint: state.startPoint,
        profileName: state.profileName,
        weeklyReminderEnabled: state.weeklyReminderEnabled,
        quotaRenewedNoticeEnabled: state.quotaRenewedNoticeEnabled,
      }),
      // v1 é o primeiro formato; migrações futuras entram aqui
      migrate: (persisted) => persisted as PersistedPreferences,
      // valor salvo corrompido, ou campo que ainda não existia, não pode derrubar o app: cada campo
      // inválido ou ausente fica com o padrão
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Record<keyof PersistedPreferences, unknown>>;
        const distance = saved.maxDistanceKm;
        return {
          ...current,
          language: isLanguagePreference(saved.language) ? saved.language : current.language,
          // só o `true` literal conta: qualquer outra coisa volta para o onboarding
          onboardingDone: saved.onboardingDone === true,
          mood: isMood(saved.mood) ? saved.mood : undefined,
          timeSlot: isTimeSlot(saved.timeSlot) ? saved.timeSlot : undefined,
          budget: isBudget(saved.budget) ? saved.budget : undefined,
          maxDistanceKm:
            typeof distance === 'number' && Number.isFinite(distance)
              ? snapToStep(distance, MIN_MAX_DISTANCE_KM, MAX_MAX_DISTANCE_KM, 1)
              : undefined,
          avoidTags: parseAvoidTags(saved.avoidTags),
          accessibleOnly: saved.accessibleOnly === true,
          startPoint: parseStartPoint(saved.startPoint),
          profileName:
            typeof saved.profileName === 'string' && saved.profileName.trim().length > 0
              ? saved.profileName.trim().slice(0, MAX_PROFILE_NAME_LENGTH)
              : undefined,
          weeklyReminderEnabled: saved.weeklyReminderEnabled === true,
          quotaRenewedNoticeEnabled: saved.quotaRenewedNoticeEnabled === true,
        };
      },
    },
  ),
);
