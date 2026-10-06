// API pública do assunto "quota" (docs/ARCHITECTURE.md, seção 8.9). É aqui que o client do
// Supabase é ligado ao service.
import { supabase } from '@/lib/supabase';

import { SupabaseQuotaService } from './supabaseQuotaService';

export type { ConsumeInput, QuotaAction, QuotaResult, QuotaService } from './quotaService';

export const quotaService = new SupabaseQuotaService(supabase);
