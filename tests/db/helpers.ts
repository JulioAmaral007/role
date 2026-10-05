import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IDs do seed_dev.sql (nunca alterados pelos testes; só são lidos ou referenciados).
export const SEED_ACTIVE_PLACE_ID = '10000000-0000-4000-8000-000000000001';
export const SEED_SECOND_ACTIVE_PLACE_ID = '10000000-0000-4000-8000-000000000002';
export const SEED_INACTIVE_PLACE_ID = '10000000-0000-4000-8000-000000000011';

export type TestUserLabel = 'A' | 'B';

export const POSTGRES_PERMISSION_DENIED = '42501';
export const POSTGRES_UNIQUE_VIOLATION = '23505';
export const POSTGRES_FOREIGN_KEY_VIOLATION = '23503';
export const POSTGRES_CHECK_VIOLATION = '23514';
export const POSTGRES_INVALID_PARAMETER = '22023';

const CLIENT_OPTIONS = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

interface DbTestEnv {
  url: string;
  key: string;
}

/**
 * Lê e valida o ambiente. Aborta fora de `development` (ADR 12.4): o `role-mvp` só entra com
 * `ALLOW_DB_TEST_ON=preview`, informado pelo usuário naquela execução, e produção nunca.
 */
export function readDbTestEnv(): DbTestEnv {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV;

  const missing = [
    ['EXPO_PUBLIC_APP_ENV', appEnv],
    ['EXPO_PUBLIC_SUPABASE_URL', url],
    ['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', key],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(
      `test:db: faltam variáveis no .env: ${missing.join(', ')}. ` +
        'Copie o .env.example para .env e preencha (docs/SUPABASE_SETUP.md, seção 2). ' +
        'Atenção: o nome certo da chave é EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  const allowedEnv = process.env.ALLOW_DB_TEST_ON === 'preview' ? 'preview' : 'development';
  if (appEnv === 'production' || appEnv !== allowedEnv) {
    throw new Error(
      `test:db abortado: EXPO_PUBLIC_APP_ENV="${appEnv}", mas os testes só rodam em "${allowedEnv}" ` +
        '(o role-dev). Para o role-mvp, antes de entrarem testadores, use ALLOW_DB_TEST_ON=preview ' +
        'só naquela execução.',
    );
  }
  if (!url!.startsWith('https://')) {
    throw new Error('test:db: EXPO_PUBLIC_SUPABASE_URL precisa começar com https://');
  }
  if (key!.includes('service_role') || key!.startsWith('sb_secret_')) {
    throw new Error('test:db: use só a publishable key (sb_publishable_...). Nunca a secret key.');
  }
  return { url: url!, key: key! };
}

export function createPublicClient(): SupabaseClient {
  const { url, key } = readDbTestEnv();
  return createClient(url, key, CLIENT_OPTIONS);
}

export function tokenEnvName(label: TestUserLabel): string {
  return `DB_TEST_${label}_TOKEN`;
}

export function idEnvName(label: TestUserLabel): string {
  return `DB_TEST_${label}_ID`;
}

/** Cliente autenticado como um dos dois usuários anônimos criados no globalSetup. */
export function createUserClient(label: TestUserLabel): {
  client: SupabaseClient;
  userId: string;
  token: string;
} {
  const { url, key } = readDbTestEnv();
  const token = process.env[tokenEnvName(label)];
  const userId = process.env[idEnvName(label)];
  if (!token || !userId) {
    throw new Error(`test:db: o usuário de teste ${label} não foi criado (globalSetup).`);
  }
  const client = createClient(url, key, {
    ...CLIENT_OPTIONS,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { client, userId, token };
}

/** Insere um carimbo mínimo para o usuário do cliente (o dono vem do default auth.uid()). */
export async function insertStamp(
  client: SupabaseClient,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; error: { code?: string; message: string } | null }> {
  const id = crypto.randomUUID();
  const { error } = await client.from('stamps').insert({
    id,
    place_id: SEED_ACTIVE_PLACE_ID,
    number: 1,
    stamped_at: new Date().toISOString(),
    ...overrides,
  });
  return { id, error };
}
