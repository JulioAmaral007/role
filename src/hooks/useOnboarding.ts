import { usePreferencesStore } from '@/stores/preferencesStore';

interface UseOnboardingResult {
  /** `true` depois do onboarding. Só vale depois de `useStoresHydrated()` (seção 7.5 do ADR). */
  onboardingDone: boolean;
  /** Grava que o onboarding acabou. O gate de rotas leva sozinho às abas. */
  completeOnboarding: () => void;
}

/** Estado do onboarding para as rotas, que não importam o store direto (seção 4.2 do ADR). */
export function useOnboarding(): UseOnboardingResult {
  const onboardingDone = usePreferencesStore((state) => state.onboardingDone);
  const completeOnboarding = usePreferencesStore((state) => state.completeOnboarding);
  return { onboardingDone, completeOnboarding };
}
