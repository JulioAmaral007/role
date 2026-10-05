-- seed_dev.sql
-- Rolê Aleatório — dados de exemplo para DESENVOLVIMENTO. Uma cidade fictícia e 11 lugares.
--
-- 🚫 SÓ NO PROJETO `role-dev`. NUNCA rode no `role-mvp` nem em produção: os lugares são
--    inventados (a cidade e o catálogo reais entram na Fase 6, com a curadoria).
--
-- Como aplicar: SQL Editor do dashboard (ver docs/SUPABASE_SETUP.md), por último, depois do 001 ao 005.
-- Idempotente: ids fixos e `on conflict do nothing`, então pode rodar de novo sem duplicar.
-- Para refazer do zero: `delete from public.cities where name = 'Cidade de Teste (seed)';`
-- só funciona se nenhum carimbo apontar para os lugares (stamps.place_id é `on delete restrict`).
--
-- O que o seed permite testar:
--   - 10 categorias do bingo, 6 humores, durações de 60 a 150 min, gasto de R$ 0 a R$ 45;
--   - lugares `daylight_only` (somem depois das 18h), ao ar livre, acessíveis e pet friendly;
--   - horários que viram a meia-noite (Cine Rua 7 e Bar do Zé, sextas e sábados) e um lugar
--     fechado às segundas (Museu da Esquina);
--   - um lugar INATIVO (Livraria da Estação): não aparece no catálogo, mas continua visível
--     para quem já o carimbou (regra do 002);
--   - traduções em pt-BR, en e es para todos.
-- As coordenadas ficam em torno de -23.5505, -46.6333 só para dar distâncias plausíveis.
-- `photo_paths` aponta para arquivos que NÃO existem no bucket (o app mostra o placeholder).
--
-- IDs: cidade 00000000-...-0001; lugares 10000000-...-0001 a 0011.

insert into public.cities (id, name, timezone, daylight_cutoff)
values ('00000000-0000-4000-8000-000000000001', 'Cidade de Teste (seed)', 'America/Sao_Paulo', '18:00')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Lugares
-- ---------------------------------------------------------------------------

insert into public.places
  (id, city_id, category, name, address, lat, lng, price_tier, typical_spend, duration_min,
   moods, avoid_tags, outdoor, reservable, reservation_url, photo_paths,
   daylight_only, accessible, pet_friendly, active, verified_at)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
   'viewpoint', 'Mirante do Morro', 'Alto do Morro, s/n', -23.5420, -46.6410, 0, 0, 60,
   '{curious,chill,romantic}', '{}', true, false, null, '{seed/mirante-1.jpg,seed/mirante-2.jpg}',
   true, false, true, true, now()),

  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
   'used_bookstore', 'Sebo Páginas Antigas', 'Rua das Letras, 120', -23.5530, -46.6350, 1, 20, 60,
   '{curious,lazy,chill}', '{}', false, false, null, '{seed/sebo-1.jpg}',
   false, false, false, true, now()),

  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001',
   'short_trail', 'Trilha do Bosque Curto', 'Parque do Bosque, portão 2', -23.5610, -46.6500, 0, 0, 120,
   '{restless,curious}', '{}', true, false, null, '{seed/trilha-1.jpg}',
   true, false, true, true, now()),

  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001',
   'hidden_cafe', 'Café Pátio Escondido', 'Travessa do Pátio, 45', -23.5495, -46.6380, 1, 24, 60,
   '{chill,lazy,romantic,social}', '{}', false, true, 'https://example.com/reserva/cafe-patio', '{seed/cafe-1.jpg,seed/cafe-2.jpg}',
   false, true, false, true, now()),

  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001',
   'street_market', 'Feira da Vila', 'Praça da Vila, centro', -23.5560, -46.6290, 1, 15, 120,
   '{social,curious,restless}', '{crowded}', true, false, null, '{seed/feira-1.jpg}',
   true, false, true, true, now()),

  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001',
   'small_museum', 'Museu da Esquina', 'Rua do Acervo, 8', -23.5470, -46.6330, 1, 12, 120,
   '{curious,chill}', '{}', false, false, null, '{seed/museu-1.jpg}',
   false, true, false, true, now()),

  ('10000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001',
   'street_cinema', 'Cine Rua 7', 'Rua Sete, 77', -23.5580, -46.6420, 2, 28, 150,
   '{romantic,lazy,social}', '{}', false, true, 'https://example.com/reserva/cine-rua-7', '{seed/cine-1.jpg}',
   false, true, false, true, now()),

  ('10000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001',
   'garden', 'Jardim das Palmeiras', 'Av. das Palmeiras, 300', -23.5390, -46.6280, 0, 0, 60,
   '{chill,romantic,lazy}', '{}', true, false, null, '{seed/jardim-1.jpg,seed/jardim-2.jpg}',
   true, true, true, true, now()),

  ('10000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000001',
   'neighborhood_bar', 'Bar do Zé da Esquina', 'Rua da Esquina, 5', -23.5520, -46.6310, 2, 45, 120,
   '{social,restless}', '{bar}', false, false, null, '{seed/bar-1.jpg}',
   false, false, false, true, now()),

  ('10000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001',
   'library', 'Biblioteca Pública Central', 'Praça do Saber, 1', -23.5505, -46.6333, 0, 0, 120,
   '{lazy,chill,curious}', '{}', false, false, null, '{seed/biblioteca-1.jpg}',
   false, true, false, true, now()),

  -- Inativo de propósito: testa a regra "lugar que saiu do catálogo ainda aparece para quem o carimbou".
  ('10000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001',
   'bookstore', 'Livraria da Estação', 'Rua da Estação, 90', -23.5540, -46.6370, 2, 35, 60,
   '{curious,lazy}', '{}', false, false, null, '{seed/livraria-1.jpg}',
   false, false, false, false, now() - interval '200 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Horários (weekday: 0 = domingo ... 6 = sábado; closes <= opens vira a meia-noite)
-- ---------------------------------------------------------------------------

insert into public.place_hours (place_id, weekday, opens, closes)
select h.place_id, d, h.opens::time, h.closes::time
from (values
  -- Mirante do Morro: todos os dias, só de dia
  ('10000000-0000-4000-8000-000000000001'::uuid, array[0,1,2,3,4,5,6], '06:00', '18:00'),
  -- Sebo: segunda a sábado
  ('10000000-0000-4000-8000-000000000002'::uuid, array[1,2,3,4,5,6], '10:00', '19:00'),
  -- Trilha: todos os dias
  ('10000000-0000-4000-8000-000000000003'::uuid, array[0,1,2,3,4,5,6], '07:00', '17:00'),
  -- Café: todos os dias
  ('10000000-0000-4000-8000-000000000004'::uuid, array[0,1,2,3,4,5,6], '08:00', '20:00'),
  -- Feira: só fim de semana
  ('10000000-0000-4000-8000-000000000005'::uuid, array[0,6], '07:00', '14:00'),
  -- Museu: fechado às segundas
  ('10000000-0000-4000-8000-000000000006'::uuid, array[0,2,3,4,5,6], '10:00', '17:00'),
  -- Cine Rua 7: terça a quinta e domingo até 23h; sexta e sábado viram a meia-noite
  ('10000000-0000-4000-8000-000000000007'::uuid, array[0,2,3,4], '16:00', '23:00'),
  ('10000000-0000-4000-8000-000000000007'::uuid, array[5,6], '16:00', '02:00'),
  -- Jardim: todos os dias, só de dia
  ('10000000-0000-4000-8000-000000000008'::uuid, array[0,1,2,3,4,5,6], '06:00', '18:00'),
  -- Bar do Zé: terça a quinta e domingo até 23h; sexta e sábado viram a meia-noite
  ('10000000-0000-4000-8000-000000000009'::uuid, array[0,2,3,4], '17:00', '23:00'),
  ('10000000-0000-4000-8000-000000000009'::uuid, array[5,6], '17:00', '01:00'),
  -- Biblioteca: segunda a sexta e sábado de manhã
  ('10000000-0000-4000-8000-000000000010'::uuid, array[1,2,3,4,5], '08:00', '20:00'),
  ('10000000-0000-4000-8000-000000000010'::uuid, array[6], '09:00', '14:00'),
  -- Livraria da Estação (inativa)
  ('10000000-0000-4000-8000-000000000011'::uuid, array[1,2,3,4,5,6], '09:00', '18:00')
) as h(place_id, weekdays, opens, closes)
cross join lateral unnest(h.weekdays) as d
on conflict (place_id, weekday, opens) do nothing;

-- ---------------------------------------------------------------------------
-- Traduções: pt-BR, en e es (rótulo do tipo + 3 motivos: humor, tempo e dinheiro)
-- ---------------------------------------------------------------------------

insert into public.place_translations
  (place_id, locale, kind_label, reason_mood, reason_time, reason_money)
values
  -- 01 Mirante do Morro
  ('10000000-0000-4000-8000-000000000001', 'pt-BR', 'Mirante',
   'A cidade inteira aos seus pés, ótima para pensar.', 'Cabe numa hora, com tempo de sobra pro pôr do sol.', 'De graça: só o caminho até lá.'),
  ('10000000-0000-4000-8000-000000000001', 'en', 'Viewpoint',
   'The whole city at your feet, great for thinking.', 'Fits in an hour, with time to spare for the sunset.', 'Free: just the walk there.'),
  ('10000000-0000-4000-8000-000000000001', 'es', 'Mirador',
   'Toda la ciudad a tus pies, ideal para pensar.', 'Cabe en una hora, con tiempo para ver el atardecer.', 'Gratis: solo el camino hasta allí.'),

  -- 02 Sebo Páginas Antigas
  ('10000000-0000-4000-8000-000000000002', 'pt-BR', 'Sebo',
   'Pra quem tá curioso: livros que você nem sabia que procurava.', 'Uma hora de garimpo passa voando.', 'Achados a partir de R$ 10.'),
  ('10000000-0000-4000-8000-000000000002', 'en', 'Used bookstore',
   'For the curious: books you did not know you were looking for.', 'An hour of browsing flies by.', 'Finds starting at R$ 10.'),
  ('10000000-0000-4000-8000-000000000002', 'es', 'Librería de segunda mano',
   'Para los curiosos: libros que no sabías que buscabas.', 'Una hora de búsqueda pasa volando.', 'Hallazgos desde R$ 10.'),

  -- 03 Trilha do Bosque Curto
  ('10000000-0000-4000-8000-000000000003', 'pt-BR', 'Trilha curta',
   'Gasta a energia de quem não consegue ficar parado.', 'Dá pra fazer inteira em duas horas, sem pressa.', 'Não custa nada.'),
  ('10000000-0000-4000-8000-000000000003', 'en', 'Short trail',
   'Burns the energy of anyone who cannot sit still.', 'You can do all of it in two hours, no rush.', 'It costs nothing.'),
  ('10000000-0000-4000-8000-000000000003', 'es', 'Sendero corto',
   'Gasta la energía de quien no puede quedarse quieto.', 'Se hace completo en dos horas, sin prisa.', 'No cuesta nada.'),

  -- 04 Café Pátio Escondido
  ('10000000-0000-4000-8000-000000000004', 'pt-BR', 'Café escondido',
   'Um pátio quieto onde a conversa rende ou o silêncio também.', 'Um café e um bolo cabem numa hora boa.', 'Um café com bolo sai por uns R$ 24.'),
  ('10000000-0000-4000-8000-000000000004', 'en', 'Hidden café',
   'A quiet patio where talk flows, or silence does too.', 'A coffee and a slice of cake fit in a good hour.', 'Coffee and cake come to about R$ 24.'),
  ('10000000-0000-4000-8000-000000000004', 'es', 'Café escondido',
   'Un patio tranquilo donde la charla fluye, o el silencio también.', 'Un café y una porción de pastel caben en una buena hora.', 'Café con pastel sale por unos R$ 24.'),

  -- 05 Feira da Vila
  ('10000000-0000-4000-8000-000000000005', 'pt-BR', 'Feira de bairro',
   'Gente, cheiro de pastel e barraca pra todo lado.', 'Duas horas dão pra dar a volta e repetir o pastel.', 'Dá pra se esbaldar com uns R$ 15.'),
  ('10000000-0000-4000-8000-000000000005', 'en', 'Street market',
   'People, the smell of fried pastry and stalls everywhere.', 'Two hours is enough to do a lap and go back for more.', 'You can feast on about R$ 15.'),
  ('10000000-0000-4000-8000-000000000005', 'es', 'Feria de barrio',
   'Gente, olor a pastel frito y puestos por todos lados.', 'Dos horas alcanzan para dar la vuelta y repetir.', 'Se come bien con unos R$ 15.'),

  -- 06 Museu da Esquina
  ('10000000-0000-4000-8000-000000000006', 'pt-BR', 'Museu pequeno',
   'Pequeno o bastante pra não cansar, grande o bastante pra surpreender.', 'Duas horas é o tempo certo pra ver tudo com calma.', 'Ingresso de R$ 12.'),
  ('10000000-0000-4000-8000-000000000006', 'en', 'Small museum',
   'Small enough not to tire you, big enough to surprise you.', 'Two hours is just right to see it all calmly.', 'Tickets are R$ 12.'),
  ('10000000-0000-4000-8000-000000000006', 'es', 'Museo pequeño',
   'Lo bastante pequeño para no cansar, lo bastante grande para sorprender.', 'Dos horas son justas para verlo todo con calma.', 'La entrada cuesta R$ 12.'),

  -- 07 Cine Rua 7
  ('10000000-0000-4000-8000-000000000007', 'pt-BR', 'Cinema de rua',
   'Escuro, poltrona e um filme bom: programa perfeito a dois.', 'Sessão e pipoca cabem em duas horas e meia.', 'Ingresso e pipoca por volta de R$ 28.'),
  ('10000000-0000-4000-8000-000000000007', 'en', 'Street cinema',
   'Dark room, a good seat and a good film: a perfect date.', 'A screening and popcorn fit in two and a half hours.', 'Ticket and popcorn run around R$ 28.'),
  ('10000000-0000-4000-8000-000000000007', 'es', 'Cine de calle',
   'Sala oscura, butaca y buena película: plan perfecto en pareja.', 'Función y palomitas caben en dos horas y media.', 'Entrada y palomitas rondan los R$ 28.'),

  -- 08 Jardim das Palmeiras
  ('10000000-0000-4000-8000-000000000008', 'pt-BR', 'Jardim',
   'Sombra, banco e passarinho: pura calma.', 'Uma hora ali vale por um fim de semana.', 'Entrada franca.'),
  ('10000000-0000-4000-8000-000000000008', 'en', 'Garden',
   'Shade, a bench and birdsong: pure calm.', 'An hour there is worth a weekend.', 'Free entry.'),
  ('10000000-0000-4000-8000-000000000008', 'es', 'Jardín',
   'Sombra, banco y pajaritos: pura calma.', 'Una hora allí vale por un fin de semana.', 'Entrada gratuita.'),

  -- 09 Bar do Zé da Esquina
  ('10000000-0000-4000-8000-000000000009', 'pt-BR', 'Bar de bairro',
   'Mesa de plástico, cerveja gelada e conversa solta.', 'Duas horas passam rápido entre um petisco e outro.', 'Uns R$ 45 por pessoa, já com petisco.'),
  ('10000000-0000-4000-8000-000000000009', 'en', 'Neighborhood bar',
   'Plastic tables, cold beer and easy conversation.', 'Two hours go quickly between one snack and the next.', 'About R$ 45 per person, snacks included.'),
  ('10000000-0000-4000-8000-000000000009', 'es', 'Bar de barrio',
   'Mesas de plástico, cerveza fría y charla suelta.', 'Dos horas pasan rápido entre un bocado y otro.', 'Unos R$ 45 por persona, con picada incluida.'),

  -- 10 Biblioteca Pública Central
  ('10000000-0000-4000-8000-000000000010', 'pt-BR', 'Biblioteca',
   'Silêncio, ar-condicionado e uma poltrona só sua.', 'Duas horas de leitura sem ninguém te cobrar nada.', 'De graça, só levar um documento se quiser pegar um livro.'),
  ('10000000-0000-4000-8000-000000000010', 'en', 'Library',
   'Silence, air conditioning and an armchair all to yourself.', 'Two hours of reading with nobody asking anything of you.', 'Free; just bring an ID if you want to borrow a book.'),
  ('10000000-0000-4000-8000-000000000010', 'es', 'Biblioteca',
   'Silencio, aire acondicionado y un sillón solo para ti.', 'Dos horas de lectura sin que nadie te pida nada.', 'Gratis; solo lleva un documento si quieres pedir un libro.'),

  -- 11 Livraria da Estação (inativa)
  ('10000000-0000-4000-8000-000000000011', 'pt-BR', 'Livraria',
   'Prateleiras novas e cheiro de papel.', 'Uma hora entre lançamentos e clássicos.', 'Livros a partir de R$ 35.'),
  ('10000000-0000-4000-8000-000000000011', 'en', 'Bookstore',
   'New shelves and the smell of paper.', 'An hour among new releases and classics.', 'Books from R$ 35.'),
  ('10000000-0000-4000-8000-000000000011', 'es', 'Librería',
   'Estantes nuevos y olor a papel.', 'Una hora entre novedades y clásicos.', 'Libros desde R$ 35.')
on conflict (place_id, locale) do nothing;
