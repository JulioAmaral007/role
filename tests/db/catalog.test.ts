import {
  createUserClient,
  insertStamp,
  SEED_ACTIVE_PLACE_ID,
  SEED_INACTIVE_PLACE_ID,
} from './helpers';

// Catálogo (002): só lugares ativos, mais os inativos que o usuário já carimbou (ADR 9.5).
// Depende do seed_dev.sql. Os testes abaixo dependem da ordem (A só carimba o inativo no meio).

describe('catalog visibility', () => {
  const { client: a } = createUserClient('A');
  const { client: b } = createUserClient('B');

  it('lets a user read the cities, active places, translations and hours', async () => {
    const cities = await a.from('cities').select('id, name');
    expect(cities.error).toBeNull();
    expect((cities.data ?? []).length).toBeGreaterThanOrEqual(1);

    const places = await a.from('places').select('id, active');
    expect(places.error).toBeNull();
    expect((places.data ?? []).map((place) => place.id)).toContain(SEED_ACTIVE_PLACE_ID);

    const translations = await a
      .from('place_translations')
      .select('locale')
      .eq('place_id', SEED_ACTIVE_PLACE_ID);
    expect((translations.data ?? []).map((row) => row.locale).sort()).toEqual(['en', 'es', 'pt-BR']);

    const hours = await a.from('place_hours').select('weekday').eq('place_id', SEED_ACTIVE_PLACE_ID);
    expect((hours.data ?? []).length).toBeGreaterThan(0);
  });

  it('hides inactive places from users who never stamped them', async () => {
    for (const client of [a, b]) {
      const place = await client.from('places').select('id').eq('id', SEED_INACTIVE_PLACE_ID);
      expect(place.data).toHaveLength(0);
      const all = await client.from('places').select('active');
      expect((all.data ?? []).every((row) => row.active === true)).toBe(true);
    }
  });

  it('keeps the translations and hours of an inactive place hidden too', async () => {
    const translations = await a
      .from('place_translations')
      .select('locale')
      .eq('place_id', SEED_INACTIVE_PLACE_ID);
    expect(translations.data).toHaveLength(0);
    const hours = await a.from('place_hours').select('weekday').eq('place_id', SEED_INACTIVE_PLACE_ID);
    expect(hours.data).toHaveLength(0);
  });

  it('can stamp an inactive place (foreign keys do not depend on visibility)', async () => {
    const { error } = await insertStamp(a, { place_id: SEED_INACTIVE_PLACE_ID });
    expect(error).toBeNull();
  });

  it('keeps showing the inactive place to the user who stamped it', async () => {
    const place = await a.from('places').select('id, active').eq('id', SEED_INACTIVE_PLACE_ID);
    expect(place.data).toEqual([{ id: SEED_INACTIVE_PLACE_ID, active: false }]);

    const translations = await a
      .from('place_translations')
      .select('locale')
      .eq('place_id', SEED_INACTIVE_PLACE_ID);
    expect(translations.data).toHaveLength(3);
    const hours = await a.from('place_hours').select('weekday').eq('place_id', SEED_INACTIVE_PLACE_ID);
    expect((hours.data ?? []).length).toBeGreaterThan(0);
  });

  it('still hides that inactive place from another user', async () => {
    const place = await b.from('places').select('id').eq('id', SEED_INACTIVE_PLACE_ID);
    expect(place.data).toHaveLength(0);
    const translations = await b
      .from('place_translations')
      .select('locale')
      .eq('place_id', SEED_INACTIVE_PLACE_ID);
    expect(translations.data).toHaveLength(0);
  });
});
