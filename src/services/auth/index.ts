// API pública do assunto "auth" (docs/ARCHITECTURE.md, seção 8.9).
import { SupabaseAuthService } from './supabaseAuthService';

export type { AuthService } from './authService';

export const authService = new SupabaseAuthService();
