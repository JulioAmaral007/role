# Supabase — passo a passo no dashboard

> Tudo no Supabase é feito **pelo dashboard web** (https://supabase.com/dashboard). Sem CLI, sem Docker, sem Supabase local (ver `docs/ARCHITECTURE.md`, seção 8). O loop escreve os arquivos; **você** aplica aqui e avisa no chat.
>
> Conferido na doc oficial em 05/10/2026. Onde a doc não detalha o nome exato de um botão, o passo traz a marca **(confira na tela)**: o nome pode variar um pouco, mas o caminho é o mesmo.
>
> O mesmo checklist vale para os **dois projetos**: `role-dev` (agora, Fase 4) e `role-mvp` (Fase 13). As configurações que não são SQL são **por projeto**, então repita tudo no segundo.

## Regras de segurança (leia antes)

- 🔑 Para o app só importam duas coisas: a **URL do projeto** e a **publishable key** (`sb_publishable_...`). Ambas são públicas por natureza e vão no `.env`.
- 🚫 A **secret key** (`sb_secret_...`) e a **`service_role`** (legada) **nunca** vão para o `.env`, para o repositório, para o app nem para o chat. A Edge Function a recebe sozinha, injetada pelo próprio Supabase.
- 🚫 Não cole a **senha do banco** em lugar nenhum além do seu gerenciador de senhas.
- Se uma secret key vazar: gere uma nova em **Settings → API Keys**, revogue a antiga **antes** de qualquer outra ação. Apagar o arquivo no git não basta.

## 1. Criar o projeto

1. Entre em https://supabase.com/dashboard e escolha (ou crie) uma organização.
2. **New project** (https://supabase.com/dashboard/new/_).
3. Nome: `role-dev` (depois, repetindo, `role-mvp`).
4. Região: **South America (São Paulo)** (confira na tela o nome exato). Os testadores estão no Brasil, então a latência cai.
5. Defina uma senha forte para o banco e **guarde no gerenciador de senhas**. Não é usada pelo app nem pelo loop.
6. Crie e espere o projeto ficar pronto.

**Limites do plano gratuito (doc "Going into prod"):**

- Projetos com **pouca atividade em 7 dias podem ser pausados**. Se `role-dev` ficar parado uma semana, abra o dashboard e restaure o projeto antes de rodar o `npm run test:db`.
- **Não há backup baixável** no plano gratuito. O `role-dev` pode ser apagado à vontade; no `role-mvp` isso importa (decisão para a Fase 13).
- Cota de usuários ativos, tamanho do banco e do Storage: **confira em https://supabase.com/pricing** ao criar cada projeto. A doc consultada não os detalha.

## 2. Copiar a URL e a publishable key para o `.env`

1. No projeto, clique em **Connect** (botão no topo do dashboard) e escolha o framework **Expo React Native**. O painel mostra a URL e a publishable key prontas para colar. Caminho alternativo: **Settings → API Keys**.
2. Na raiz do repositório, copie o `.env.example` para `.env` e preencha:

   ```
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. Use **só** a chave que começa com `sb_publishable_`. Se o painel mostrar a `anon` (legada), ignore: ela está sendo descontinuada até o fim de 2026.
4. O `.env` já está no `.gitignore`. Mudou o `.env`? Recarregue o app por completo (o valor é inlinado no bundle).

## 3. Rodar scripts SQL (SQL Editor)

1. Menu lateral → **SQL Editor**.
2. Crie uma query nova, cole **o arquivo inteiro** de `supabase/sql/` e execute (botão **Run**).
3. Aplique **em ordem**: `001` → `002` → `003` → `004` → `005`, e só então `seed_dev.sql` (**apenas no `role-dev`**).
4. Se aparecer erro, **não edite o script aplicado**: copie a mensagem para o chat. A correção vai num script novo.
5. Se o editor perguntar sobre RLS ou sobre "query destrutiva", leia a mensagem. Os scripts do repositório são idempotentes e já ligam o RLS.
6. As checagens (`supabase/checks/*.sql`) rodam do mesmo jeito. Cada linha devolve `test, ok`, e **todos os `ok` precisam ser `true`**. Cole o resultado no chat.

## 4. Sign-in anônimo e proteção contra abuso

1. Menu lateral → **Authentication** → **Sign In / Providers** (a doc aponta para https://supabase.com/dashboard/project/_/auth/providers).
2. Ative **Allow anonymous sign-ins** (confira na tela o nome do botão) e salve.
3. O limite padrão é **30 criações anônimas por hora por IP**. Mantenha no MVP. Se o grupo de teste usar a mesma rede e alguém for barrado, suba o valor em **Authentication → Rate Limits**.
4. **Captcha:** a doc recomenda (Turnstile ou captcha invisível), mas exige WebView no app. Fica **desligado no MVP** (risco aceito, ADR 8.10) e entra no pós-MVP.
5. O `npm run test:db` cria 2 usuários anônimos por execução. Com o limite de 30 por hora, são ~15 execuções por hora no mesmo IP.

## 5. Bucket de fotos `place-photos`

1. Menu lateral → **Storage** → **New bucket**.
2. Nome exato: `place-photos`.
3. Marque como **Public bucket** (confira na tela o nome da opção).
4. **Create bucket**.
5. Bucket público dispensa policy de **leitura**; upload, apagar e mover continuam protegidos. O `005_storage_policies.sql` não cria policy de escrita, então só você sobe fotos, pelo dashboard.

## 6. Edge Function `delete-my-data`

O editor do dashboard **não tem versionamento** (a doc avisa). O repositório é a fonte de verdade: o código fica em `supabase/functions/delete-my-data/index.ts` e você cola lá. Cada mudança no arquivo é um novo handoff.

1. Menu lateral → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Escolha começar do zero (ou "Hello World") e dê o nome exato **`delete-my-data`** (o nome vira a URL).
3. Apague o conteúdo do editor e cole o arquivo `supabase/functions/delete-my-data/index.ts`.
4. **Deploy function**.
5. **Verify JWT:** a doc diz que o padrão é ligado (`verify_jwt = true`). **Deixe ligado**: a função só aceita quem está logado. (Onde fica a opção no dashboard: confira na tela, nas configurações da função.)
6. **Variáveis de ambiente:** a função já recebe do Supabase `SUPABASE_URL`, `SUPABASE_SECRET_KEYS` (JSON com as secret keys) e, na versão legada, `SUPABASE_SERVICE_ROLE_KEY`. **Você não cria nem cola nada.** Segredos customizados, quando existirem (Fase 14), ficam em **Edge Function Secrets** (nomes não podem começar com `SUPABASE_`).
7. Teste pelo botão **Test** da própria tela só com o usuário de teste, nunca com a sua conta.

## 7. Tipos TypeScript (opcional)

A doc afirma que dá para baixar os tipos pelo dashboard, sem CLI, na tela **API** do projeto (https://supabase.com/dashboard/project/_/api, seção de tabelas; confira na tela). Se aparecer, baixe o `.ts` e salve em `src/types/database.ts`, avisando no chat para o loop commitar. Se não aparecer, tudo bem: o loop mantém o arquivo à mão e o `test:db` pega divergências.

## 8. O que avisar no chat quando terminar

- Os scripts rodaram sem erro (ou a mensagem de erro, copiada).
- O resultado de `supabase/checks/001_quota_week_start.sql` (todos `ok = true`?).
- Que o `.env` está preenchido (**sem colar as chaves**).
- Qualquer coisa que você tenha mudado direto na UI (Table Editor, ajustes de Auth). O loop transcreve para um script ou para este arquivo, para o repositório continuar refletindo o banco.

## Checklist por projeto

| Item | `role-dev` | `role-mvp` |
|---|---|---|
| Projeto criado (São Paulo) | ☐ | ☐ |
| `.env` ou variáveis do EAS preenchidas | ☐ | ☐ |
| Scripts `001`–`005` aplicados | ☐ | ☐ |
| `seed_dev.sql` aplicado | ☐ | ✖ (nunca) |
| Sign-in anônimo ligado | ☐ | ☐ |
| Rate limit conferido | ☐ | ☐ |
| Bucket `place-photos` público | ☐ | ☐ |
| Edge Function `delete-my-data` publicada | ☐ | ☐ |
| Checagens SQL todas `ok = true` | ☐ | ☐ |

O registro de **qual script foi aplicado onde e quando** fica em `supabase/APPLIED.md`.
