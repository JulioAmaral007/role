// Validação pura das variáveis de ambiente (docs/ARCHITECTURE.md, seção 12.2). Não lê `process.env`:
// quem lê é `src/lib/env.ts`, que passa os valores crus para cá. Separado para dar para testar a
// validação sem disparar a leitura (o `env.ts` falha ao ser importado se faltar variável).
//
// Tudo que entra no app é público: vai dentro do bundle. A secret key e a service_role NUNCA
// entram, e esta validação recusa as duas.

const APP_ENVS = ['development', 'preview', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

export interface Env {
  appEnv: AppEnv;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export interface RawEnv {
  appEnv?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
}

export class EnvError extends Error {
  constructor(problems: string[]) {
    super(
      `Variáveis de ambiente inválidas:\n- ${problems.join('\n- ')}\n` +
        'Copie o .env.example para .env e preencha (docs/SUPABASE_SETUP.md, seção 2). ' +
        'Depois de mudar o .env, recarregue o app por completo.',
    );
    this.name = 'EnvError';
  }
}

function isAppEnv(value: string): value is AppEnv {
  return (APP_ENVS as readonly string[]).includes(value);
}

// A service_role legada é um JWT com `role: "service_role"` no corpo; a nova secret key
// começa com `sb_secret_`. A publishable key (`sb_publishable_`) e a `anon` são aceitas.
function isSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(atob(base64));
    return (
      typeof payload === 'object' &&
      payload !== null &&
      (payload as { role?: unknown }).role === 'service_role'
    );
  } catch {
    return false;
  }
}

/** Valida os valores crus e devolve o objeto tipado, ou lança `EnvError` com todos os problemas. */
export function parseEnv(raw: RawEnv): Env {
  const problems: string[] = [];
  const appEnv = raw.appEnv?.trim() ?? '';
  const supabaseUrl = raw.supabaseUrl?.trim() ?? '';
  const supabasePublishableKey = raw.supabasePublishableKey?.trim() ?? '';

  if (!appEnv) {
    problems.push('EXPO_PUBLIC_APP_ENV está vazia (development, preview ou production)');
  } else if (!isAppEnv(appEnv)) {
    problems.push(
      `EXPO_PUBLIC_APP_ENV="${appEnv}" não é conhecida (use development, preview ou production)`,
    );
  }

  if (!supabaseUrl) {
    problems.push('EXPO_PUBLIC_SUPABASE_URL está vazia');
  } else {
    try {
      if (new URL(supabaseUrl).protocol !== 'https:') {
        problems.push('EXPO_PUBLIC_SUPABASE_URL precisa começar com https://');
      }
    } catch {
      problems.push('EXPO_PUBLIC_SUPABASE_URL não é uma URL válida');
    }
  }

  if (!supabasePublishableKey) {
    problems.push(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY está vazia (o nome antigo EXPO_PUBLIC_SUPABASE_KEY não vale)',
    );
  } else if (isSecretKey(supabasePublishableKey)) {
    problems.push(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY é uma chave SECRETA. Use só a publishable key ' +
        '(sb_publishable_...); a secret key nunca vai para o app. Se ela já foi commitada ou ' +
        'compartilhada, gere uma nova no dashboard e revogue a antiga.',
    );
  }

  if (problems.length > 0) {
    throw new EnvError(problems);
  }
  return { appEnv: appEnv as AppEnv, supabaseUrl, supabasePublishableKey };
}
