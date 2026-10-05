-- supabase/checks/001_quota_week_start.sql
-- Checagem da virada de semana da cota (003_quota.sql): quota_week_start, quota_week_end e
-- free_weekly_quota. Serve para o que o `npm run test:db` não alcança de fora (as funções
-- auxiliares não são chamáveis pelo cliente).
--
-- Como rodar: SQL Editor do dashboard, DEPOIS do 003. Só lê, não grava nada. Cole o arquivo
-- inteiro e rode: o resultado é uma tabela `test, ok`, e TODOS os `ok` precisam ser `true`
-- (a última linha, RESUMO, resume tudo). Se algum vier `false`, cole a tabela no chat.
--
-- Referências de calendário (2026): 28/09 e 05/10 são segundas-feiras; 04/10 é domingo.
-- Horário de verão dos EUA em 2026: começa no domingo 08/03 e termina no domingo 01/11, o que
-- dá semanas de 167 h e 169 h. O Brasil não tem mais horário de verão, então America/New_York
-- é o fuso que prova que a virada respeita o relógio local e não soma 7 × 24 h.

with r (n, test, ok) as (
  values
    -- ---- Virada de semana em America/Sao_Paulo (UTC-3) ----
    (1, 'domingo 23:59 ainda é a semana anterior (começa na segunda 28/09)',
      coalesce(public.quota_week_start('2026-10-04 23:59:00-03', 'America/Sao_Paulo')
               = '2026-09-28 00:00:00-03'::timestamptz, false)),
    (2, 'segunda 00:00 exata abre a semana nova (05/10)',
      coalesce(public.quota_week_start('2026-10-05 00:00:00-03', 'America/Sao_Paulo')
               = '2026-10-05 00:00:00-03'::timestamptz, false)),
    (3, 'segunda 00:00:01 também é a semana nova',
      coalesce(public.quota_week_start('2026-10-05 00:00:01-03', 'America/Sao_Paulo')
               = '2026-10-05 00:00:00-03'::timestamptz, false)),
    (4, 'quarta no meio da semana começa na segunda 05/10',
      coalesce(public.quota_week_start('2026-10-07 15:30:00-03', 'America/Sao_Paulo')
               = '2026-10-05 00:00:00-03'::timestamptz, false)),
    (5, 'o fim da semana é a segunda seguinte 00:00 (12/10)',
      coalesce(public.quota_week_end('2026-10-07 15:30:00-03', 'America/Sao_Paulo')
               = '2026-10-12 00:00:00-03'::timestamptz, false)),
    (6, 'o fim é exclusivo: a segunda 12/10 00:00 já abre a semana seguinte',
      coalesce(public.quota_week_start('2026-10-12 00:00:00-03', 'America/Sao_Paulo')
               = '2026-10-12 00:00:00-03'::timestamptz, false)),
    (7, 'domingo 23:59:59 tem como fim a segunda 00:00 seguinte (05/10)',
      coalesce(public.quota_week_end('2026-10-04 23:59:59-03', 'America/Sao_Paulo')
               = '2026-10-05 00:00:00-03'::timestamptz, false)),
    (8, 'a semana em São Paulo tem exatamente 7 dias',
      coalesce(public.quota_week_end('2026-10-07 12:00:00-03', 'America/Sao_Paulo')
               - public.quota_week_start('2026-10-07 12:00:00-03', 'America/Sao_Paulo')
               = interval '7 days', false)),

    -- ---- Fusos diferentes para o MESMO instante (domingo 23:00 em SP, segunda 02:00 em UTC) ----
    (9, 'o mesmo instante cai na semana anterior para quem está em São Paulo',
      coalesce(public.quota_week_start('2026-10-05 02:00:00+00', 'America/Sao_Paulo')
               = '2026-09-28 00:00:00-03'::timestamptz, false)),
    (10, 'e na semana nova para quem está em UTC',
      coalesce(public.quota_week_start('2026-10-05 02:00:00+00', 'UTC')
               = '2026-10-05 00:00:00+00'::timestamptz, false)),
    (11, 'Tóquio (UTC+9): segunda 11:00 começa a semana na segunda 00:00 local',
      coalesce(public.quota_week_start('2026-10-05 11:00:00+09', 'Asia/Tokyo')
               = '2026-10-05 00:00:00+09'::timestamptz, false)),

    -- ---- Horário de verão (America/New_York): a virada segue a hora local ----
    (12, 'fim do horário de verão: a semana de 26/10 termina na segunda 02/11 00:00 EST (-05)',
      coalesce(public.quota_week_end('2026-10-28 12:00:00-04', 'America/New_York')
               = '2026-11-02 00:00:00-05'::timestamptz, false)),
    (13, 'fim do horário de verão: essa semana tem 169 horas, não 168',
      coalesce(public.quota_week_end('2026-10-28 12:00:00-04', 'America/New_York')
               - public.quota_week_start('2026-10-28 12:00:00-04', 'America/New_York')
               = interval '169 hours', false)),
    (14, 'fim do horário de verão: terça 03/11 começa a semana na segunda 02/11 00:00 EST',
      coalesce(public.quota_week_start('2026-11-03 12:00:00-05', 'America/New_York')
               = '2026-11-02 00:00:00-05'::timestamptz, false)),
    (15, 'início do horário de verão: a semana de 02/03 termina na segunda 09/03 00:00 EDT (-04)',
      coalesce(public.quota_week_end('2026-03-04 12:00:00-05', 'America/New_York')
               = '2026-03-09 00:00:00-04'::timestamptz, false)),
    (16, 'início do horário de verão: essa semana tem 167 horas',
      coalesce(public.quota_week_end('2026-03-04 12:00:00-05', 'America/New_York')
               - public.quota_week_start('2026-03-04 12:00:00-05', 'America/New_York')
               = interval '167 hours', false)),
    (17, 'o fim de uma semana é o começo da próxima (atravessando o horário de verão)',
      coalesce(public.quota_week_end('2026-10-28 12:00:00-04', 'America/New_York')
               = public.quota_week_start('2026-11-03 12:00:00-05', 'America/New_York'), false)),

    -- ---- Fuso inválido ou ausente cai em America/Sao_Paulo ----
    (18, 'fuso inexistente usa America/Sao_Paulo (início)',
      coalesce(public.quota_week_start('2026-10-04 23:59:00-03', 'Nao/Existe')
               = '2026-09-28 00:00:00-03'::timestamptz, false)),
    (19, 'fuso inexistente usa America/Sao_Paulo (fim)',
      coalesce(public.quota_week_end('2026-10-07 15:30:00-03', 'Nao/Existe')
               = '2026-10-12 00:00:00-03'::timestamptz, false)),
    (20, 'fuso nulo usa America/Sao_Paulo (início)',
      coalesce(public.quota_week_start('2026-10-04 23:59:00-03', null)
               = '2026-09-28 00:00:00-03'::timestamptz, false)),
    (21, 'fuso nulo usa America/Sao_Paulo (fim)',
      coalesce(public.quota_week_end('2026-10-07 15:30:00-03', null)
               = '2026-10-12 00:00:00-03'::timestamptz, false)),

    -- ---- Constante da cota grátis ----
    (22, 'a cota grátis é de 3 sugestões por semana',
      coalesce(public.free_weekly_quota() = 3, false))
)
select test, ok
from (
  select n, test, ok from r
  union all
  select 999, 'RESUMO: todos os testes acima são true', bool_and(ok) from r
) as result
order by n;
