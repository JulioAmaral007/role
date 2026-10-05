-- 003_quota.sql
-- Rolê Aleatório — cota semanal de sugestões, contada no servidor (D12, ADR 8.6 e 9.4).
--
-- Como aplicar: SQL Editor do dashboard (ver docs/SUPABASE_SETUP.md), depois do 001 e do 002.
-- Idempotente (create or replace). Script aplicado não se edita; mudanças vão num script novo.
--
-- Regras:
--   - Cota grátis: 3 sugestões por semana; a semana vira na SEGUNDA 00:00 no fuso do usuário
--     (profiles.timezone). Plus não tem limite.
--   - Gastam cota as linhas de suggestion_events com action 'shown' (primeira sugestão) e
--     'other' (botão "Outra"). Ver a primeira sugestão já gasta 1.
--   - O que não gasta cota (go, cancel, check_in) NÃO passa por aqui: vai para a tabela `events`
--     (analytics, Fase 13). suggestion_events existe só para a cota.
--   - "Nada bateu" não chama nada deste script: o app roda a recomendação ANTES de consumir.
--   - consume_suggestion é idempotente por request_id (ADR 9.4): repetir o mesmo request_id
--     devolve a mesma resposta e não gasta a cota de novo.
--   - Fuso inválido em profiles.timezone cai em America/Sao_Paulo.

-- ---------------------------------------------------------------------------
-- Constante: tamanho da cota grátis (espelha FREE_WEEKLY_QUOTA do app)
-- ---------------------------------------------------------------------------

create or replace function public.free_weekly_quota()
returns integer
language sql
immutable
set search_path = ''
as $$ select 3 $$;

-- ---------------------------------------------------------------------------
-- Semana da cota: segunda 00:00 no fuso (início) e a segunda seguinte (fim, exclusivo).
-- A conta é feita na hora local e depois convertida, então a virada respeita o horário de
-- verão em vez de somar 7 × 24 h.
-- ---------------------------------------------------------------------------

create or replace function public.quota_week_start(ts timestamptz, tz text)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
begin
  return date_trunc('week', ts at time zone coalesce(tz, 'America/Sao_Paulo'))
         at time zone coalesce(tz, 'America/Sao_Paulo');
exception
  when invalid_parameter_value then
    return date_trunc('week', ts at time zone 'America/Sao_Paulo')
           at time zone 'America/Sao_Paulo';
end;
$$;

create or replace function public.quota_week_end(ts timestamptz, tz text)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
begin
  return (date_trunc('week', ts at time zone coalesce(tz, 'America/Sao_Paulo')) + interval '7 days')
         at time zone coalesce(tz, 'America/Sao_Paulo');
exception
  when invalid_parameter_value then
    return (date_trunc('week', ts at time zone 'America/Sao_Paulo') + interval '7 days')
           at time zone 'America/Sao_Paulo';
end;
$$;

-- ---------------------------------------------------------------------------
-- quota_status(): quanto resta e quando renova, sem consumir.
--   remaining = null para Plus (sem limite). allowed = pode pedir mais uma sugestão agora.
-- ---------------------------------------------------------------------------

create or replace function public.quota_status()
returns table (allowed boolean, remaining integer, resets_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_plan  text := 'free';
  v_tz    text := 'America/Sao_Paulo';
  v_start timestamptz;
  v_end   timestamptz;
  v_used  integer;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select p.plan, p.timezone into v_plan, v_tz
  from public.profiles p
  where p.id = v_user;

  v_plan  := coalesce(v_plan, 'free');
  v_start := public.quota_week_start(now(), v_tz);
  v_end   := public.quota_week_end(now(), v_tz);

  if v_plan = 'plus' then
    return query select true, null::integer, v_end;
    return;
  end if;

  select count(*)::integer into v_used
  from public.suggestion_events e
  where e.user_id = v_user
    and e.action in ('shown', 'other')
    and e.created_at >= v_start
    and e.created_at < v_end;

  return query select
    v_used < public.free_weekly_quota(),
    greatest(public.free_weekly_quota() - v_used, 0),
    v_end;
end;
$$;

-- ---------------------------------------------------------------------------
-- consume_suggestion(place_id, request_id, action): gasta 1 sugestão, se houver cota.
--   p_action: 'shown' (padrão, primeira sugestão) ou 'other' (botão "Outra").
--   p_request_id: uuid gerado pelo cliente por tentativa lógica (reenvio não cobra de novo).
--   Retorna allowed / remaining (null para Plus) / resets_at. Sem cota: allowed = false e
--   NADA é gravado.
-- ---------------------------------------------------------------------------

create or replace function public.consume_suggestion(
  p_place_id   uuid,
  p_request_id uuid,
  p_action     text default 'shown'
)
returns table (allowed boolean, remaining integer, resets_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_plan     text := 'free';
  v_tz       text := 'America/Sao_Paulo';
  v_start    timestamptz;
  v_end      timestamptz;
  v_used     integer;
  v_prev_at  timestamptz;
  v_prev_id  uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_action is null or p_action not in ('shown', 'other') then
    raise exception 'invalid action: %', p_action using errcode = '22023';
  end if;

  -- Serializa as chamadas do mesmo usuário: sem isso, dois pedidos simultâneos poderiam
  -- passar juntos pela checagem da cota.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select p.plan, p.timezone into v_plan, v_tz
  from public.profiles p
  where p.id = v_user;

  v_plan := coalesce(v_plan, 'free');

  -- Reenvio do mesmo request_id: devolve a resposta que o primeiro envio teve (a contagem
  -- vai até a linha original, ignorando o que foi gasto depois) e não grava nada.
  if p_request_id is not null then
    select e.created_at, e.id into v_prev_at, v_prev_id
    from public.suggestion_events e
    where e.user_id = v_user
      and e.request_id = p_request_id;

    if found then
      v_start := public.quota_week_start(v_prev_at, v_tz);
      v_end   := public.quota_week_end(v_prev_at, v_tz);

      if v_plan = 'plus' then
        return query select true, null::integer, v_end;
        return;
      end if;

      select count(*)::integer into v_used
      from public.suggestion_events e
      where e.user_id = v_user
        and e.action in ('shown', 'other')
        and e.created_at >= v_start
        and e.created_at < v_end
        and (e.created_at < v_prev_at or (e.created_at = v_prev_at and e.id <= v_prev_id));

      return query select true, greatest(public.free_weekly_quota() - v_used, 0), v_end;
      return;
    end if;
  end if;

  v_start := public.quota_week_start(now(), v_tz);
  v_end   := public.quota_week_end(now(), v_tz);

  if v_plan = 'plus' then
    insert into public.suggestion_events (user_id, place_id, action, request_id)
    values (v_user, p_place_id, p_action, p_request_id);
    return query select true, null::integer, v_end;
    return;
  end if;

  select count(*)::integer into v_used
  from public.suggestion_events e
  where e.user_id = v_user
    and e.action in ('shown', 'other')
    and e.created_at >= v_start
    and e.created_at < v_end;

  if v_used >= public.free_weekly_quota() then
    return query select false, 0, v_end;
    return;
  end if;

  insert into public.suggestion_events (user_id, place_id, action, request_id)
  values (v_user, p_place_id, p_action, p_request_id);

  return query select true, public.free_weekly_quota() - v_used - 1, v_end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissões (ADR 8.5, regra 6): só `authenticated` chama as RPCs; as funções auxiliares
-- ficam internas (usadas por dentro das RPCs, que são security definer).
-- ---------------------------------------------------------------------------

revoke execute on function public.free_weekly_quota() from public, anon, authenticated;
revoke execute on function public.quota_week_start(timestamptz, text) from public, anon, authenticated;
revoke execute on function public.quota_week_end(timestamptz, text) from public, anon, authenticated;

revoke execute on function public.quota_status() from public, anon;
grant execute on function public.quota_status() to authenticated;

revoke execute on function public.consume_suggestion(uuid, uuid, text) from public, anon;
grant execute on function public.consume_suggestion(uuid, uuid, text) to authenticated;
