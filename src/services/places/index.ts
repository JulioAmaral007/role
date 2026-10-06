// API pública do assunto "places" (docs/ARCHITECTURE.md, seção 8.9). É aqui que o client do
// Supabase é ligado ao repositório.
import { supabase } from '@/lib/supabase';

import { SupabasePlacesRepository } from './supabasePlacesRepository';

export type { PlacesRepository } from './placesRepository';

export const placesRepository = new SupabasePlacesRepository(supabase);
