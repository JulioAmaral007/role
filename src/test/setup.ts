import { setUpTests } from 'react-native-reanimated';

// Worklets é nativo; no Jest usa-se o mock oficial (docs/ARCHITECTURE.md, seção 11.2).
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));

setUpTests();
