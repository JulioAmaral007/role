import { useLocales } from 'expo-localization';

import i18n from '@/i18n';
import { resolveLocale } from '@/i18n/resolveLocale';
import { usePreferencesStore } from '@/stores/preferencesStore';
import type { LanguagePreference, Locale } from '@/types/language';

interface UseLanguageResult {
  /** Escolha do usuário: um idioma fixo ou `'system'` (seguir o aparelho). */
  preference: LanguagePreference;
  /** Idioma efetivo, derivado da escolha e do aparelho (nunca guardado). */
  locale: Locale;
  /** Salva a escolha e troca o idioma na hora, sem reiniciar o app. */
  setLanguage: (language: LanguagePreference) => void;
}

/**
 * Idioma do app (docs/ARCHITECTURE.md, seção 10.3). A escolha fica no store de preferências; o
 * idioma efetivo é calculado a cada render. O `I18nProvider` (Fase 3) aplica a escolha já salva
 * depois da hidratação e acompanha o aparelho quando a escolha é `'system'`.
 */
export function useLanguage(): UseLanguageResult {
  const preference = usePreferencesStore((state) => state.language);
  const saveLanguage = usePreferencesStore((state) => state.setLanguage);
  const deviceLocales = useLocales();

  const setLanguage = (language: LanguagePreference) => {
    saveLanguage(language);
    // com os recursos embutidos a troca é imediata; o catch só evita uma rejeição sem dono
    i18n.changeLanguage(resolveLocale(language, deviceLocales)).catch(() => {});
  };

  return { preference, locale: resolveLocale(preference, deviceLocales), setLanguage };
}
