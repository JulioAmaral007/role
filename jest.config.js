// Projeto de testes do app (docs/ARCHITECTURE.md, seção 11.2). Os testes do banco ficam em tests/db
// e rodam com a config própria da Fase 4.
// Datas determinísticas: definido aqui (e não no setup) para os workers do Jest herdarem.
process.env.TZ = 'UTC';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@formatjs/.*|standard-navigation)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // o primeiro render de cada arquivo carrega react-native-svg e as fontes: com cache frio passa de 5 s
  testTimeout: 30000,
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/db/'],
  // Cobertura (docs/ARCHITECTURE.md, seção 11): o relatório e o limite valem só para `src/domain/`,
  // sem limite global, para não incentivar teste vazio. Arquivo sem teste entra com 0%.
  collectCoverageFrom: ['src/domain/**/*.ts', '!src/domain/**/*.test.ts'],
  coverageThreshold: {
    './src/domain/': { lines: 90, branches: 90 },
  },
};
