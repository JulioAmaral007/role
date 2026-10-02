export const LOCALES = ['pt-BR', 'en', 'es'] as const;

/** Idioma efetivo do app. */
export type Locale = (typeof LOCALES)[number];

/** Escolha do usuário: um idioma fixo ou seguir o aparelho. */
export type LanguagePreference = Locale | 'system';

export const DEFAULT_LOCALE: Locale = 'pt-BR';
