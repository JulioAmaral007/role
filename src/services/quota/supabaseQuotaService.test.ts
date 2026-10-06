import { AppError } from '@/utils/appError';

import { SupabaseQuotaService } from './supabaseQuotaService';

const RESETS_AT = '2026-10-05T03:00:00+00:00';

interface Response {
  data: unknown;
  error: { message: string; code?: string } | null;
  status: number;
}

const ok = (rows: unknown): Response => ({ data: rows, error: null, status: 200 });

function createService(response: Response) {
  const rpc = jest.fn(async () => response);
  return { service: new SupabaseQuotaService({ rpc } as never), rpc };
}

describe('SupabaseQuotaService.status', () => {
  it('calls quota_status and converts the single row', async () => {
    const { service, rpc } = createService(ok([{ allowed: true, remaining: 2, resets_at: RESETS_AT }]));
    await expect(service.status()).resolves.toEqual({
      kind: 'ok',
      quota: { allowed: true, remaining: 2, resetsAt: RESETS_AT },
    });
    expect(rpc).toHaveBeenCalledWith('quota_status');
  });

  it('keeps remaining as null for Plus', async () => {
    const { service } = createService(ok([{ allowed: true, remaining: null, resets_at: RESETS_AT }]));
    await expect(service.status()).resolves.toMatchObject({ quota: { remaining: null } });
  });

  it('reports a quota that ran out as allowed false, not as an error', async () => {
    const { service } = createService(ok([{ allowed: false, remaining: 0, resets_at: RESETS_AT }]));
    await expect(service.status()).resolves.toEqual({
      kind: 'ok',
      quota: { allowed: false, remaining: 0, resetsAt: RESETS_AT },
    });
  });

  it('turns a missing network into the offline state', async () => {
    const { service } = createService({ data: null, error: { message: 'TypeError: Network request failed', code: '' }, status: 0 });
    await expect(service.status()).resolves.toEqual({ kind: 'offline' });
  });

  it('keeps the other failures as AppError', async () => {
    const limited = createService({ data: null, error: { message: 'slow down' }, status: 429 }).service;
    await expect(limited.status()).rejects.toMatchObject({ name: 'AppError', code: 'rateLimited' });

    const noSession = createService({ data: null, error: { message: 'not authenticated', code: '28000' }, status: 401 }).service;
    await expect(noSession.status()).rejects.toMatchObject({ code: 'unauthorized' });

    const broken = createService({ data: null, error: { message: 'boom' }, status: 500 }).service;
    await expect(broken.status()).rejects.toMatchObject({ code: 'unknown' });
  });

  it('treats an answer without a row as a server error, never as an empty quota', async () => {
    for (const data of [[], null]) {
      const { service } = createService(ok(data));
      const error = await service.status().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: 'unknown' });
    }
  });
});

describe('SupabaseQuotaService.consume', () => {
  const input = { placeId: 'place-1', requestId: 'request-1' };

  it('calls consume_suggestion with the place, the request id and the "shown" action by default', async () => {
    const { service, rpc } = createService(ok([{ allowed: true, remaining: 1, resets_at: RESETS_AT }]));
    await expect(service.consume(input)).resolves.toEqual({
      kind: 'ok',
      quota: { allowed: true, remaining: 1, resetsAt: RESETS_AT },
    });
    expect(rpc).toHaveBeenCalledWith('consume_suggestion', {
      p_place_id: 'place-1',
      p_request_id: 'request-1',
      p_action: 'shown',
    });
  });

  it('sends the "other" action for the "Outra" button', async () => {
    const { service, rpc } = createService(ok([{ allowed: true, remaining: 0, resets_at: RESETS_AT }]));
    await service.consume({ ...input, action: 'other' });
    expect(rpc).toHaveBeenCalledWith('consume_suggestion', expect.objectContaining({ p_action: 'other' }));
  });

  it('returns allowed false when there is no quota left', async () => {
    const { service } = createService(ok([{ allowed: false, remaining: 0, resets_at: RESETS_AT }]));
    await expect(service.consume(input)).resolves.toMatchObject({ quota: { allowed: false, remaining: 0 } });
  });

  it('turns a missing network into the offline state', async () => {
    const { service } = createService({ data: null, error: { message: 'Network request failed' }, status: 0 });
    await expect(service.consume(input)).resolves.toEqual({ kind: 'offline' });
  });

  it('keeps the other failures as AppError, such as a place that does not exist', async () => {
    const { service } = createService({ data: null, error: { message: 'foreign key violation', code: '23503' }, status: 409 });
    await expect(service.consume(input)).rejects.toMatchObject({ name: 'AppError', code: 'unknown' });
  });
});
