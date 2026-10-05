import {
  createPublicClient,
  createUserClient,
  POSTGRES_INVALID_PARAMETER,
  POSTGRES_PERMISSION_DENIED,
  SEED_ACTIVE_PLACE_ID,
} from './helpers';

// Grants mínimos e RLS (002): o que cada role NÃO pode fazer.

describe('anon (no login)', () => {
  const anon = createPublicClient();

  it.each(['cities', 'places', 'place_translations', 'place_hours', 'profiles', 'stamps'])(
    'cannot read %s',
    async (table) => {
      const { data, error } = await anon.from(table).select('*').limit(1);
      expect(error?.code).toBe(POSTGRES_PERMISSION_DENIED);
      expect(data ?? []).toHaveLength(0);
    },
  );

  it('cannot call the quota RPCs', async () => {
    const status = await anon.rpc('quota_status');
    expect(status.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
    const consume = await anon.rpc('consume_suggestion', {
      p_place_id: SEED_ACTIVE_PLACE_ID,
      p_request_id: crypto.randomUUID(),
    });
    expect(consume.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
  });
});

describe('authenticated user', () => {
  const { client: a, userId: aId } = createUserClient('A');

  it('has a profile created by the trigger, on the free plan', async () => {
    const { data, error } = await a.from('profiles').select('id, plan, locale, timezone');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0]).toMatchObject({ id: aId, plan: 'free' });
  });

  it('cannot change profiles.plan', async () => {
    const { error } = await a.from('profiles').update({ plan: 'plus' }).eq('id', aId);
    expect(error?.code).toBe(POSTGRES_PERMISSION_DENIED);
    const { data } = await a.from('profiles').select('plan').eq('id', aId).single();
    expect(data?.plan).toBe('free');
  });

  it('can change locale, timezone and accepted_terms_at', async () => {
    const acceptedAt = new Date().toISOString();
    const { data, error } = await a
      .from('profiles')
      .update({ locale: 'en', timezone: 'America/Sao_Paulo', accepted_terms_at: acceptedAt })
      .eq('id', aId)
      .select('locale, timezone, accepted_terms_at');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].locale).toBe('en');
    expect(data![0].accepted_terms_at).not.toBeNull();
  });

  it('rejects an invalid locale (check constraint)', async () => {
    const { error } = await a.from('profiles').update({ locale: 'xx' }).eq('id', aId);
    expect(error).not.toBeNull();
  });

  it('cannot insert directly into suggestion_events', async () => {
    const { error } = await a.from('suggestion_events').insert({
      place_id: SEED_ACTIVE_PLACE_ID,
      action: 'shown',
    });
    expect(error?.code).toBe(POSTGRES_PERMISSION_DENIED);
  });

  it('cannot write to the catalog', async () => {
    const insert = await a.from('places').insert({ name: 'x' });
    expect(insert.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
    const update = await a.from('places').update({ name: 'x' }).eq('id', SEED_ACTIVE_PLACE_ID);
    expect(update.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
    const remove = await a.from('places').delete().eq('id', SEED_ACTIVE_PLACE_ID);
    expect(remove.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
  });

  it.each(['place_reports', 'events', 'plus_interest'])(
    'cannot read %s (insert-only table)',
    async (table) => {
      const { error } = await a.from(table).select('*').limit(1);
      expect(error?.code).toBe(POSTGRES_PERMISSION_DENIED);
    },
  );

  it('can insert into the insert-only tables, always as itself', async () => {
    const report = await a
      .from('place_reports')
      .insert({ place_id: SEED_ACTIVE_PLACE_ID, reason: 'closed', note: 'db test' });
    expect(report.error).toBeNull();
    const event = await a.from('events').insert({ name: 'db_test', props: { app_env: 'development' } });
    expect(event.error).toBeNull();
    const interest = await a.from('plus_interest').insert({ plan_viewed: 'db_test' });
    expect(interest.error).toBeNull();
  });

  it('cannot insert an insert-only row owned by another user', async () => {
    const { userId: bId } = createUserClient('B');
    const report = await a
      .from('place_reports')
      .insert({ user_id: bId, place_id: SEED_ACTIVE_PLACE_ID, reason: 'closed' });
    expect(report.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
    const event = await a.from('events').insert({ user_id: bId, name: 'db_test' });
    expect(event.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
    const interest = await a.from('plus_interest').insert({ user_id: bId, plan_viewed: 'db_test' });
    expect(interest.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
  });

  it('rejects an invalid report reason (enum)', async () => {
    const { error } = await a
      .from('place_reports')
      .insert({ place_id: SEED_ACTIVE_PLACE_ID, reason: 'not_a_reason' });
    expect(error).not.toBeNull();
  });

  it('cannot call the internal quota helpers', async () => {
    const start = await a.rpc('quota_week_start', {
      ts: new Date().toISOString(),
      tz: 'America/Sao_Paulo',
    });
    expect(start.error?.code).toBe(POSTGRES_PERMISSION_DENIED);
  });

  it('cannot upload to the public place-photos bucket', async () => {
    const { error } = await a.storage
      .from('place-photos')
      .upload(`db-test/${crypto.randomUUID()}.txt`, new Blob(['db test']));
    expect(error).not.toBeNull();
  });

  it('rejects an invalid consume_suggestion action', async () => {
    const { error } = await a.rpc('consume_suggestion', {
      p_place_id: SEED_ACTIVE_PLACE_ID,
      p_request_id: crypto.randomUUID(),
      p_action: 'go',
    });
    expect(error?.code).toBe(POSTGRES_INVALID_PARAMETER);
  });
});
