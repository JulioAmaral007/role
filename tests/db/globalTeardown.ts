import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

import { readDbTestEnv, tokenEnvName, type TestUserLabel } from './helpers';

// Apaga os usuários de teste (e, em cascata, tudo que eles criaram) pela Edge Function.
// O B já pode ter sido apagado pelo deleteMyData.test.ts: o 401 desse caso é esperado.
async function deleteUser(label: TestUserLabel): Promise<void> {
  const token = process.env[tokenEnvName(label)];
  if (!token) return;
  const { url, key } = readDbTestEnv();
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.functions.invoke('delete-my-data', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!error) return;
  if (error instanceof FunctionsHttpError && error.context.status === 401) return;
  console.warn(
    `test:db: não consegui apagar o usuário de teste ${label} (${error.message}). ` +
      'Ele é anônimo e sem dados pessoais; pode ser apagado depois em Authentication → Users.',
  );
}

export default async function globalTeardown(): Promise<void> {
  await deleteUser('A');
  await deleteUser('B');
}
