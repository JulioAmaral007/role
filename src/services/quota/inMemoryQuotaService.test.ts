import { FREE_WEEKLY_QUOTA } from '@/types/quota';

import { InMemoryQuotaService, IN_MEMORY_QUOTA_RESETS_AT } from './inMemoryQuotaService';

const consume = (service: InMemoryQuotaService, n: number, action?: 'shown' | 'other') =>
  service.consume({ placeId: `place-${n}`, requestId: `request-${n}`, action });

describe('InMemoryQuotaService', () => {
  it('starts with the whole free quota', async () => {
    await expect(new InMemoryQuotaService().status()).resolves.toEqual({
      kind: 'ok',
      quota: { allowed: true, remaining: FREE_WEEKLY_QUOTA, resetsAt: IN_MEMORY_QUOTA_RESETS_AT },
    });
  });

  it('charges one suggestion per request, until it runs out', async () => {
    const service = new InMemoryQuotaService();
    const remaining = [];
    for (let n = 1; n <= FREE_WEEKLY_QUOTA; n += 1) {
      const result = await consume(service, n);
      remaining.push(result.kind === 'ok' ? result.quota.remaining : 'offline');
    }
    expect(remaining).toEqual([2, 1, 0]);
    await expect(service.status()).resolves.toMatchObject({ quota: { allowed: false, remaining: 0 } });
  });

  it('blocks the next suggestion without recording anything', async () => {
    const service = new InMemoryQuotaService({ remaining: 0 });
    await expect(consume(service, 1)).resolves.toMatchObject({ quota: { allowed: false, remaining: 0 } });
    expect(service.charged).toEqual([]);
    expect(service.consumeCalls).toBe(1);
  });

  it('does not charge twice for the same request id, and repeats the first answer', async () => {
    const service = new InMemoryQuotaService();
    const first = await consume(service, 1);
    await consume(service, 2);
    const repeated = await consume(service, 1);

    expect(repeated).toEqual(first);
    expect(service.charged).toHaveLength(2);
    await expect(service.status()).resolves.toMatchObject({ quota: { remaining: FREE_WEEKLY_QUOTA - 2 } });
  });

  it('charges the "other" action like the first suggestion and keeps the action it was given', async () => {
    const service = new InMemoryQuotaService();
    await consume(service, 1, 'other');
    expect(service.charged[0]).toMatchObject({ action: 'other' });
    await expect(service.status()).resolves.toMatchObject({ quota: { remaining: FREE_WEEKLY_QUOTA - 1 } });
  });

  it('never runs out for Plus, and says remaining is null', async () => {
    const service = new InMemoryQuotaService({ plus: true });
    for (let n = 1; n <= 10; n += 1) {
      await expect(consume(service, n)).resolves.toMatchObject({ quota: { allowed: true, remaining: null } });
    }
    await expect(service.status()).resolves.toMatchObject({ quota: { allowed: true, remaining: null } });
  });

  it('answers "offline" for every call while offline, charging nothing', async () => {
    const service = new InMemoryQuotaService();
    service.setOffline(true);
    await expect(service.status()).resolves.toEqual({ kind: 'offline' });
    await expect(consume(service, 1)).resolves.toEqual({ kind: 'offline' });
    expect(service.charged).toEqual([]);

    service.setOffline(false);
    await expect(consume(service, 1)).resolves.toMatchObject({ kind: 'ok', quota: { remaining: FREE_WEEKLY_QUOTA - 1 } });
  });

  it('accepts a custom starting point and renewal date', async () => {
    const service = new InMemoryQuotaService({ remaining: 1, resetsAt: '2026-11-02T03:00:00.000Z' });
    await expect(service.status()).resolves.toMatchObject({
      quota: { remaining: 1, resetsAt: '2026-11-02T03:00:00.000Z' },
    });
  });
});
