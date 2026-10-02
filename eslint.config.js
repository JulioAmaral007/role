// https://docs.expo.dev/guides/using-eslint/
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const testingLibrary = require('eslint-plugin-testing-library');

// Convenções de nomenclatura: docs/ARCHITECTURE.md, seção 14.
// O nome do arquivo (sem a extensão final .ts/.tsx) precisa casar com o padrão da pasta.
const FILE_NAME = {
  // componentes e providers: PascalCase, com variante de plataforma e .test opcionais
  pascal: /^[A-Z][A-Za-z0-9]*(\.(ios|android|web))?(\.test)?$/,
  // hooks: useCamelCase
  hook: /^use[A-Z][A-Za-z0-9]*(\.test)?$/,
  // demais arquivos: camelCase (inclui index e .d.ts)
  camel: /^[a-z][A-Za-z0-9]*(\.d)?(\.(ios|android|web))?(\.test)?$/,
  // rotas do Expo Router: kebab-case (o nome vira a URL); sem testes dentro de src/app
  route:
    /^(_layout|\+not-found|\+html|\+native-intent|index|\[\.{0,3}[a-z][a-z0-9-]*\]|[a-z][a-z0-9-]*)(\.(ios|android|web))?$/,
};
const DIR_NAME = {
  camel: /^[a-z][A-Za-z0-9]*$/,
  route: /^(\([a-z][a-z0-9-]*\)|\[\.{0,3}[a-z][a-z0-9-]*\]|[a-z][a-z0-9-]*)$/,
};

function expectedKind(relativePath) {
  if (relativePath.startsWith('src/app/')) return 'route';
  if (relativePath.startsWith('src/components/') || relativePath.startsWith('src/providers/')) {
    return 'pascal';
  }
  if (relativePath.startsWith('src/hooks/')) return 'hook';
  return 'camel';
}

const localPlugin = {
  rules: {
    'file-naming': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          file: 'Nome de arquivo "{{name}}" fora do padrão {{kind}} (docs/ARCHITECTURE.md, seção 14).',
          dir: 'Nome de pasta "{{name}}" fora do padrão {{kind}} (docs/ARCHITECTURE.md, seção 14).',
        },
      },
      create(context) {
        return {
          Program(node) {
            const relative = path.relative(context.cwd, context.filename).split(path.sep).join('/');
            const kind = expectedKind(relative);
            const segments = relative.split('/');
            const fileName = segments.pop().replace(/\.(ts|tsx)$/, '');
            // a primeira pasta (src, tests, scripts) é a raiz; as demais são checadas
            const dirs = segments.slice(1);
            const dirKind = kind === 'route' ? 'route' : 'camel';
            // dentro de src/app a pasta "app" também entra na regra, e é válida em kebab-case
            for (const dir of dirs) {
              if (!DIR_NAME[dirKind].test(dir)) {
                context.report({ node, messageId: 'dir', data: { name: dir, kind: dirKind } });
              }
            }
            if (!FILE_NAME[kind].test(fileName)) {
              context.report({ node, messageId: 'file', data: { name: fileName, kind } });
            }
          },
        };
      },
    },
  },
};

// Seletores das regras de "nada solto" (ver o uso em `defineConfig` abaixo).
const FONT_SIZE_RULE = {
  selector: "Property[key.name='fontSize']",
  message: 'Use as variantes de src/theme/typography.ts em vez de escrever fontSize.',
};
const COLOR_RULES = [
  {
    selector: String.raw`Literal[value=/^#[0-9a-fA-F]{3,8}$/]`,
    message: 'Cor solta: use um token de src/theme/tokens.ts.',
  },
  {
    selector: String.raw`Literal[value=/^(rgb|hsl)a?\(/]`,
    message: 'Cor solta: use um token de src/theme/tokens.ts.',
  },
];
const TEXT_ATTRIBUTES =
  'label|title|message|placeholder|actionLabel|retryLabel|accessibilityLabel|accessibilityHint';
const TEXT_MESSAGE = 'Texto solto na tela: use t() com uma chave de src/i18n/locales.';
const TEXT_RULES = [
  { selector: String.raw`JSXText[value=/\S/]`, message: TEXT_MESSAGE },
  {
    selector: String.raw`JSXElement > JSXExpressionContainer > Literal[value=/\S/]`,
    message: TEXT_MESSAGE,
  },
  {
    selector: `JSXAttribute[name.name=/^(${TEXT_ATTRIBUTES})$/] > Literal`,
    message: TEXT_MESSAGE,
  },
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'supabase/functions/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'scripts/**/*.ts'],
    plugins: { local: localPlugin },
    rules: {
      'local/file-naming': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        // nome fixo do Expo Router (`export const unstable_settings`): único snake_case permitido
        { selector: 'variable', filter: { regex: '^unstable_settings$', match: true }, format: null },
        // variáveis: camelCase; PascalCase para componentes; UPPER_CASE para constantes
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        // funções: camelCase; PascalCase para componentes
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
      ],
    },
  },
  // Regras do design system e do i18n (plano, Fase 2, critérios de saída). Cada grupo de arquivos
  // recebe uma lista só, porque no flat config uma regra repetida substitui a anterior.
  {
    // telas e componentes: sem fontSize, sem cor e sem texto soltos
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/theme/**',
      'src/test/**',
      'src/**/*.test.{ts,tsx}',
      'src/app/catalog.tsx', // temporário: texto de desenvolvimento (sai na Fase 3)
    ],
    rules: {
      'no-restricted-syntax': ['error', FONT_SIZE_RULE, ...COLOR_RULES, ...TEXT_RULES],
    },
  },
  {
    // o catálogo temporário pode ter texto de desenvolvimento, mas não cor nem fontSize soltos
    files: ['src/app/catalog.tsx'],
    rules: {
      'no-restricted-syntax': ['error', FONT_SIZE_RULE, ...COLOR_RULES],
    },
  },
  {
    // theme/: é onde as cores vivem; só o typography.ts pode escrever fontSize
    files: ['src/theme/**/*.{ts,tsx}'],
    ignores: ['src/theme/typography.ts', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', FONT_SIZE_RULE],
    },
  },
  {
    // docs/ARCHITECTURE.md, seção 11.4 (regra 9); os testes do banco não usam Testing Library
    files: ['src/**/*.test.{ts,tsx}', 'tests/app/**/*.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      // No Testing Library 14 `fireEvent` devolve Promise e PRECISA de `await` (sem ele os `act`
      // se sobrepõem e contaminam os testes seguintes). A regra do plugin assume a API antiga.
      'testing-library/no-await-sync-events': 'off',
    },
  },
  {
    // espelha as colunas do banco (snake_case); a regra de nomes não se aplica aqui
    files: ['src/types/database.ts'],
    rules: { '@typescript-eslint/naming-convention': 'off' },
  },
]);
