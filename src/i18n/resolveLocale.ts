import { DEFAULT_LOCALE, type LanguagePreference, type Locale } from '@/types/language';

// Mesmo critério para todas as regiões: só o código do idioma conta (docs/ARCHITECTURE.md, seção 10.2).
const LOCALE_BY_LANGUAGE_CODE: Record<string, Locale> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
};

/** Formato de `getLocales()` do `expo-localization`, reduzido ao que a função usa. */
export interface DeviceLocale {
  languageCode: string | null;
}

/**
 * Escolha salva → idioma do aparelho → pt-BR.
 * `deviceLocales` vem em ordem de preferência: vale o primeiro idioma suportado da lista.
 */
export function resolveLocale(
  preference: LanguagePreference,
  deviceLocales: readonly DeviceLocale[],
): Locale {
  if (preference !== 'system') return preference;
  for (const { languageCode } of deviceLocales) {
    const locale = languageCode ? LOCALE_BY_LANGUAGE_CODE[languageCode.toLowerCase()] : undefined;
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}
