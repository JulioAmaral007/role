import {
  createUserClient,
  insertStamp,
  POSTGRES_CHECK_VIOLATION,
  POSTGRES_UNIQUE_VIOLATION,
  SEED_ACTIVE_PLACE_ID,
} from './helpers';

// Carimbos (001/002): criados no cliente com uuid próprio e reenviados pela fila offline,
// então o insert precisa ser idempotente (ADR 9.5).

describe('stamps', () => {
  const { client: a, userId: aId } = createUserClient('A');
  const { client: b } = createUserClient('B');

  const stampRow = (id: string, overrides: Record<string, unknown> = {}) => ({
    id,
    place_id: SEED_ACTIVE_PLACE_ID,
    number: 1,
    stamped_at: new Date().toISOString(),
    mood: 'curious',
    time_slot: '2h',
    budget: 'up_to_30',
    memory: 'db test',
    ...overrides,
  });

  it('fills user_id with the caller and keeps the client id', async () => {
    const id = crypto.randomUUID();
    const { error } = await a.from('stamps').insert(stampRow(id));
    expect(error).toBeNull();

    const { data } = await a.from('stamps').select('id, user_id, mood, time_slot, budget').eq('id', id);
    expect(data).toEqual([
      { id, user_id: aId, mood: 'curious', time_slot: '2h', budget: 'up_to_30' },
    ]);
  });

  it('does not duplicate a stamp when the same id is sent twice (upsert, ignore duplicates)', async () => {
    const id = crypto.randomUUID();
    const send = () =>
      a.from('stamps').upsert(stampRow(id), { onConflict: 'id', ignoreDuplicates: true });

    expect((await send()).error).toBeNull();
    expect((await send()).error).toBeNull();

    const { data } = await a.from('stamps').select('id').eq('id', id);
    expect(data).toHaveLength(1);
  });

  it('rejects a plain second insert of the same id', async () => {
    const id = crypto.randomUUID();
    expect((await a.from('stamps').insert(stampRow(id))).error).toBeNull();
    const again = await a.from('stamps').insert(stampRow(id));
    expect(again.error?.code).toBe(POSTGRES_UNIQUE_VIOLATION);
  });

  it('does not let B overwrite or take over the stamp of A with the same id', async () => {
    const id = crypto.randomUUID();
    expect((await a.from('stamps').insert(stampRow(id, { memory: 'mine' }))).error).toBeNull();

    const attempt = await b
      .from('stamps')
      .upsert(stampRow(id, { memory: 'stolen' }), { onConflict: 'id', ignoreDuplicates: true });
    expect(attempt.error).toBeNull();

    const forB = await b.from('stamps').select('id').eq('id', id);
    expect(forB.data).toHaveLength(0);
    const forA = await a.from('stamps').select('memory').eq('id', id).single();
    expect(forA.data?.memory).toBe('mine');
  });

  it('does not create a unique constraint on (user_id, number)', async () => {
    const first = await insertStamp(a, { number: 777 });
    const second = await insertStamp(a, { number: 777 });
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
  });

  it('accepts a stamp without mood, time and budget (opened from the place detail)', async () => {
    const { error } = await insertStamp(a);
    expect(error).toBeNull();
  });

  it('rejects an invalid number and a memory longer than 500 characters', async () => {
    const badNumber = await insertStamp(a, { number: 0 });
    expect(badNumber.error?.code).toBe(POSTGRES_CHECK_VIOLATION);
    const badMemory = await insertStamp(a, { memory: 'x'.repeat(501) });
    expect(badMemory.error?.code).toBe(POSTGRES_CHECK_VIOLATION);
  });

  it('rejects unknown enum values', async () => {
    const { error } = await insertStamp(a, { mood: 'angry' });
    expect(error).not.toBeNull();
  });

  describe('feedback', () => {
    it('keeps a single feedback per stamp', async () => {
      const { id: stampId } = await insertStamp(a);
      const send = () =>
        a
          .from('place_feedback')
          .upsert(
            { stamp_id: stampId, rating: 'spot_on', tags: ['calm', 'good_price'] },
            { onConflict: 'stamp_id', ignoreDuplicates: true },
          );
      expect((await send()).error).toBeNull();
      expect((await send()).error).toBeNull();

      const { data } = await a.from('place_feedback').select('rating, tags').eq('stamp_id', stampId);
      expect(data).toHaveLength(1);
      expect(data![0].rating).toBe('spot_on');
      expect(data![0].tags).toEqual(['calm', 'good_price']);

      const plain = await a.from('place_feedback').insert({ stamp_id: stampId, rating: 'miss' });
      expect(plain.error?.code).toBe(POSTGRES_UNIQUE_VIOLATION);
    });

    it('rejects unknown rating and tags', async () => {
      const { id: stampId } = await insertStamp(a);
      const rating = await a.from('place_feedback').insert({ stamp_id: stampId, rating: 'great' });
      expect(rating.error).not.toBeNull();
      const tag = await a
        .from('place_feedback')
        .insert({ stamp_id: stampId, rating: 'ok', tags: ['loud'] });
      expect(tag.error).not.toBeNull();
    });
  });
});
