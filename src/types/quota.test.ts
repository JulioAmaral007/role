import { isTypeEqual, type CamelKeys } from '@/test/typeAssertions';
import type { Database } from '@/types/database';
import type { QuotaStatus } from '@/types/quota';

type RpcRow = Database['public']['Functions']['quota_status']['Returns'][number];

describe('QuotaStatus', () => {
  it('mirrors the row returned by the quota RPCs', () => {
    expect(isTypeEqual<keyof QuotaStatus, CamelKeys<RpcRow>>(true)).toBe(true);
    expect(isTypeEqual<QuotaStatus['remaining'], RpcRow['remaining']>(true)).toBe(true);
    expect(isTypeEqual<QuotaStatus['allowed'], RpcRow['allowed']>(true)).toBe(true);
  });
});
