-- 001_initial_schema.sql
-- Rolê Aleatório — schema inicial: enums, tabelas, índices e trigger de updated_at.
--
-- Como aplicar: SQL Editor do dashboard (ver docs/SUPABASE_SETUP.md), projeto role-dev
-- e depois role-mvp. Rodar ANTES do 002. Idempotente: pode rodar de novo sem efeito.
-- Script aplicado não se edita; mudanças vão num script novo.
--
-- Este script NÃO liga o RLS nem mexe em grants: isso é o 002_rls_policies.sql.
-- Entre o 001 e o 002 as tabelas ainda estão abertas, então rode os dois em seguida.

-- ---------------------------------------------------------------------------
-- Enums (IDs em inglês, iguais aos do Glossário do plano e às chaves de i18n)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'category') then
    create type public.category as enum (
      'viewpoint', 'used_bookstore', 'short_trail', 'hidden_cafe',
      'street_market', 'small_museum', 'street_cinema', 'garden',
      'open_studio', 'free_show', 'new_square', 'bookstore',
      'neighborhood_bar', 'rooftop', 'library', 'lake'
    );
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'mood') then
    create type public.mood as enum (
      'curious', 'lazy', 'romantic', 'restless', 'chill', 'social'
    );
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'time_slot') then
    create type public.time_slot as enum ('1h', '2h', 'half_day', 'full_day');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'budget') then
    create type public.budget as enum ('free', 'up_to_30', 'up_to_80', 'any');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'report_reason') then
    create type public.report_reason as enum ('closed', 'wrong_info', 'unsafe', 'other');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'feedback_rating') then
    create type public.feedback_rating as enum ('spot_on', 'ok', 'miss');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'feedback_tag') then
    create type public.feedback_tag as enum (
      'calm', 'good_for_talking', 'good_price', 'good_food', 'too_crowded', 'too_far'
    );
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'avoid_tag') then
    create type public.avoid_tag as enum (
      'bar', 'nightclub', 'long_trail', 'crowded', 'mall'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Função do trigger de updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catálogo (escrita só pelo dashboard; leitura para usuários autenticados)
-- ---------------------------------------------------------------------------

create table if not exists public.cities (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  timezone        text not null default 'America/Sao_Paulo',  -- nome IANA
  daylight_cutoff time not null default '18:00',               -- D19: lugares daylight_only somem depois disso
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.places (
  id              uuid primary key default gen_random_uuid(),
  city_id         uuid not null references public.cities (id) on delete restrict,
  category        public.category not null,
  name            text not null,
  address         text not null,
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  price_tier      smallint not null default 0 check (price_tier between 0 and 3),
  typical_spend   numeric(8, 2) not null default 0 check (typical_spend >= 0),  -- "Gasto ~R$24", sempre em BRL (D10)
  duration_min    integer not null check (duration_min > 0),
  moods           public.mood[] not null default '{}',
  avoid_tags      public.avoid_tag[] not null default '{}',  -- pode ser vazio, mas a curadoria revisa
  outdoor         boolean not null default false,
  reservable      boolean not null default false,
  reservation_url text,
  photo_paths     text[] not null default '{}',               -- caminhos no bucket place-photos; o 1º é a capa
  daylight_only   boolean not null default false,
  accessible      boolean not null default false,
  pet_friendly    boolean not null default false,
  active          boolean not null default true,
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint places_reservation_url_requires_reservable
    check (reservation_url is null or reservable)
);

create table if not exists public.place_translations (
  place_id     uuid not null references public.places (id) on delete cascade,
  locale       text not null check (locale in ('pt-BR', 'en', 'es')),
  kind_label   text not null,  -- "Mirante", "Sebo"... já no idioma
  reason_mood  text not null,
  reason_time  text not null,
  reason_money text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (place_id, locale)
);

-- weekday segue o getDay() do JavaScript: 0 = domingo ... 6 = sábado.
-- closes <= opens significa que o horário vira a meia-noite (ex.: 18:00 → 02:00).
-- Um lugar pode ter mais de uma faixa no mesmo dia (almoço e jantar).
create table if not exists public.place_hours (
  id       bigint generated always as identity primary key,
  place_id uuid not null references public.places (id) on delete cascade,
  weekday  smallint not null check (weekday between 0 and 6),
  opens    time not null,
  closes   time not null,
  constraint place_hours_not_empty check (opens <> closes),
  constraint place_hours_unique unique (place_id, weekday, opens)
);

-- ---------------------------------------------------------------------------
-- Dados do usuário (todos com user_id → auth.users on delete cascade; ADR 8.5, regra 10)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,  -- = auth.uid()
  locale            text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es')),
  timezone          text not null default 'America/Sao_Paulo',  -- IANA; base da virada de semana da cota
  plan              text not null default 'free' check (plan in ('free', 'plus')),
  accepted_terms_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- stamps.id é gerado no cliente (uuid v4) e é a base da idempotência da fila offline.
-- Sem índice único em (user_id, number) de propósito: ver ADR 9.5. Colisão de numeração
-- (só possível com mais de um aparelho, Fase 15) nunca pode virar carimbo perdido.
-- place_id sem cascade: um lugar que sai do catálogo é desativado (active = false), não apagado.
create table if not exists public.stamps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id   uuid not null references public.places (id) on delete restrict,
  number     integer not null check (number > 0),
  stamped_at timestamptz not null,                -- relógio do aparelho; a ofensiva usa este campo
  mood       public.mood,                         -- nulos: o rolê pode vir direto do Detalhe do lugar, sem filtros
  time_slot  public.time_slot,
  budget     public.budget,
  memory     text check (memory is null or char_length(memory) <= 500),  -- a lembrança; foto fica só no aparelho (D32)
  created_at timestamptz not null default now()   -- relógio do servidor
);

-- Conta da cota: linhas com action 'shown' ou 'other' gastam 1 sugestão (ver 003_quota.sql).
-- Escrita só pelas RPCs; o cliente não insere direto.
create table if not exists public.suggestion_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id   uuid not null references public.places (id) on delete restrict,
  action     text not null check (action in ('shown', 'other', 'go', 'cancel', 'check_in')),
  reason     text check (reason is null or char_length(reason) <= 64),  -- motivo do "Outra" (chip)
  request_id uuid,                                                        -- idempotência de consume_suggestion
  created_at timestamptz not null default now()
);

create table if not exists public.place_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stamp_id   uuid not null references public.stamps (id) on delete cascade,
  rating     public.feedback_rating not null,
  tags       public.feedback_tag[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint place_feedback_one_per_stamp unique (stamp_id)  -- reenvio da fila não duplica
);

create table if not exists public.place_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id   uuid not null references public.places (id) on delete cascade,
  reason     public.report_reason not null,
  note       text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

-- Analytics (Fase 13): só insert. APP_ENV e demais dados vão em props.
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 64),
  props      jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Fake door do Plus (D13): só insert.
create table if not exists public.plus_interest (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_viewed text not null check (char_length(plan_viewed) between 1 and 32),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices (os de user_id também servem às policies do RLS)
-- ---------------------------------------------------------------------------

create index if not exists places_city_active_idx on public.places (city_id) where active;
create index if not exists place_hours_place_idx on public.place_hours (place_id);

-- (user_id, stamped_at): passaporte, ofensiva e meta; (user_id, place_id): "nunca carimbado"
-- e a policy que libera lugares inativos já carimbados (ADR 9.5).
create index if not exists stamps_user_stamped_at_idx on public.stamps (user_id, stamped_at desc);
create index if not exists stamps_user_place_idx on public.stamps (user_id, place_id);
create index if not exists stamps_place_idx on public.stamps (place_id);

create index if not exists suggestion_events_user_created_idx
  on public.suggestion_events (user_id, created_at desc);
create index if not exists suggestion_events_place_idx on public.suggestion_events (place_id);
-- Repetir o mesmo request_id devolve a mesma resposta e não gasta cota (ADR 9.4).
create unique index if not exists suggestion_events_user_request_uidx
  on public.suggestion_events (user_id, request_id) where request_id is not null;

create index if not exists place_feedback_user_idx on public.place_feedback (user_id);
create index if not exists place_reports_user_idx on public.place_reports (user_id);
create index if not exists place_reports_place_idx on public.place_reports (place_id);
create index if not exists events_user_created_idx on public.events (user_id, created_at desc);
create index if not exists plus_interest_user_idx on public.plus_interest (user_id);

-- ---------------------------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------------------------

drop trigger if exists cities_set_updated_at on public.cities;
create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

drop trigger if exists place_translations_set_updated_at on public.place_translations;
create trigger place_translations_set_updated_at
  before update on public.place_translations
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
