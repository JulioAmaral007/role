import { SupabaseStampsService } from '@/services/stamps/supabaseStampsService';
import type { Stamp } from '@/types/stamp';

import { createUserClient, SEED_ACTIVE_PLACE_ID, SEED_SECOND_ACTIVE_PLACE_ID } from './helpers';

// O service dos carimbos contra o Postgres de verdade: envio idempotente (carimbo e avaliação),
// reenvio depois de uma falha no meio e leitura com a avaliação. Usa o usuário A e confere só os
// próprios ids, porque os outros arquivos também carimbam com A. O usuário B fica intacto (o
// `deleteMyData.test.ts` espera exatamente 1 carimbo dele).

function makeStamp(overrides: Partial<Stamp> = {}): Stamp {
  return {
    id: crypto.randomUUID(),
    placeId: SEED_ACTIVE_PLACE_ID,
    number: 1,
    stampedAt: new Date().toISOString(),
    mood: 'curious',
    timeSlot: '2h',
    budget: 'free',
    memory: 'lembrança do teste',
    feedback: null,
    ...overrides,
  };
}

describe('SupabaseStampsService against the real database', () => {
  const { client } = createUserClient('A');
  const service = new SupabaseStampsService(client);

  const find = async (id: string) => (await service.list()).find((stamp) => stamp.id === id);

  it('uploads a stamp with its feedback and reads both back in the domain shape', async () => {
    const stamp = makeStamp({
      number: 41,
      feedback: { rating: 'spot_on', tags: ['calm', 'good_food'] },
    });
    await service.upload([stamp]);

    const saved = await find(stamp.id);
    expect(saved).toEqual({ ...stamp, stampedAt: expect.any(String) });
    expect(Date.parse(saved?.stampedAt ?? '')).toBe(Date.parse(stamp.stampedAt));
  });

  it('uploads a stamp without feedback, with the optional parts empty', async () => {
    const stamp = makeStamp({ mood: null, timeSlot: null, budget: null, memory: null, feedback: null });
    await service.upload([stamp]);
    expect(await find(stamp.id)).toMatchObject({ mood: null, timeSlot: null, budget: null, memory: null, feedback: null });
  });

  it('is idempotent: sending the same batch again neither fails, nor duplicates, nor changes anything', async () => {
    const stamp = makeStamp({ feedback: { rating: 'ok', tags: [] } });
    await service.upload([stamp]);
    await service.upload([stamp]);
    await service.upload([{ ...stamp, memory: 'outro texto', feedback: { rating: 'miss', tags: ['too_far'] } }]);

    const matches = (await service.list()).filter(({ id }) => id === stamp.id);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ memory: 'lembrança do teste', feedback: { rating: 'ok', tags: [] } });
  });

  it('completes the feedback when a batch is sent again after failing halfway', async () => {
    const withoutFeedback = makeStamp({ feedback: null });
    await service.upload([withoutFeedback]); // só o carimbo chegou
    expect((await find(withoutFeedback.id))?.feedback).toBeNull();

    const full = { ...withoutFeedback, feedback: { rating: 'spot_on' as const, tags: ['good_price' as const] } };
    await service.upload([full]); // o reenvio: o carimbo é ignorado e a avaliação entra
    expect((await find(withoutFeedback.id))?.feedback).toEqual({ rating: 'spot_on', tags: ['good_price'] });
  });

  it('sends several stamps in one batch and lists the newest first', async () => {
    const older = makeStamp({ number: 51, placeId: SEED_ACTIVE_PLACE_ID, stampedAt: '2020-01-01T10:00:00.000Z' });
    const newer = makeStamp({ number: 52, placeId: SEED_SECOND_ACTIVE_PLACE_ID, stampedAt: '2020-01-02T10:00:00.000Z' });
    await service.upload([older, newer]);

    const ids = (await service.list()).map(({ id }) => id);
    expect(ids.indexOf(newer.id)).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
  });

  it('does nothing for an empty batch', async () => {
    await expect(service.upload([])).resolves.toBeUndefined();
  });

  it('refuses a stamp for a place that does not exist as a permanent (4xx) failure', async () => {
    const error = await service
      .upload([makeStamp({ placeId: '00000000-0000-4000-8000-0000000000ee' })])
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ name: 'AppError', code: 'unknown' });
    expect((error as { status: number }).status).toBeGreaterThanOrEqual(400);
    expect((error as { status: number }).status).toBeLessThan(500);
  });

  it('refuses a memory above the 500 characters of the database as a permanent failure', async () => {
    const error = await service.upload([makeStamp({ memory: 'a'.repeat(501) })]).catch((e: unknown) => e);
    expect(error).toMatchObject({ name: 'AppError', code: 'unknown' });
    expect((error as { status: number }).status).toBeLessThan(500);
  });
});
