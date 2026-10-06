import { SupabasePlacesRepository } from '@/services/places/supabasePlacesRepository';

import { createUserClient, SEED_ACTIVE_PLACE_ID, SEED_INACTIVE_PLACE_ID } from './helpers';

// O repositório do catálogo contra o Postgres de verdade: confere a sintaxe da consulta com
// tradução e horários embutidos, o filtro de idioma nas linhas embutidas e a conversão para o
// domínio. Depende do seed_dev.sql. Usa o usuário B, que nunca carimba o lugar inativo.

const SEED_CITY_ID = '00000000-0000-4000-8000-000000000001';

describe('SupabasePlacesRepository against the real database', () => {
  const { client } = createUserClient('B');
  const repository = new SupabasePlacesRepository(client);

  it('lists the seed city with its time zone and cutoff', async () => {
    const cities = await repository.listCities();
    expect(cities).toContainEqual({
      id: SEED_CITY_ID,
      name: 'Cidade de Teste (seed)',
      timeZone: 'America/Sao_Paulo',
      daylightCutoffMinute: 18 * 60,
    });
  });

  it('reads the catalog of the city with translation and hours already resolved', async () => {
    const { city, places } = await repository.getCatalog(SEED_CITY_ID, 'pt-BR');
    expect(city.id).toBe(SEED_CITY_ID);

    const viewpoint = places.find((place) => place.id === SEED_ACTIVE_PLACE_ID);
    expect(viewpoint).toMatchObject({
      cityId: SEED_CITY_ID,
      category: 'viewpoint',
      name: 'Mirante do Morro',
      latitude: -23.542,
      longitude: -46.641,
      daylightOnly: true,
      outdoor: true,
      active: true,
      text: { kindLabel: 'Mirante' },
    });
    // 06:00 às 18:00, todos os dias
    expect(viewpoint?.hours).toHaveLength(7);
    expect(viewpoint?.hours[0]).toEqual({ weekday: 0, opensMinute: 360, closesMinute: 1080 });
    expect(places.every((place) => place.text.kindLabel.length > 0)).toBe(true);
  });

  it('brings the text in the requested language, and the same places in every language', async () => {
    const pt = await repository.getCatalog(SEED_CITY_ID, 'pt-BR');
    const en = await repository.getCatalog(SEED_CITY_ID, 'en');
    const es = await repository.getCatalog(SEED_CITY_ID, 'es');

    const kind = (catalog: typeof pt) =>
      catalog.places.find((place) => place.id === SEED_ACTIVE_PLACE_ID)?.text.kindLabel;
    expect(kind(pt)).toBe('Mirante');
    expect(kind(en)).toBe('Viewpoint');
    expect(kind(es)).toBe('Mirador');
    expect(en.places).toHaveLength(pt.places.length);
    expect(es.places).toHaveLength(pt.places.length);
  });

  it('does not bring inactive places the person never stamped', async () => {
    const { places } = await repository.getCatalog(SEED_CITY_ID, 'pt-BR');
    expect(places.some((place) => place.id === SEED_INACTIVE_PLACE_ID)).toBe(false);
    expect(places.every((place) => place.active)).toBe(true);
  });

  it('fails with an AppError for a city that does not exist', async () => {
    await expect(
      repository.getCatalog('00000000-0000-4000-8000-0000000000ff', 'pt-BR'),
    ).rejects.toMatchObject({ name: 'AppError', code: 'unknown' });
  });
});
