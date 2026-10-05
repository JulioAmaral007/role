import { FunctionsHttpError } from '@supabase/supabase-js';

import {
  createUserClient,
  insertStamp,
  readDbTestEnv,
  SEED_ACTIVE_PLACE_ID,
} from './helpers';

// Edge Function delete-my-data (ADR 8.8). Este arquivo roda POR ÚLTIMO (sequencer.js): apaga o
// usuário B, que os outros arquivos ainda usam. O token do B continua válido como JWT depois da
// exclusão, então dá para conferir pelo PostgREST que a cascata não deixou nada para trás.

describe('delete-my-data', () => {
  const { client: a } = createUserClient('A');
  const { client: b, userId: bId, token: bToken } = createUserClient('B');

  it('rejects a call without a user session', async () => {
    const { url, key } = readDbTestEnv();
    const response = await fetch(`${url}/functions/v1/delete-my-data`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    expect(response.status).toBe(401);
  });

  it('deletes the caller and everything that belongs to them', async () => {
    // dados de B em todas as tabelas de usuário
    const stamp = await insertStamp(b);
    expect(stamp.error).toBeNull();
    expect(
      (await b.from('place_feedback').insert({ stamp_id: stamp.id, rating: 'ok', tags: ['calm'] })).error,
    ).toBeNull();
    expect(
      (await b.from('place_reports').insert({ place_id: SEED_ACTIVE_PLACE_ID, reason: 'other' })).error,
    ).toBeNull();
    expect((await b.from('events').insert({ name: 'db_test_delete' })).error).toBeNull();
    expect((await b.from('plus_interest').insert({ plan_viewed: 'db_test' })).error).toBeNull();
    const consumed = await b.rpc('consume_suggestion', {
      p_place_id: SEED_ACTIVE_PLACE_ID,
      p_request_id: crypto.randomUUID(),
    });
    expect(consumed.error).toBeNull();

    expect((await b.from('profiles').select('id').eq('id', bId)).data).toHaveLength(1);
    expect((await b.from('stamps').select('id')).data).toHaveLength(1);
    expect((await b.from('suggestion_events').select('id')).data).toHaveLength(1);

    const { data, error } = await b.functions.invoke('delete-my-data', {
      headers: { Authorization: `Bearer ${bToken}` },
    });
    if (error instanceof FunctionsHttpError) {
      throw new Error(
        `delete-my-data respondeu ${error.context.status}: ${await error.context.text()}. ` +
          'A função foi publicada no role-dev? (docs/SUPABASE_SETUP.md, seção 6)',
      );
    }
    expect(error).toBeNull();
    expect(data).toEqual({ ok: true });

    // a cascata apagou tudo (o JWT ainda assina corretamente, mas o usuário não existe mais)
    for (const table of ['profiles', 'stamps', 'place_feedback', 'suggestion_events']) {
      const rows = await b.from(table).select('*');
      expect(rows.error).toBeNull();
      expect(rows.data).toHaveLength(0);
    }
  });

  it('leaves the other users and their data alone', async () => {
    const profile = await a.from('profiles').select('id');
    expect(profile.data).toHaveLength(1);
    const stamps = await a.from('stamps').select('id');
    expect((stamps.data ?? []).length).toBeGreaterThan(0);
  });

  it('rejects a repeated call for a user that no longer exists', async () => {
    const { error } = await b.functions.invoke('delete-my-data', {
      headers: { Authorization: `Bearer ${bToken}` },
    });
    expect(error).toBeInstanceOf(FunctionsHttpError);
    expect((error as FunctionsHttpError).context.status).toBe(401);
  });
});
