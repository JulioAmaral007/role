import { AppError } from '@/utils/appError';

import { SupabasePlacesRepository } from './supabasePlacesRepository';

const NOW = '2026-10-02T12:00:00Z';

const cityRow = {
  id: 'city-1',
  name: 'Cidade de Teste',
  timezone: 'America/Sao_Paulo',
  daylight_cutoff: '18:00:00',
  created_at: NOW,
  updated_at: NOW,
};

const placeRow = {
  id: 'place-1',
  city_id: 'city-1',
  category: 'viewpoint',
  name: 'Mirante',
  address: 'Rua A, 1',
  lat: -23.5,
  lng: -46.6,
  price_tier: 0,
  typical_spend: 0,
  duration_min: 60,
  moods: ['curious'],
  avoid_tags: [],
  outdoor: true,
  reservable: false,
  reservation_url: null,
  photo_paths: [],
  daylight_only: true,
  accessible: true,
  pet_friendly: false,
  active: true,
  verified_at: null,
  created_at: NOW,
  updated_at: NOW,
  place_translations: [
    {
      place_id: 'place-1',
      locale: 'pt-BR',
      kind_label: 'Mirante',
      reason_mood: 'a',
      reason_time: 'b',
      reason_money: 'c',
      created_at: NOW,
      updated_at: NOW,
    },
  ],
  place_hours: [{ id: 1, place_id: 'place-1', weekday: 5, opens: '09:00:00', closes: '18:00:00' }],
};

interface Response {
  data: unknown;
  error: { message: string; code?: string } | null;
  status: number;
}

const ok = (data: unknown): Response => ({ data, error: null, status: 200 });

interface RecordedCall {
  table: string;
  steps: [method: string, ...args: unknown[]][];
}

/** Um client falso: guarda cada passo da consulta e responde pela tabela (e por `maybeSingle`). */
function createFakeClient(responses: { cities?: Response; city?: Response; places?: Response }) {
  const calls: RecordedCall[] = [];
  const client = {
    from(table: string) {
      const call: RecordedCall = { table, steps: [] };
      calls.push(call);
      const builder: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'in', 'order', 'range', 'maybeSingle']) {
        builder[method] = (...args: unknown[]) => {
          call.steps.push([method, ...args]);
          return builder;
        };
      }
      builder.then = (resolve: (value: Response) => unknown, reject: (reason: unknown) => unknown) => {
        const isSingle = call.steps.some(([method]) => method === 'maybeSingle');
        const response =
          table === 'cities' ? (isSingle ? responses.city : responses.cities) : responses.places;
        return Promise.resolve(response ?? ok(null)).then(resolve, reject);
      };
      return builder;
    },
  };
  return { client: client as never, calls };
}

const stepsOf = (calls: RecordedCall[], table: string, single = false) =>
  calls
    .filter((call) => call.table === table && call.steps.some(([m]) => m === 'maybeSingle') === single)
    .map((call) => call.steps);

describe('SupabasePlacesRepository.listCities', () => {
  it('reads the cities ordered by name and converts them', async () => {
    const { client, calls } = createFakeClient({ cities: ok([cityRow]) });
    const cities = await new SupabasePlacesRepository(client).listCities();

    expect(cities).toEqual([
      { id: 'city-1', name: 'Cidade de Teste', timeZone: 'America/Sao_Paulo', daylightCutoffMinute: 1080 },
    ]);
    expect(stepsOf(calls, 'cities')).toEqual([[['select', '*'], ['order', 'name']]]);
  });

  it('turns a failed request into an AppError', async () => {
    const { client } = createFakeClient({ cities: { data: null, error: { message: 'offline' }, status: 0 } });
    await expect(new SupabasePlacesRepository(client).listCities()).rejects.toMatchObject({
      name: 'AppError',
      code: 'network',
    });
  });
});

describe('SupabasePlacesRepository.getCatalog', () => {
  it('reads the city and its places with translations and hours in one query', async () => {
    const { client, calls } = createFakeClient({ city: ok(cityRow), places: ok([placeRow]) });
    const catalog = await new SupabasePlacesRepository(client).getCatalog('city-1', 'en');

    expect(catalog.city.id).toBe('city-1');
    expect(catalog.places).toHaveLength(1);
    expect(catalog.places[0]).toMatchObject({
      id: 'place-1',
      latitude: -23.5,
      // não há tradução em inglês: usa o pt-BR
      text: { kindLabel: 'Mirante' },
      hours: [{ weekday: 5, opensMinute: 540, closesMinute: 1080 }],
    });

    expect(stepsOf(calls, 'cities', true)).toEqual([[['select', '*'], ['eq', 'id', 'city-1'], ['maybeSingle']]]);
    expect(stepsOf(calls, 'places')).toEqual([
      [
        ['select', '*, place_translations(*), place_hours(*)'],
        ['eq', 'city_id', 'city-1'],
        ['in', 'place_translations.locale', ['en', 'pt-BR']],
        ['order', 'id'],
        ['range', 0, 999],
      ],
    ]);
  });

  it('asks only for the base language once when that is the requested one', async () => {
    const { client, calls } = createFakeClient({ city: ok(cityRow), places: ok([]) });
    await new SupabasePlacesRepository(client).getCatalog('city-1', 'pt-BR');
    expect(stepsOf(calls, 'places')[0]).toContainEqual(['in', 'place_translations.locale', ['pt-BR']]);
  });

  it('skips places that have no usable text', async () => {
    const withoutText = { ...placeRow, id: 'place-2', place_translations: [] };
    const { client } = createFakeClient({ city: ok(cityRow), places: ok([placeRow, withoutText]) });
    const catalog = await new SupabasePlacesRepository(client).getCatalog('city-1', 'pt-BR');
    expect(catalog.places.map(({ id }) => id)).toEqual(['place-1']);
  });

  it('fails with an AppError when the city does not exist or is not visible', async () => {
    const { client } = createFakeClient({ city: ok(null), places: ok([]) });
    const error = await new SupabasePlacesRepository(client).getCatalog('nope', 'pt-BR').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'unknown' });
  });

  it('turns a failure of the places query into an AppError', async () => {
    const { client } = createFakeClient({
      city: ok(cityRow),
      places: { data: null, error: { message: 'permission denied', code: '42501' }, status: 403 },
    });
    await expect(new SupabasePlacesRepository(client).getCatalog('city-1', 'pt-BR')).rejects.toMatchObject({
      code: 'unauthorized',
    });
  });

  it('turns a failure of the city query into an AppError', async () => {
    const { client } = createFakeClient({
      city: { data: null, error: { message: 'too many' }, status: 429 },
      places: ok([]),
    });
    await expect(new SupabasePlacesRepository(client).getCatalog('city-1', 'pt-BR')).rejects.toMatchObject({
      code: 'rateLimited',
    });
  });
});
