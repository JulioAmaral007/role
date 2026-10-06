import { makePlace, TEST_CITY } from '@/test/factories';
import { AppError } from '@/utils/appError';

import { InMemoryPlacesRepository } from './inMemoryPlacesRepository';

const OTHER_CITY = { ...TEST_CITY, id: 'city-2', name: 'Outra Cidade' };

describe('InMemoryPlacesRepository', () => {
  const places = [makePlace(), makePlace()];
  const catalogs = [
    { city: TEST_CITY, places },
    { city: OTHER_CITY, places: [] },
  ];

  it('lists the cities of its catalogs', async () => {
    await expect(new InMemoryPlacesRepository(catalogs).listCities()).resolves.toEqual([TEST_CITY, OTHER_CITY]);
    await expect(new InMemoryPlacesRepository().listCities()).resolves.toEqual([]);
  });

  it('returns the catalog of the city, whatever the language', async () => {
    const repository = new InMemoryPlacesRepository(catalogs);
    await expect(repository.getCatalog(TEST_CITY.id, 'en')).resolves.toEqual({ city: TEST_CITY, places });
    await expect(repository.getCatalog('city-2', 'pt-BR')).resolves.toEqual({ city: OTHER_CITY, places: [] });
  });

  it('hands out a copy of the list, so callers cannot change what it holds', async () => {
    const repository = new InMemoryPlacesRepository(catalogs);
    const first = await repository.getCatalog(TEST_CITY.id, 'pt-BR');
    first.places.pop();
    const second = await repository.getCatalog(TEST_CITY.id, 'pt-BR');
    expect(second.places).toHaveLength(2);
  });

  it('rejects with an AppError for an unknown city', async () => {
    await expect(new InMemoryPlacesRepository(catalogs).getCatalog('nope', 'pt-BR')).rejects.toBeInstanceOf(AppError);
  });

  it('counts the catalog requests', async () => {
    const repository = new InMemoryPlacesRepository(catalogs);
    await repository.getCatalog(TEST_CITY.id, 'pt-BR');
    await repository.getCatalog(TEST_CITY.id, 'pt-BR');
    expect(repository.catalogCalls).toBe(2);
  });

  it('fails every call with the given error until told to stop', async () => {
    const repository = new InMemoryPlacesRepository(catalogs);
    repository.failWith(new AppError('network', 'offline'));
    await expect(repository.listCities()).rejects.toMatchObject({ code: 'network' });
    await expect(repository.getCatalog(TEST_CITY.id, 'pt-BR')).rejects.toMatchObject({ code: 'network' });

    repository.failWith(null);
    await expect(repository.getCatalog(TEST_CITY.id, 'pt-BR')).resolves.toMatchObject({ city: TEST_CITY });
  });
});
