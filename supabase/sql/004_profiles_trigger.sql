-- 004_profiles_trigger.sql
-- Rolê Aleatório — cria o `profiles` automaticamente quando nasce um usuário em auth.users,
-- inclusive o anônimo (signInAnonymously dispara o mesmo insert).
--
-- Como aplicar: SQL Editor do dashboard (ver docs/SUPABASE_SETUP.md), depois do 001 ao 003.
-- Idempotente. Script aplicado não se edita; mudanças vão num script novo.
--
-- Padrão da doc do Supabase (Managing user data): função `security definer` com
-- `set search_path = ''` e trigger `after insert on auth.users`.
-- ATENÇÃO (a doc avisa): se este trigger falhar, o cadastro do usuário falha junto. Por isso ele
-- só insere com os defaults da tabela (nenhuma conta que possa dar erro) e ignora duplicado.
--
-- O perfil nasce com plan = 'free', locale = 'pt-BR' e timezone = 'America/Sao_Paulo'. O app
-- grava o locale e o fuso reais do aparelho logo depois do login (update permitido no 002).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- O trigger roda com o dono da função; ninguém precisa de EXECUTE (ADR 8.5, regra 6).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuários que já existiam antes do trigger (ex.: criados em testes) também ganham perfil.
insert into public.profiles (id)
select u.id
from auth.users u
on conflict (id) do nothing;
