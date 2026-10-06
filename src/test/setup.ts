import 'react-native-gesture-handler/jestSetup';
import { timeoutManager } from '@tanstack/react-query';
import { setUpTests } from 'react-native-reanimated';

// Worklets é nativo; no Jest usa-se o mock oficial (docs/ARCHITECTURE.md, seção 11.2).
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));

// AsyncStorage em memória (mock oficial do pacote).
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

setUpTests();

// expo-crypto é nativo e, no Jest, `randomUUID` devolve `undefined`: usa o do Node (UUID v4 de verdade).
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual('node:crypto').randomUUID(),
}));

// Auth: nenhum teste do app fala com o Supabase nem lê o .env (o `lib/supabase` valida as variáveis
// ao ser importado). O `AuthProvider` do layout raiz recebe este service em memória; os testes do
// service real importam `@/services/auth/supabaseAuthService` direto, que este mock não toca.
jest.mock('@/services/auth', () => {
  const { InMemoryAuthService } = jest.requireActual('@/services/auth/inMemoryAuthService');
  return { authService: new InMemoryAuthService() };
});

// Cota: idem; um service em memória (cota grátis cheia) no lugar do que fala com as RPCs.
jest.mock('@/services/quota', () => {
  const { InMemoryQuotaService } = jest.requireActual('@/services/quota/inMemoryQuotaService');
  return { quotaService: new InMemoryQuotaService() };
});

// Carimbos: idem; o service em memória, mantendo `createStamp` (que não fala com a rede).
jest.mock('@/services/stamps', () => {
  const { InMemoryStampsService } = jest.requireActual('@/services/stamps/inMemoryStampsService');
  return {
    ...jest.requireActual('@/services/stamps/createStamp'),
    stampsService: new InMemoryStampsService(),
  };
});

// Fotos: idem; um service em memória no lugar do que usa o `expo-file-system` (nativo).
jest.mock('@/services/media', () => {
  const { InMemoryMediaService } = jest.requireActual('@/services/media/inMemoryMediaService');
  return { mediaService: new InMemoryMediaService() };
});

// Catálogo: pelo mesmo motivo, o `services/places` real (que liga o client do Supabase) é trocado por
// um repositório em memória vazio. Os testes dos hooks passam o próprio repositório; os do
// repositório real importam `@/services/places/supabasePlacesRepository` direto.
jest.mock('@/services/places', () => {
  const { InMemoryPlacesRepository } = jest.requireActual('@/services/places/inMemoryPlacesRepository');
  return { placesRepository: new InMemoryPlacesRepository() };
});

// React Query: o tempo de vida do cache (`gcTime`, 7 dias) e o `staleTime` viram temporizadores que
// seguram o processo do Jest aberto depois dos testes. Os temporizadores do React Query passam a
// ser `unref`, então não impedem a saída (o comportamento dentro do app não muda).
function unrefTimer<T>(id: T): T {
  (id as { unref?: () => void } | undefined)?.unref?.();
  return id;
}
timeoutManager.setTimeoutProvider({
  setTimeout: (callback, delay) => unrefTimer(setTimeout(callback, delay)) as unknown as number,
  clearTimeout: (id) => clearTimeout(id as unknown as number),
  setInterval: (callback, delay) => unrefTimer(setInterval(callback, delay)) as unknown as number,
  clearInterval: (id) => clearInterval(id as unknown as number),
});
