import type { Locale } from '@/types/language';

/**
 * Cada idioma escrito no próprio idioma (autônimo). Não passa por `t()` de propósito: quem procura
 * o seu idioma na lista o reconhece mesmo com o app em outro idioma.
 */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
};
