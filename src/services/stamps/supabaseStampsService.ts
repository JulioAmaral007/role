import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import type { Stamp } from '@/types/stamp';

import { toPostgrestAppError } from '../postgrestError';
import { toFeedbackInserts, toStamp, toStampInsert } from './stampsMapper';
import type { StampsService } from './stampsService';

// O client entra pelo construtor (a composição está em `index.ts`), como em `places` e `quota`.
type StampsClient = Pick<SupabaseClient<Database>, 'from'>;

/** Teto de linhas por consulta do PostgREST (padrão do Supabase); ninguém chega perto no MVP. */
const MAX_STAMPS = 1000;

export class SupabaseStampsService implements StampsService {
  private readonly client: StampsClient;

  constructor(client: StampsClient) {
    this.client = client;
  }

  async list(): Promise<Stamp[]> {
    const { data, error, status } = await this.client
      .from('stamps')
      .select('*, place_feedback(*)')
      .order('stamped_at', { ascending: false })
      .order('number', { ascending: false })
      .range(0, MAX_STAMPS - 1);
    if (error) throw toPostgrestAppError(error, status);
    return data.map(toStamp);
  }

  async upload(stamps: readonly Stamp[]): Promise<void> {
    if (stamps.length === 0) return;

    // `ignoreDuplicates` vira `ON CONFLICT DO NOTHING`: reenviar o mesmo `id` não duplica nem altera.
    const stampsResult = await this.client
      .from('stamps')
      .upsert(stamps.map(toStampInsert), { onConflict: 'id', ignoreDuplicates: true });
    if (stampsResult.error) throw toPostgrestAppError(stampsResult.error, stampsResult.status);

    // Depois dos carimbos (a avaliação aponta para eles). Há no máximo uma avaliação por carimbo
    // (`unique (stamp_id)`), então o reenvio também não duplica. Se esta etapa falhar, o lote todo
    // pode ser reenviado: os carimbos já gravados são ignorados e as avaliações entram.
    const feedback = toFeedbackInserts(stamps);
    if (feedback.length === 0) return;
    const feedbackResult = await this.client
      .from('place_feedback')
      .upsert(feedback, { onConflict: 'stamp_id', ignoreDuplicates: true });
    if (feedbackResult.error) throw toPostgrestAppError(feedbackResult.error, feedbackResult.status);
  }
}
