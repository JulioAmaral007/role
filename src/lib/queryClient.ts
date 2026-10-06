import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, type Query } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

import { queryKeys } from './queryKeys';

// Cliente do React Query e cache persistido (docs/ARCHITECTURE.md, seções 7.6 e 9.3). Só entra no
// disco a consulta que pede (`meta: { persist: true }`) e já deu certo: o catálogo e, depois, os
// carimbos. A cota nunca (um número velho enganaria).

/**
 * Sobe **sempre que o formato de uma consulta persistida mudar**: cache com outro `buster` é
 * descartado na hora (mesma ideia de `version` + `migrate` dos stores).
 */
export const CACHE_VERSION = 1;

export const QUERY_CACHE_STORAGE_KEY = 'role.queryCache';

/** Quanto tempo o cache do disco vale (7 dias). */
export const QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // o catálogo muda pouco: não refaz o pedido a cada tela que o lê
        staleTime: 60_000,
        retry: 1,
        // no celular não existe "foco de janela"; o app volta ao primeiro plano com o AppState
        refetchOnWindowFocus: false,
        // a doc do TanStack exige `gcTime` ≥ `maxAge`: senão o cache é descartado antes de ser lido
        gcTime: QUERY_CACHE_MAX_AGE_MS,
        // usa o cache e tenta a rede; sem rede não fica num laço de tentativas
        networkMode: 'offlineFirst',
      },
    },
  });
}

/** Só persiste a consulta que deu certo e pediu para persistir (lista branca). */
export function shouldPersistQuery(query: Pick<Query, 'state' | 'meta'>): boolean {
  return query.state.status === 'success' && query.meta?.persist === true;
}

/** Opções do `PersistQueryClientProvider`: o disco, a validade, o `buster` e a lista branca. */
export function createPersistOptions(): Omit<PersistQueryClientOptions, 'queryClient'> {
  return {
    persister: createAsyncStoragePersister({
      storage: AsyncStorage,
      key: QUERY_CACHE_STORAGE_KEY,
    }),
    maxAge: QUERY_CACHE_MAX_AGE_MS,
    buster: String(CACHE_VERSION),
    dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
  };
}

/**
 * Ao trocar de idioma, tira do cache o catálogo dos **outros** idiomas da cidade, para ele não
 * crescer com três cópias (ADR 9.3).
 */
export function removePlacesOfOtherLocales(
  client: QueryClient,
  cityId: string,
  activeLocale: string,
): void {
  client.removeQueries({
    queryKey: queryKeys.placesOfCity(cityId),
    predicate: (query) => query.queryKey[2] !== activeLocale,
  });
}
