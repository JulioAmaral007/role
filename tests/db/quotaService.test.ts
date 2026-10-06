import { SupabaseQuotaService } from '@/services/quota/supabaseQuotaService';
import { FREE_WEEKLY_QUOTA } from '@/types/quota';

import { createPublicClient, createUserClient } from './helpers';

// O service da cota contra as RPCs de verdade. Só lê e tenta consumos que falham: quem gasta cota
// de verdade é o `quota.test.ts`, que depende de a cota de A e de B estar intacta. Por isso aqui
// nada é gasto.

describe('SupabaseQuotaService against the real database', () => {
  const { client } = createUserClient('B');
  const service = new SupabaseQuotaService(client);

  it('reads the quota status in the shape of the app, without spending anything', async () => {
    const first = await service.status();
    const second = await service.status();

    expect(first.kind).toBe('ok');
    expect(second).toEqual(first);
    if (first.kind !== 'ok') return;

    const { allowed, remaining, resetsAt } = first.quota;
    expect(typeof allowed).toBe('boolean');
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(FREE_WEEKLY_QUOTA);
    // a semana renova nos próximos 7 dias
    const msUntilReset = new Date(resetsAt).getTime() - Date.now();
    expect(msUntilReset).toBeGreaterThan(0);
    expect(msUntilReset).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  it('turns a consume for a place that does not exist into an AppError, without charging', async () => {
    const before = await service.status();
    const error = await service
      .consume({
        placeId: '00000000-0000-4000-8000-0000000000ee',
        requestId: crypto.randomUUID(),
      })
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ name: 'AppError', code: 'unknown' });
    await expect(service.status()).resolves.toEqual(before);
  });

  it('turns a call without a session into an unauthorized AppError', async () => {
    const anonymous = new SupabaseQuotaService(createPublicClient());
    await expect(anonymous.status()).rejects.toMatchObject({ name: 'AppError', code: 'unauthorized' });
  });
});
