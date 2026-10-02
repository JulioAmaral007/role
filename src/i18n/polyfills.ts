// O Hermes não tem `Intl.PluralRules` e o i18next v24+ depende dele para plural e ordinal
// (docs/ARCHITECTURE.md, seção 10.5). Só carrega o polyfill se a API não existir.
// `require` (e não `import`) porque o import estático seria avaliado sempre.
/* eslint-disable @typescript-eslint/no-require-imports */
if (typeof Intl.PluralRules === 'undefined') {
  require('@formatjs/intl-pluralrules/polyfill-force.js');
  require('@formatjs/intl-pluralrules/locale-data/pt.js');
  require('@formatjs/intl-pluralrules/locale-data/en.js');
  require('@formatjs/intl-pluralrules/locale-data/es.js');
}
