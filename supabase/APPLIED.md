# Registro de aplicação dos scripts do Supabase

Quais scripts de `supabase/` já foram aplicados em cada projeto, e quando. O loop preenche esta tabela quando o usuário confirma no chat (ver `docs/SUPABASE_SETUP.md` e `docs/ARCHITECTURE.md`, seção 8.2). Script aplicado não se edita: a mudança vai num script novo.

Legenda: ✅ aplicado e confirmado · ⏳ pendente · — não se aplica.

| Item | `role-dev` | `role-mvp` |
|---|---|---|
| `sql/001_initial_schema.sql` | ✅ 05/10/2026 | ⏳ Fase 13 |
| `sql/002_rls_policies.sql` | ✅ 05/10/2026 | ⏳ Fase 13 |
| `sql/003_quota.sql` | ✅ 05/10/2026 | ⏳ Fase 13 |
| `sql/004_profiles_trigger.sql` | ✅ 05/10/2026 | ⏳ Fase 13 |
| `sql/005_storage_policies.sql` (cria o bucket `place-photos`) | ✅ 05/10/2026 | ⏳ Fase 13 |
| `sql/seed_dev.sql` | ✅ 05/10/2026 | — nunca |
| `functions/delete-my-data` (Edge Function) | ⏳ o `test:db` recebeu 404 (`Requested function was not found`) em 05/10/2026 | ⏳ Fase 13 |
| `checks/001_quota_week_start.sql` | ⏳ resultado ainda não colado no chat | ⏳ Fase 13 |
| Sign-in anônimo ligado | ✅ 05/10/2026 (o `test:db` criou usuários anônimos) | ⏳ Fase 13 |

## Como cada ✅ foi confirmado

- **`sql/001`–`005` e `seed_dev.sql`, sign-in anônimo e bucket:** o usuário avisou no chat que aplicou tudo e o `npm run test:db` de 05/10/2026 passou em 55 testes, que cobrem esquema, RLS, grants, cota (3 por semana, idempotência por `request_id`), carimbos idempotentes, visibilidade de lugares inativos, gatilho do `profiles` e o bloqueio de upload no bucket. A falha restante é só a Edge Function (404).
- Configurações que não são SQL (sign-in anônimo, rate limit, bucket) ficam no checklist de `docs/SUPABASE_SETUP.md`; o `role-mvp` repete tudo na Fase 13.
