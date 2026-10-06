import { makeStamp } from '@/test/factories';
import { AppError } from '@/utils/appError';

import { InMemoryStampsService } from './inMemoryStampsService';

const old = makeStamp({ id: 'old', number: 1, stampedAt: '2026-09-01T10:00:00.000Z' });
const recent = makeStamp({ id: 'recent', number: 2, stampedAt: '2026-10-01T10:00:00.000Z' });

describe('InMemoryStampsService', () => {
  it('lists the stamps from the newest to the oldest', async () => {
    const service = new InMemoryStampsService([old, recent]);
    expect((await service.list()).map(({ id }) => id)).toEqual(['recent', 'old']);
  });

  it('breaks a tie in the date by the number', async () => {
    const a = makeStamp({ id: 'a', number: 1, stampedAt: recent.stampedAt });
    const b = makeStamp({ id: 'b', number: 2, stampedAt: recent.stampedAt });
    expect((await new InMemoryStampsService([a, b]).list()).map(({ id }) => id)).toEqual(['b', 'a']);
  });

  it('stores what is uploaded', async () => {
    const service = new InMemoryStampsService();
    await service.upload([old, recent]);
    expect(await service.list()).toHaveLength(2);
  });

  it('is idempotent: sending the same id again neither duplicates nor changes the stamp', async () => {
    const service = new InMemoryStampsService();
    await service.upload([old]);
    await service.upload([old, { ...old, memory: 'changed' }]);

    const stamps = await service.list();
    expect(stamps).toHaveLength(1);
    expect(stamps[0].memory).toBeNull();
  });

  it('counts the upload calls', async () => {
    const service = new InMemoryStampsService();
    await service.upload([old]);
    await service.upload([old]);
    expect(service.uploadCalls).toBe(2);
  });

  it('fails the calls with the given error and stores nothing, until told to stop', async () => {
    const service = new InMemoryStampsService();
    service.failWith(new AppError('network', 'offline'));
    await expect(service.upload([old])).rejects.toMatchObject({ code: 'network' });
    await expect(service.list()).rejects.toMatchObject({ code: 'network' });
    expect(service.uploadCalls).toBe(1);

    service.failWith(null);
    expect(await service.list()).toEqual([]);
    await service.upload([old]);
    expect(await service.list()).toHaveLength(1);
  });
});
