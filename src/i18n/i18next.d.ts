import type ptBR from './locales/pt-BR.json';

// Tipagem das chaves a partir do pt-BR (docs/ARCHITECTURE.md, seção 10.4): uma chave
// inexistente, ou um plural sem `count`, não compila.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ptBR;
    };
  }
}
