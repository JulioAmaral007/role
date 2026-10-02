import { setUpTests } from 'react-native-reanimated';

// Worklets é nativo; no Jest usa-se o mock oficial (docs/ARCHITECTURE.md, seção 11.2).
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));

// AsyncStorage em memória (mock oficial do pacote).
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

setUpTests();
