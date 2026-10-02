// https://docs.expo.dev/guides/using-eslint/
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

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
  {
    // espelha as colunas do banco (snake_case); a regra de nomes não se aplica aqui
    files: ['src/types/database.ts'],
    rules: { '@typescript-eslint/naming-convention': 'off' },
  },
]);
