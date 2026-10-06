import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { InMemoryPlacesRepository } from '@/services/places/inMemoryPlacesRepository';
import { makePlace, TEST_CITY } from '@/test/factories';
import { AppError } from '@/utils/appError';
import { queryKeys } from '@/lib/queryKeys';

import { PLACES_STALE_TIME_MS, useCities, usePlaces } from './usePlaces';

function setup() {
  const places = [makePlace(), makePlace()];
  const repository = new InMemoryPlacesRepository([{ city: TEST_CITY, places }]);
  // sem tentativas repetidas, para o teste de erro não esperar o intervalo entre elas
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { places, repository, queryClient, wrapper };
}

describe('usePlaces', () => {
  it('loads the catalog of the city', async () => {
    const { repository, places, wrapper } = setup();
    const { result } = await renderHook(() => usePlaces(TEST_CITY.id, 'pt-BR', repository), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ city: TEST_CITY, places });
  });

  it('stays idle while there is no city, without calling the repository', async () => {
    const { repository, wrapper } = setup();
    const { result } = await renderHook(() => usePlaces(undefined, 'pt-BR', repository), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(repository.catalogCalls).toBe(0);
  });

  it('exposes the AppError of a failed request', async () => {
    const { repository, wrapper } = setup();
    repository.failWith(new AppError('network', 'offline'));
    const { result } = await renderHook(() => usePlaces(TEST_CITY.id, 'pt-BR', repository), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ code: 'network' });
  });

  it('asks for the persisted cache and keeps the catalog fresh for 6 hours', async () => {
    const { repository, queryClient, wrapper } = setup();
    const { result } = await renderHook(() => usePlaces(TEST_CITY.id, 'pt-BR', repository), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient.getQueryCache().find({ queryKey: queryKeys.places(TEST_CITY.id, 'pt-BR') });
    expect(query?.meta).toEqual({ persist: true });
    expect(PLACES_STALE_TIME_MS).toBe(6 * 60 * 60 * 1000);
    expect(query?.isStale()).toBe(false);
  });

  it('does not ask the repository again for a catalog that is still fresh', async () => {
    const { repository, wrapper } = setup();
    const { result, unmount } = await renderHook(() => usePlaces(TEST_CITY.id, 'pt-BR', repository), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await unmount();

    const { result: again } = await renderHook(() => usePlaces(TEST_CITY.id, 'pt-BR', repository), { wrapper });
    expect(again.current.data).toBeDefined();
    expect(repository.catalogCalls).toBe(1);
  });

  it('loads another catalog when the language changes and drops the old language from the cache', async () => {
    const { repository, queryClient, wrapper } = setup();
    const { result, rerender } = await renderHook(
      ({ locale }: { locale: 'pt-BR' | 'en' }) => usePlaces(TEST_CITY.id, locale, repository),
      { wrapper, initialProps: { locale: 'pt-BR' } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await rerender({ locale: 'en' });
    await waitFor(() => expect(queryClient.getQueryData(queryKeys.places(TEST_CITY.id, 'en'))).toBeDefined());

    expect(repository.catalogCalls).toBe(2);
    expect(queryClient.getQueryData(queryKeys.places(TEST_CITY.id, 'pt-BR'))).toBeUndefined();
  });
});

describe('useCities', () => {
  it('lists the cities and persists them', async () => {
    const { repository, queryClient, wrapper } = setup();
    const { result } = await renderHook(() => useCities(repository), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([TEST_CITY]);
    expect(queryClient.getQueryCache().find({ queryKey: queryKeys.cities() })?.meta).toEqual({ persist: true });
  });
});
