import 'react-native-gesture-handler/jestSetup';
import { setUpTests } from 'react-native-reanimated';

// Worklets é nativo; no Jest usa-se o mock oficial (docs/ARCHITECTURE.md, seção 11.2).
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));

// AsyncStorage em memória (mock oficial do pacote).
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

setUpTests();

// Auth: nenhum teste do app fala com o Supabase nem lê o .env (o `lib/supabase` valida as variáveis
// ao ser importado). O `AuthProvider` do layout raiz recebe este service em memória; os testes do
// service real importam `@/services/auth/supabaseAuthService` direto, que este mock não toca.
jest.mock('@/services/auth', () => {
  const { InMemoryAuthService } = jest.requireActual('@/services/auth/inMemoryAuthService');
  return { authService: new InMemoryAuthService() };
});
