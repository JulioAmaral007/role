import { makeStamp } from '@/test/factories';

import { SupabaseStampsService } from './supabaseStampsService';

const NOW = '2026-10-02T12:00:00Z';

interface Response {
  data?: unknown;
  error: { message: string; code?: string } | null;
  status: number;
}

const ok: Response = { data: null, error: null, status: 201 };

interface RecordedCall {
  table: string;
  steps: [method: string, ...args: unknown[]][];
}

/** Client falso: guarda os passos de cada consulta e responde pela tabela (e pela ordem das chamadas). */
function createFakeClient(responses: { stamps?: Response; place_feedback?: Response }) {
  const calls: RecordedCall[] = [];
  const client = {
    from(table: 'stamps' | 'place_feedback') {
      const call: RecordedCall = { table, steps: [] };
      calls.push(call);
      const builder: Record<string, unknown> = {};
      for (const method of ['select', 'order', 'range', 'upsert']) {
        builder[method] = (...args: unknown[]) => {
          call.steps.push([method, ...args]);
          return builder;
        };
      }
      builder.then = (resolve: (value: Response) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(responses[table] ?? ok).then(resolve, reject);
      return builder;
    },
  };
  return { client: client as never, calls };
}

const rated = makeStamp({ id: 'a', feedback: { rating: 'spot_on', tags: ['calm'] } });
const skipped = makeStamp({ id: 'b', feedback: null });

describe('SupabaseStampsService.list', () => {
  it('reads the stamps with their feedback, newest first, and converts them', async () => {
    const row = {
      id: 'stamp-1',
      user_id: 'u',
      place_id: 'place-1',
      number: 2,
      stamped_at: NOW,
      mood: null,
      time_slot: null,
      budget: null,
      memory: null,
      created_at: NOW,
      place_feedback: { id: 'f', user_id: 'u', stamp_id: 'stamp-1', rating: 'ok', tags: [], created_at: NOW },
    };
    const { client, calls } = createFakeClient({ stamps: { data: [row], error: null, status: 200 } });

    const stamps = await new SupabaseStampsService(client).list();

    expect(stamps).toEqual([
      {
        id: 'stamp-1',
        placeId: 'place-1',
        number: 2,
        stampedAt: NOW,
        mood: null,
        timeSlot: null,
        budget: null,
        memory: null,
        feedback: { rating: 'ok', tags: [] },
      },
    ]);
    expect(calls[0].steps).toEqual([
      ['select', '*, place_feedback(*)'],
      ['order', 'stamped_at', { ascending: false }],
      ['order', 'number', { ascending: false }],
      ['range', 0, 999],
    ]);
  });

  it('turns a failed request into an AppError', async () => {
    const { client } = createFakeClient({ stamps: { error: { message: 'offline' }, status: 0 } });
    await expect(new SupabaseStampsService(client).list()).rejects.toMatchObject({ name: 'AppError', code: 'network' });
  });
});

describe('SupabaseStampsService.upload', () => {
  it('sends the stamps and then their feedback, both ignoring what already exists', async () => {
    const { client, calls } = createFakeClient({});
    await new SupabaseStampsService(client).upload([rated, skipped]);

    expect(calls.map(({ table }) => table)).toEqual(['stamps', 'place_feedback']);
    const [stampsCall, feedbackCall] = calls;
    expect(stampsCall.steps).toEqual([
      [
        'upsert',
        [
          expect.objectContaining({ id: 'a', place_id: rated.placeId }),
          expect.objectContaining({ id: 'b', place_id: skipped.placeId }),
        ],
        { onConflict: 'id', ignoreDuplicates: true },
      ],
    ]);
    expect(feedbackCall.steps).toEqual([
      ['upsert', [{ stamp_id: 'a', rating: 'spot_on', tags: ['calm'] }], { onConflict: 'stamp_id', ignoreDuplicates: true }],
    ]);
  });

  it('does not touch the feedback table when no stamp has feedback', async () => {
    const { client, calls } = createFakeClient({});
    await new SupabaseStampsService(client).upload([skipped]);
    expect(calls.map(({ table }) => table)).toEqual(['stamps']);
  });

  it('does nothing for an empty batch', async () => {
    const { client, calls } = createFakeClient({});
    await new SupabaseStampsService(client).upload([]);
    expect(calls).toEqual([]);
  });

  it('stops at the stamps and throws when they fail, so the feedback never points to a missing stamp', async () => {
    const { client, calls } = createFakeClient({ stamps: { error: { message: 'down' }, status: 503 } });
    const error = await new SupabaseStampsService(client).upload([rated]).catch((e: unknown) => e);
    expect(error).toMatchObject({ name: 'AppError', code: 'unknown', status: 503 });
    expect(calls.map(({ table }) => table)).toEqual(['stamps']);
  });

  it('throws when the feedback fails, and the whole batch can be sent again', async () => {
    const { client } = createFakeClient({ place_feedback: { error: { message: 'timeout' }, status: 0 } });
    await expect(new SupabaseStampsService(client).upload([rated])).rejects.toMatchObject({
      code: 'network',
      status: 0,
    });
  });

  it('marks a refused stamp (RLS or foreign key) as a permanent 4xx failure', async () => {
    const { client } = createFakeClient({ stamps: { error: { message: 'fk', code: '23503' }, status: 409 } });
    await expect(new SupabaseStampsService(client).upload([rated])).rejects.toMatchObject({ status: 409 });
  });
});
