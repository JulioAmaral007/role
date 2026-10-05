import { createClient } from '@supabase/supabase-js';

import { idEnvName, readDbTestEnv, tokenEnvName, type TestUserLabel } from './helpers';

// No máximo 2 usuários anônimos por execução (A e B): o Supabase limita a criação de anônimos
// a 30 por hora por IP (ADR 8.3 e 11.5). Os dois valem para todos os arquivos de teste e são
// apagados no globalTeardown pela Edge Function `delete-my-data`.
async function createAnonymousUser(label: TestUserLabel): Promise<void> {
  const { url, key } = readDbTestEnv();
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session || !data.user) {
    throw new Error(
      `test:db: não foi possível criar o usuário anônimo ${label}: ${error?.message ?? 'sem sessão'}. ` +
        'Confira se o sign-in anônimo está ligado (Authentication → Sign In / Providers) e se você ' +
        'não passou do limite de 30 anônimos por hora por IP (Authentication → Rate Limits).',
    );
  }
  process.env[idEnvName(label)] = data.user.id;
  process.env[tokenEnvName(label)] = data.session.access_token;
}

export default async function globalSetup(): Promise<void> {
  readDbTestEnv(); // aborta cedo se o ambiente não for development
  await createAnonymousUser('A');
  await createAnonymousUser('B');
}
