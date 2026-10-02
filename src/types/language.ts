export const LOCALES = ['pt-BR', 'en', 'es'] as const;

/** Idioma efetivo do app. */
export type Locale = (typeof LOCALES)[number];

/** Escolha do usuário: um idioma fixo ou seguir o aparelho. */
export type LanguagePreference = Locale | 'system';

export const DEFAULT_LOCALE: Locale = 'pt-BR';

/** Valida um valor vindo de fora (storage, rede) antes de tratá-lo como escolha de idioma. */
export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'system' || LOCALES.some((locale) => locale === value);
}
