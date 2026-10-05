import { isAuthApiError, isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { AppError } from '@/utils/appError';

import type { AuthService } from './authService';

type AuthClient = Pick<typeof supabase, 'auth'>;

// Converte o erro do Supabase em `AppError`, para nada acima de `services/` depender dele.
export function toAppError(error: AuthError): AppError {
  if (isAuthRetryableFetchError(error)) {
    return new AppError('network', error.message, { cause: error });
  }
  if (isAuthApiError(error)) {
    if (error.status === 429) return new AppError('rateLimited', error.message, { cause: error });
    if (error.status === 401 || error.status === 403) {
      return new AppError('unauthorized', error.message, { cause: error });
    }
  }
  return new AppError('unknown', error.message, { cause: error });
}

export class SupabaseAuthService implements AuthService {
  private readonly client: AuthClient;
  private inFlight: Promise<string> | null = null;

  constructor(client: AuthClient = supabase) {
    this.client = client;
  }

  // Chamadas simultâneas dividem a mesma tentativa: dois `signInAnonymously` em paralelo
  // criariam dois usuários e gastariam o limite de 30 por hora por IP.
  ensureSession(): Promise<string> {
    this.inFlight ??= this.resolveSession().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async resolveSession(): Promise<string> {
    const { data: current, error: sessionError } = await this.client.auth.getSession();
    if (sessionError) throw toAppError(sessionError);
    if (current.session) return current.session.user.id;

    const { data, error } = await this.client.auth.signInAnonymously();
    if (error) throw toAppError(error);
    if (!data.user) throw new AppError('unknown', 'Anonymous sign-in returned no user');
    return data.user.id;
  }
}
