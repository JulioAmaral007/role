-- 005_storage_policies.sql
-- Rolê Aleatório — bucket de fotos do catálogo e a política de acesso dele.
--
-- Como aplicar: SQL Editor do dashboard (ver docs/SUPABASE_SETUP.md), depois do 001 ao 004.
-- Idempotente. Script aplicado não se edita; mudanças vão num script novo.
--
-- Decisão (ADR 8.7), conferida na doc atual do Supabase (Storage → Buckets e Access control):
--   - Num bucket PÚBLICO, baixar pela URL pública dispensa policy. A leitura é aberta
--     de propósito: as fotos são do catálogo, não são dado de usuário, e o expo-image as
--     cacheia melhor assim.
--   - Upload, apagar, mover e copiar continuam protegidos pelo RLS de storage.objects, e por
--     padrão o Storage NÃO permite upload sem policy.
--   - Este script, por isso, NÃO cria nenhuma policy de escrita para `authenticated` nem para
--     `anon`: o aplicativo nunca sobe foto no MVP (as fotos do usuário ficam só no aparelho,
--     D32). Só quem tem acesso ao dashboard (ou a service role) sobe as fotos do catálogo.
--   - Também não cria policy de listagem: o app monta a URL pública a partir de
--     places.photo_paths e nunca lista o bucket.
--
-- Se um dia o app precisar enviar fotos (conta, Fase 15), a policy entra num script NOVO,
-- restrita a uma pasta por usuário e a `authenticated`, e com este arquivo como ponto de partida.

-- O bucket é criado por aqui para ficar versionado (o mesmo resultado de criá-lo pela tela
-- Storage → New bucket → Public bucket). Se ele já existir, só garante que continua público.
insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do update set public = true;
