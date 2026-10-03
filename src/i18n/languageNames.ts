import type { LanguagePreference, Locale } from '@/types/language';

/**
 * Cada idioma escrito no próprio idioma (autônimo). Não passa por `t()` de propósito: quem procura
 * o seu idioma na lista o reconhece mesmo com o app em outro idioma.
 */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
};

/** Nome da escolha de idioma: o autônimo do idioma, ou o texto traduzido de "seguir o aparelho". */
export function getLanguageLabel(preference: LanguagePreference, systemLabel: string): string {
  return preference === 'system' ? systemLabel : LANGUAGE_NAMES[preference];
}
