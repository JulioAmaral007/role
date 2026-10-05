// Testes de integração do banco (docs/ARCHITECTURE.md, seção 11.5): `npm run test:db`.
// Rodam contra o projeto `role-dev` do Supabase, só com a publishable key, e ficam fora do
// `npm test` (a config principal ignora tests/db). Sem CLI e sem Docker.
//
// Precisam de: scripts 001–005 e seed_dev.sql aplicados, Edge Function `delete-my-data`
// publicada e o `.env` preenchido (ver docs/SUPABASE_SETUP.md). O `.env` é lido aqui.
const path = require('node:path');

try {
  // não sobrescreve variáveis já definidas no ambiente (ex.: ALLOW_DB_TEST_ON)
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  // sem .env: o globalSetup avisa quais variáveis faltam
}

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/db/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: ['@babel/preset-typescript'],
        plugins: ['@babel/plugin-transform-modules-commonjs'],
      },
    ],
  },
  globalSetup: '<rootDir>/tests/db/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/db/globalTeardown.ts',
  // deleteMyData.test.ts apaga o usuário B e por isso roda por último
  testSequencer: '<rootDir>/tests/db/sequencer.js',
  // chamadas de rede reais
  testTimeout: 30000,
  // os dois usuários de teste são compartilhados; os arquivos rodam um de cada vez
  maxWorkers: 1,
};
