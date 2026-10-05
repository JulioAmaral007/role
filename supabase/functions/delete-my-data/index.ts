// Edge Function `delete-my-data` — apaga o usuário que chamou e, em cascata, todos os dados dele.
//
// Código versionado aqui; o editor de Edge Functions do dashboard não tem versionamento, então
// o usuário COLA este arquivo lá (ver docs/SUPABASE_SETUP.md, seção 6). Cada mudança é um novo
// handoff. Este arquivo roda no Deno do Supabase, não no app: fica fora do tsc e do eslint.
//
// Como funciona (ADR 8.8):
//   1. lê o JWT do cabeçalho Authorization e pergunta ao Auth quem é (getUser(token));
//   2. chama auth.admin.deleteUser(id) com a secret key, que só existe aqui dentro;
//   3. todas as tabelas de usuário têm `user_id ... on delete cascade` (001), então o Postgres
//      apaga carimbos, avaliações, relatos, eventos etc. junto.
//
// A secret key NUNCA aparece no código: ela vem de variáveis de ambiente que o próprio Supabase
// injeta (doc "Environment Variables" de Edge Functions): `SUPABASE_SECRET_KEYS` (JSON, chave
// "default") e, na forma legada, `SUPABASE_SERVICE_ROLE_KEY`.
//
// O usuário só consegue apagar a si mesmo: o id vem do token validado, nunca do corpo da chamada.
// Como a função valida o token por conta própria, ela funciona com `verify_jwt` ligado (padrão)
// ou desligado.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Prefere a secret key nova (sb_secret_...); cai na service_role legada, que será descontinuada.
function readSecretKey(): string | null {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, unknown>;
      if (typeof keys.default === 'string' && keys.default.length > 0) {
        return keys.default;
      }
    } catch {
      // formato inesperado: tenta a variável legada
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return json({ error: 'unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const secretKey = readSecretKey();
  if (!url || !secretKey) {
    console.error('delete-my-data: SUPABASE_URL ou a secret key não estão disponíveis');
    return json({ error: 'server_misconfigured' }, 500);
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Quem é o dono do token? Se não for um usuário válido, nada é apagado.
  const { data, error: userError } = await admin.auth.getUser(token);
  if (userError || !data.user) {
    return json({ error: 'unauthorized' }, 401);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    // Não registra o token nem dados do usuário; só o motivo.
    console.error('delete-my-data: falha ao apagar o usuário:', deleteError.message);
    return json({ error: 'delete_failed' }, 500);
  }

  return json({ ok: true }, 200);
});
