import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isTypeEqual, type CamelKeys } from '@/test/typeAssertions';
import type { Database } from '@/types/database';
import { FREE_WEEKLY_QUOTA, type QuotaStatus } from '@/types/quota';

type RpcRow = Database['public']['Functions']['quota_status']['Returns'][number];

describe('QuotaStatus', () => {
  it('mirrors the row returned by the quota RPCs', () => {
    expect(isTypeEqual<keyof QuotaStatus, CamelKeys<RpcRow>>(true)).toBe(true);
    expect(isTypeEqual<QuotaStatus['remaining'], RpcRow['remaining']>(true)).toBe(true);
    expect(isTypeEqual<QuotaStatus['allowed'], RpcRow['allowed']>(true)).toBe(true);
  });
});

describe('FREE_WEEKLY_QUOTA', () => {
  it('matches free_weekly_quota() of the quota script', () => {
    const sql = readFileSync(join(__dirname, '../../supabase/sql/003_quota.sql'), 'utf8');
    const match = /function public\.free_weekly_quota\(\)[\s\S]*?as \$\$ select (\d+) \$\$/.exec(sql);
    expect(match).not.toBeNull();
    expect(FREE_WEEKLY_QUOTA).toBe(Number(match?.[1]));
  });
});
