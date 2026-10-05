import { createContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { authService as defaultAuthService, type AuthService } from '@/services/auth';
import { AppError } from '@/utils/appError';
import { getBackoffDelay } from '@/utils/backoff';

// Sessão anônima do Supabase (docs/ARCHITECTURE.md, seção 8.3). Entra em segundo plano, no primeiro
// render, e NUNCA bloqueia o onboarding nem o Rolê: os filhos aparecem sempre. Quem precisa da
// sessão (cota, carimbos no servidor) lê o `status` e trata "ainda não pronta" como carregando/offline.
export type AuthStatus = 'signingIn' | 'ready' | 'error';

export interface AuthState {
  status: AuthStatus;
  /** `null` até a sessão ficar pronta. */
  userId: string | null;
}

// Espera crescente entre tentativas, com teto de 1 minuto.
export const AUTH_RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000] as const;

export const AuthContext = createContext<AuthState>({ status: 'signingIn', userId: null });

interface AuthProviderProps {
  children: ReactNode;
  /** Injetável para testes; o padrão fala com o Supabase. */
  service?: AuthService;
}

export function AuthProvider({ children, service = defaultAuthService }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: 'signingIn', userId: null });

  useEffect(() => {
    let cancelled = false;
    let running = false;
    let done = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      if (cancelled || done || running) return;
      running = true;
      clearTimeout(timer);
      try {
        const userId = await service.ensureSession();
        done = true;
        if (__DEV__) console.info('[auth] sessão pronta, usuário', userId);
        if (!cancelled) setState({ status: 'ready', userId });
      } catch (error) {
        if (cancelled) return;
        // só em desenvolvimento e sem dados pessoais: sem isto a falha ficaria invisível (a UI não
        // mostra erro de sessão, por desenho)
        if (__DEV__) {
          const code = error instanceof AppError ? error.code : 'unknown';
          const cause = error instanceof Error ? (error.cause ?? error) : error;
          console.warn(`[auth] falha ao entrar (${code}), nova tentativa em breve:`, cause);
        }
        setState({ status: 'error', userId: null });
        timer = setTimeout(run, getBackoffDelay(attempt, AUTH_RETRY_DELAYS_MS));
        attempt += 1;
      } finally {
        running = false;
      }
    };

    run();

    // Voltou ao primeiro plano sem sessão: tenta já, em vez de esperar o fim da espera.
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') run();
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [service]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
