// API pública do assunto "stamps" (docs/ARCHITECTURE.md, seção 8.9). É aqui que o client do
// Supabase é ligado ao service.
import { supabase } from '@/lib/supabase';

import { SupabaseStampsService } from './supabaseStampsService';

export { createStamp, getNextStampNumber, MEMORY_MAX_LENGTH } from './createStamp';
export type { CreateStampInput } from './createStamp';
export type { StampsService } from './stampsService';

export const stampsService = new SupabaseStampsService(supabase);
