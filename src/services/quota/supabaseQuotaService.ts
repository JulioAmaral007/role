import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import type { QuotaStatus } from '@/types/quota';
import { AppError } from '@/utils/appError';

import { toPostgrestAppError } from '../postgrestError';
import type { ConsumeInput, QuotaResult, QuotaService } from './quotaService';

// O client entra pelo construtor (a composição está em `index.ts`), como no `services/places`.
type QuotaClient = Pick<SupabaseClient<Database>, 'rpc'>;

interface QuotaRow {
  allowed: boolean;
  remaining: number | null;
  resets_at: string;
}

/** As RPCs devolvem um array de uma linha; sem linha é um erro do servidor, nunca "cota zerada". */
function toQuotaStatus(rows: readonly QuotaRow[] | null): QuotaStatus {
  const row = rows?.[0];
  if (!row) throw new AppError('unknown', 'The quota RPC returned no row');
  return { allowed: row.allowed, remaining: row.remaining, resetsAt: row.resets_at };
}

/** Falha de rede vira `offline`; o resto continua sendo erro. */
async function toResult(call: () => Promise<QuotaStatus>): Promise<QuotaResult> {
  try {
    return { kind: 'ok', quota: await call() };
  } catch (error) {
    if (error instanceof AppError && error.code === 'network') return { kind: 'offline' };
    throw error;
  }
}

export class SupabaseQuotaService implements QuotaService {
  private readonly client: QuotaClient;

  constructor(client: QuotaClient) {
    this.client = client;
  }

  status(): Promise<QuotaResult> {
    return toResult(async () => {
      const { data, error, status } = await this.client.rpc('quota_status');
      if (error) throw toPostgrestAppError(error, status);
      return toQuotaStatus(data);
    });
  }

  consume({ placeId, requestId, action = 'shown' }: ConsumeInput): Promise<QuotaResult> {
    return toResult(async () => {
      const { data, error, status } = await this.client.rpc('consume_suggestion', {
        p_place_id: placeId,
        p_request_id: requestId,
        p_action: action,
      });
      if (error) throw toPostgrestAppError(error, status);
      return toQuotaStatus(data);
    });
  }
}
