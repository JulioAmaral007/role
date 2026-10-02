import './polyfills';

import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';
import { resolveLocale } from './resolveLocale';
import { DEFAULT_LOCALE } from '@/types/language';

const i18n = createInstance();

// Init síncrono com recursos embutidos: o primeiro render já tem texto. A escolha salva do
// usuário é aplicada depois pelo I18nProvider, com `changeLanguage` (seção 10.3).
void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
  },
  lng: resolveLocale('system', getLocales()),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
});

export default i18n;
