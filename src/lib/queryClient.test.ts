import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/react-query-persist-client';

import {
  CACHE_VERSION,
  createPersistOptions,
  createQueryClient,
  QUERY_CACHE_MAX_AGE_MS,
  QUERY_CACHE_STORAGE_KEY,
  removePlacesOfOtherLocales,
  shouldPersistQuery,
} from './queryClient';
import { queryKeys } from './queryKeys';

function successfulQuery(client: QueryClient, meta?: Record<string, unknown>) {
  const query = client.getQueryCache().build(client, { queryKey: ['probe', Math.random()], meta });
  query.setData('data');
  return query;
}

describe('createQueryClient', () => {
  it('keeps data fresh for a minute, retries once and ignores window focus', () => {
    const defaults = createQueryClient().getDefaultOptions().queries;
    expect(defaults).toMatchObject({ staleTime: 60_000, retry: 1, refetchOnWindowFocus: false });
  });

  it('keeps unused data at least as long as the disk cache is valid (gcTime >= maxAge)', () => {
    const { gcTime } = createQueryClient().getDefaultOptions().queries ?? {};
    expect(gcTime).toBeGreaterThanOrEqual(QUERY_CACHE_MAX_AGE_MS);
  });

  it('uses the cache first and does not loop on retries when offline', () => {
    expect(createQueryClient().getDefaultOptions().queries?.networkMode).toBe('offlineFirst');
  });

  it('creates a new client every time', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});

describe('shouldPersistQuery', () => {
  it('persists a successful query that asked for it', () => {
    expect(shouldPersistQuery(successfulQuery(createQueryClient(), { persist: true }))).toBe(true);
  });

  it('does not persist a successful query that did not ask for it', () => {
    expect(shouldPersistQuery(successfulQuery(createQueryClient()))).toBe(false);
    expect(shouldPersistQuery(successfulQuery(createQueryClient(), { persist: false }))).toBe(false);
  });

  it('does not persist a query that has not succeeded', () => {
    const client = createQueryClient();
    const pending = client.getQueryCache().build(client, { queryKey: ['pending'], meta: { persist: true } });
    expect(shouldPersistQuery(pending)).toBe(false);
  });
});

describe('createPersistOptions', () => {
  it('lasts 7 days, invalidates with the cache version and keeps the allow list', () => {
    const options = createPersistOptions();
    expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    expect(options.buster).toBe(String(CACHE_VERSION));
    expect(options.dehydrateOptions?.shouldDehydrateQuery).toBe(shouldPersistQuery);
  });
});

describe('the persisted cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  async function saveCache(client: QueryClient, buster = String(CACHE_VERSION)) {
    const options = createPersistOptions();
    await persistQueryClientSave({
      queryClient: client,
      persister: options.persister,
      buster,
      dehydrateOptions: options.dehydrateOptions,
    });
    return options;
  }

  it('writes only the queries on the allow list, such as places and not the quota', async () => {
    const client = createQueryClient();
    client.getQueryCache().build(client, { queryKey: queryKeys.places('c1', 'pt-BR'), meta: { persist: true } }).setData({ places: [] });
    client.getQueryCache().build(client, { queryKey: ['quota', 'u1'] }).setData({ remaining: 2 });

    await saveCache(client);

    const stored = JSON.parse((await AsyncStorage.getItem(QUERY_CACHE_STORAGE_KEY)) ?? '{}');
    expect(stored.buster).toBe(String(CACHE_VERSION));
    expect(stored.clientState.queries.map((query: { queryKey: unknown }) => query.queryKey)).toEqual([
      ['places', 'c1', 'pt-BR'],
    ]);
  });

  it('restores the catalog into a new client, as when the app opens offline', async () => {
    const first = createQueryClient();
    first.getQueryCache().build(first, { queryKey: queryKeys.places('c1', 'pt-BR'), meta: { persist: true } }).setData({ places: ['kept'] });
    const options = await saveCache(first);

    const second = createQueryClient();
    await persistQueryClientRestore({
      queryClient: second,
      persister: options.persister,
      maxAge: options.maxAge,
      buster: options.buster,
    });

    expect(second.getQueryData(queryKeys.places('c1', 'pt-BR'))).toEqual({ places: ['kept'] });
  });

  it('throws away a cache saved by another version of the format', async () => {
    const first = createQueryClient();
    first.getQueryCache().build(first, { queryKey: queryKeys.places('c1', 'pt-BR'), meta: { persist: true } }).setData({ places: ['old'] });
    const options = await saveCache(first, 'an-older-version');

    const second = createQueryClient();
    await persistQueryClientRestore({
      queryClient: second,
      persister: options.persister,
      maxAge: options.maxAge,
      buster: options.buster,
    });

    expect(second.getQueryData(queryKeys.places('c1', 'pt-BR'))).toBeUndefined();
  });
});

describe('removePlacesOfOtherLocales', () => {
  it('keeps only the active language of the city, and leaves other cities and queries alone', () => {
    const client = createQueryClient();
    client.setQueryData(queryKeys.places('c1', 'pt-BR'), 'pt');
    client.setQueryData(queryKeys.places('c1', 'en'), 'en');
    client.setQueryData(queryKeys.places('c1', 'es'), 'es');
    client.setQueryData(queryKeys.places('c2', 'en'), 'other city');
    client.setQueryData(queryKeys.cities(), ['cities']);

    removePlacesOfOtherLocales(client, 'c1', 'en');

    expect(client.getQueryData(queryKeys.places('c1', 'pt-BR'))).toBeUndefined();
    expect(client.getQueryData(queryKeys.places('c1', 'es'))).toBeUndefined();
    expect(client.getQueryData(queryKeys.places('c1', 'en'))).toBe('en');
    expect(client.getQueryData(queryKeys.places('c2', 'en'))).toBe('other city');
    expect(client.getQueryData(queryKeys.cities())).toEqual(['cities']);
  });
});
