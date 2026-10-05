import {
  createUserClient,
  POSTGRES_FOREIGN_KEY_VIOLATION,
  SEED_ACTIVE_PLACE_ID,
  SEED_SECOND_ACTIVE_PLACE_ID,
} from './helpers';

// Cota semanal no servidor (003): 3 grátis por semana, idempotente por request_id.
// Os testes abaixo dependem da ordem: cada um parte do estado deixado pelo anterior.
// Só este arquivo gasta a cota do usuário A.

interface QuotaRow {
  allowed: boolean;
  remaining: number | null;
  resets_at: string;
}

describe('weekly quota', () => {
  const { client: a, userId: aId } = createUserClient('A');
  const { client: b } = createUserClient('B');

  const first = crypto.randomUUID();
  const second = crypto.randomUUID();
  const third = crypto.randomUUID();
  const fourth = crypto.randomUUID();

  async function consume(requestId: string, placeId = SEED_ACTIVE_PLACE_ID, action?: string) {
    const { data, error } = await a.rpc('consume_suggestion', {
      p_place_id: placeId,
      p_request_id: requestId,
      ...(action ? { p_action: action } : {}),
    });
    return { row: (data as QuotaRow[] | null)?.[0], error };
  }

  async function status(client = a) {
    const { data, error } = await client.rpc('quota_status');
    return { row: (data as QuotaRow[] | null)?.[0], error };
  }

  it('starts with 3 suggestions and a renewal date within the next 7 days', async () => {
    const { row, error } = await status();
    expect(error).toBeNull();
    expect(row).toMatchObject({ allowed: true, remaining: 3 });

    const resetsIn = new Date(row!.resets_at).getTime() - Date.now();
    expect(resetsIn).toBeGreaterThan(0);
    // 7 dias + 1 hora de folga para a virada do horário de verão
    expect(resetsIn).toBeLessThanOrEqual(7 * 24 * 3600 * 1000 + 3600 * 1000);
  });

  it('does not charge the quota when the place does not exist', async () => {
    const { error } = await consume(crypto.randomUUID(), crypto.randomUUID());
    expect(error?.code).toBe(POSTGRES_FOREIGN_KEY_VIOLATION);
    expect((await status()).row?.remaining).toBe(3);
  });

  it('charges 1 for the first suggestion', async () => {
    const { row, error } = await consume(first);
    expect(error).toBeNull();
    expect(row).toMatchObject({ allowed: true, remaining: 2 });
  });

  it('does not charge twice when the same request_id is repeated', async () => {
    const { row, error } = await consume(first);
    expect(error).toBeNull();
    expect(row).toMatchObject({ allowed: true, remaining: 2 });
    expect((await status()).row?.remaining).toBe(2);

    const events = await a.from('suggestion_events').select('id').eq('request_id', first);
    expect(events.data).toHaveLength(1);
  });

  it('charges the "other" action too', async () => {
    const { row, error } = await consume(second, SEED_SECOND_ACTIVE_PLACE_ID, 'other');
    expect(error).toBeNull();
    expect(row).toMatchObject({ allowed: true, remaining: 1 });
  });

  it('gives the third suggestion and then reaches zero', async () => {
    const { row, error } = await consume(third);
    expect(error).toBeNull();
    expect(row).toMatchObject({ allowed: true, remaining: 0 });
    expect((await status()).row).toMatchObject({ allowed: false, remaining: 0 });
  });

  it('blocks the 4th suggestion of the week and records nothing', async () => {
    const { row, error } = await consume(fourth);
    expect(error).toBeNull();
    expect(row).toMatchObject({ allowed: false, remaining: 0 });

    const blocked = await a.from('suggestion_events').select('id').eq('request_id', fourth);
    expect(blocked.data).toHaveLength(0);
    const all = await a.from('suggestion_events').select('id').eq('user_id', aId);
    expect(all.data).toHaveLength(3);
  });

  it('replays the original answer for an old request_id even after the quota ran out', async () => {
    expect((await consume(first)).row).toMatchObject({ allowed: true, remaining: 2 });
    expect((await consume(second)).row).toMatchObject({ allowed: true, remaining: 1 });
    expect((await status()).row?.remaining).toBe(0);
  });

  it('keeps the quota of user B untouched', async () => {
    expect((await status(b)).row).toMatchObject({ allowed: true, remaining: 3 });
    const events = await b.from('suggestion_events').select('id');
    expect(events.data).toHaveLength(0);
  });
});
