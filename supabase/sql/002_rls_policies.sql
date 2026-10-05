-- 002_rls_policies.sql
-- Rolê Aleatório — RLS em todas as tabelas, grants mínimos e policies.
--
-- Como aplicar: SQL Editor do dashboard (ver docs/SUPABASE_SETUP.md), logo DEPOIS do 001.
-- Idempotente: pode rodar de novo sem efeito. Script aplicado não se edita.
--
-- Modelo (ADR 8.5): o Postgres confere primeiro o GRANT (o role pode tocar na tabela?) e depois
-- a POLICY (em quais linhas?). Por isso: revoke de tudo para anon/authenticated e grant só do
-- necessário. O role `anon` (sem login) não recebe NADA: o app sempre faz signInAnonymously
-- antes de consultar, e o usuário anônimo cai no role `authenticated`.
--
-- Escritas que o cliente NÃO faz (só por RPC ou pelo dashboard):
--   - cities, places, place_translations, place_hours: catálogo, escrito pelo dashboard;
--   - profiles: criado pelo trigger do 004; `plan` nunca é gravável pelo cliente;
--   - suggestion_events: só as RPCs do 003 inserem (a cota não pode ser burlada).
--
-- Os inserts do app devem usar `Prefer: return=minimal` (padrão do supabase-js sem `.select()`),
-- porque place_reports, events e plus_interest não têm leitura para o cliente.

-- ---------------------------------------------------------------------------
-- 1. Nada novo no schema public é exposto sem grant explícito
-- ---------------------------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. RLS ligado em TODAS as tabelas
-- ---------------------------------------------------------------------------

alter table public.cities             enable row level security;
alter table public.places             enable row level security;
alter table public.place_translations enable row level security;
alter table public.place_hours        enable row level security;
alter table public.profiles           enable row level security;
alter table public.stamps             enable row level security;
alter table public.suggestion_events  enable row level security;
alter table public.place_feedback     enable row level security;
alter table public.place_reports      enable row level security;
alter table public.events             enable row level security;
alter table public.plus_interest      enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Grants: tira tudo e devolve só o mínimo
-- ---------------------------------------------------------------------------

revoke all on table
  public.cities, public.places, public.place_translations, public.place_hours,
  public.profiles, public.stamps, public.suggestion_events, public.place_feedback,
  public.place_reports, public.events, public.plus_interest
from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

-- A função do trigger de updated_at não precisa de EXECUTE para quem dispara o trigger.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Catálogo: só leitura.
grant select on table
  public.cities, public.places, public.place_translations, public.place_hours
to authenticated;

-- Perfil: leitura, e update SÓ destas colunas (nunca `plan`). `accepted_terms_at` entra além
-- de locale/timezone porque a Boas-vindas grava o aceite dos Termos (Fase 7); não é sensível.
grant select on table public.profiles to authenticated;
grant update (locale, timezone, accepted_terms_at) on table public.profiles to authenticated;

-- Carimbos: ler e inserir. Sem update/delete (carimbo só é criado; apagar é pelo delete-my-data).
grant select, insert on table public.stamps to authenticated;

-- Eventos de sugestão: o cliente só lê os próprios. Quem insere são as RPCs do 003.
grant select on table public.suggestion_events to authenticated;

grant select, insert on table public.place_feedback to authenticated;

-- Só insert (sem leitura pelo cliente).
grant insert on table public.place_reports to authenticated;
grant insert on table public.events to authenticated;
grant insert on table public.plus_interest to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Policies — catálogo
-- ---------------------------------------------------------------------------

drop policy if exists cities_select on public.cities;
create policy cities_select on public.cities
  for select to authenticated
  using (true);

-- Só lugares ativos, MAIS os inativos que o usuário já carimbou (ADR 9.5): sem isso o
-- passaporte perderia o nome de um lugar que saiu do catálogo.
drop policy if exists places_select on public.places;
create policy places_select on public.places
  for select to authenticated
  using (
    active
    or exists (
      select 1
      from public.stamps s
      where s.place_id = places.id
        and s.user_id = (select auth.uid())
    )
  );

-- Traduções e horários seguem a visibilidade do lugar (o subselect passa pela policy de places).
drop policy if exists place_translations_select on public.place_translations;
create policy place_translations_select on public.place_translations
  for select to authenticated
  using (exists (select 1 from public.places p where p.id = place_translations.place_id));

drop policy if exists place_hours_select on public.place_hours;
create policy place_hours_select on public.place_hours
  for select to authenticated
  using (exists (select 1 from public.places p where p.id = place_hours.place_id));

-- ---------------------------------------------------------------------------
-- 5. Policies — dados do usuário (sempre `to authenticated` e (select auth.uid()))
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists stamps_select_own on public.stamps;
create policy stamps_select_own on public.stamps
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- O cliente nunca escolhe o dono. O reenvio da fila usa `on conflict (id) do nothing`.
drop policy if exists stamps_insert_own on public.stamps;
create policy stamps_insert_own on public.stamps
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists suggestion_events_select_own on public.suggestion_events;
create policy suggestion_events_select_own on public.suggestion_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists place_feedback_select_own on public.place_feedback;
create policy place_feedback_select_own on public.place_feedback
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- A avaliação só pode apontar para um carimbo do próprio usuário (o subselect passa pelo RLS
-- de stamps). Sem isso, quem soubesse o uuid de um carimbo alheio poderia anexar avaliação a ele.
drop policy if exists place_feedback_insert_own on public.place_feedback;
create policy place_feedback_insert_own on public.place_feedback
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.stamps s
      where s.id = place_feedback.stamp_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists place_reports_insert_own on public.place_reports;
create policy place_reports_insert_own on public.place_reports
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists plus_interest_insert_own on public.plus_interest;
create policy plus_interest_insert_own on public.plus_interest
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
