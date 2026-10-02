# Rolê Aleatório — Plano de Desenvolvimento (execução em loop)

> Fonte de verdade visual: `assets/Rolê Aleatório.html` (protótipo com 5 telas em 390×844).
> Stack já instalada: Expo SDK 57 · Expo Router (rotas em `src/app/`) · React 19.2 · RN 0.86 · Reanimated 4 · React Compiler · Typed Routes.
> Backend: **Supabase** (Postgres, Auth, Storage, Edge Functions e RLS).
> Regras do projeto: ver `AGENTS.md` (docs versionadas do Expo, `npx expo install`, sem editar `ios/`/`android/`).

---

## Visão geral

| Etapa | Fases | Objetivo |
|---|---|---|
| **MVP** | 0 → 13 | App utilizável numa cidade, com catálogo curado no Supabase, cota grátis, passaporte com backup automático, notificações locais e métricas. Distribuído para um grupo de teste. |
| 🏁 **Marco MVP** | — | **O loop para.** Validar com usuários reais antes de investir em pagamento, conta e social. |
| **Pós-MVP** | 14 → 19 | Plus com pagamento real, conta e múltiplos aparelhos, sugestão mais inteligente, Turma, qualidade final e lojas. |

**Pergunta que o MVP precisa responder:** *as pessoas realmente saem de casa por causa da sugestão e voltam na semana seguinte?*

---

## Como usar este plano em loop

Comando sugerido:

```
/loop Leia PLANO_DESENVOLVIMENTO.md e execute a PRÓXIMA tarefa pendente seguindo o "Protocolo de cada iteração".
```

### Protocolo de cada iteração

1. **Ler** este arquivo inteiro e o `AGENTS.md`.
2. **Localizar** a primeira tarefa `- [ ]` da fase atual (a fase atual é a primeira cuja seção "Critérios de saída" ainda não está toda marcada).
3. **Pré-requisitos (skills e docs):** antes de escrever qualquer código, invocar as skills da fase:
   - `🧭 ARCH` → **`react-native-architecture`**: estrutura, navegação, estado, dados e offline. Obrigatória na Fase 1 e sempre que uma tarefa criar pasta, rota, store, service ou mudar fluxo de dados.
   - `⚡ VRN` → **`vercel-react-native-skills`**: boas práticas de implementação (performance de listas, animações, navegação, padrões de UI, estado, renderização, imagens, fontes e módulos nativos). Obrigatória em **toda iteração que escreva ou altere código do app** (Fases 2 a 18).
   - Se a tarefa tiver as duas tags, invocar as duas: primeiro a de arquitetura, depois a de implementação.
   - API do Expo/RN: consultar `https://docs.expo.dev/versions/v57.0.0/`.
   - Supabase: consultar a **documentação atual do Supabase** (guia de Expo/React Native, Auth anônima, RLS, CLI e Edge Functions) antes de usar qualquer API. Não confiar na memória.
4. **Executar só essa tarefa.** Não adiantar tarefas de fases futuras.
5. **Validar:** `npx expo lint`, `npx tsc --noEmit` e `npx jest` (a partir da Fase 2, incluindo o teste de paridade das chaves de i18n). A partir da Fase 4, quando a tarefa mexer no banco, rodar também os testes do banco (`supabase test db`). Tudo verde antes de marcar.
6. **Marcar** a tarefa como `- [x]` e adicionar uma linha no **Registro de iterações** (fim do arquivo).
7. **Commitar** a iteração invocando a skill **`git-commit`** (ver "Commits"). Um commit por tarefa, com o código, os testes, o plano atualizado e o registro juntos. Depois do commit, anotar o hash curto na linha do Registro, que vai junto no commit seguinte.
8. **Fim de fase:** se todas as tarefas da fase estiverem `[x]`, verificar os "Critérios de saída", marcar cada um, commitar (skill `git-commit`) e integrar a branch da fase na `main` localmente (ver "Commits"). **Sem push.**
9. **Bloqueio:** se depender de decisão do usuário (⛔), de conteúdo que só o usuário pode fornecer, ou falhar 2× seguidas, registrar em **Bloqueios**, commitar o plano atualizado (`docs(plan): ...`) e parar o loop. Não chutar decisões de produto. Nunca commitar código quebrado: se a validação falhar, não commitar.
10. **Marco MVP:** ao concluir a Fase 13, **parar o loop** e registrar o bloqueio "Aguardando validação do MVP". Só seguir para a Fase 14 com autorização explícita do usuário.

### Regras gerais

- Uma tarefa por iteração, pequena e verificável.
- Nada de código de feature antes da Fase 1 (arquitetura) estar aprovada.
- Seguir a estrutura definida em `docs/ARCHITECTURE.md` (gerada na Fase 1); se precisar mudá-la, atualizar o doc primeiro.
- `StyleSheet.create` + tokens do tema; nada de cor/tamanho “mágico” solto nas telas.
- **Skills durante todo o desenvolvimento:** `react-native-architecture` define *onde* e *como estruturar*; `vercel-react-native-skills` define *como implementar bem*. Quando as duas entrarem em conflito, prevalece o `docs/ARCHITECTURE.md` aprovado. Registre a divergência no Registro de iterações.
- No Registro de iterações, anotar quais skills foram usadas e quais regras da `vercel-react-native-skills` foram aplicadas (pelo prefixo, ex.: `animation-`, `list-performance-`).

**Nomenclatura — tudo em inglês**
- **Todo nome técnico é em inglês:** arquivos, pastas, rotas (e as URLs/deep links que elas geram), componentes, funções, hooks, variáveis, tipos, constantes, tokens do tema, chaves de i18n, IDs de domínio, tabelas, colunas, enums, RPCs, Edge Functions, scripts, eventos de analytics, query keys e stores.
- **Português só no que o usuário lê:** textos dentro de `src/i18n/locales/pt-BR.json`, documentação e mensagens de commit.
- Se um nome não estiver no Glossário abaixo, escolher o termo em inglês mais simples e **acrescentá-lo ao Glossário** na mesma iteração, para manter a consistência.

| O quê | Padrão | Exemplo |
|---|---|---|
| Arquivos e pastas | `kebab-case` (padrão já usado no template: `themed-text.tsx`, `use-color-scheme.ts`) | `floating-tab-bar.tsx`, `opening-hours.ts`, `monthly-goal.ts` |
| Rotas (Expo Router) | `kebab-case` em inglês | `suggestion.tsx` → `/suggestion`, `report-problem.tsx` |
| Hooks | arquivo `use-*.ts`, função `useCamelCase` | `use-dock-inset.ts` → `useDockInset()` |
| Componentes, tipos, interfaces, classes | `PascalCase` | `FloatingTabBar`, `PlacesRepository`, `QuotaStatus` |
| Funções e variáveis | `camelCase`, começando com verbo nas funções | `formatDistance()`, `consumeSuggestion()`, `isOpenDuring()` |
| Constantes | `UPPER_SNAKE_CASE` | `FREE_WEEKLY_QUOTA = 3`, `DOCK_BASE_INSET = 106` |
| Tokens do tema | `camelCase` | `colors.yellow`, `colors.ink`, `shadow.dock` |
| Banco (tabelas, colunas, enums, RPCs) | `snake_case` | `suggestion_events`, `consume_suggestion()` |
| Edge Functions e scripts | `kebab-case` | `delete-my-data`, `scripts/catalog/validate.ts` |
| Chaves de i18n | `feature.camelCaseKey`, com sufixo de plural do i18next | `home.title`, `suggestion.remaining_one` |
| Eventos de analytics | `snake_case` | `stamp_created`, `go_tapped` |
| Testes | `<arquivo>.test.ts(x)` ao lado do arquivo testado | `streak.test.ts` |
| Branches e escopo de commit | escopo = nome do módulo em inglês | `feat(stamp): ...` |

**Glossário de domínio (PT → EN)**

| Produto (PT) | Código (EN) | | Produto (PT) | Código (EN) |
|---|---|---|---|---|
| Rolê (home) | `home` | | Ofensiva | `streak` |
| Sugestão | `suggestion` | | Cota | `quota` |
| Carimbo / selo | `stamp` | | Meta do mês | `monthlyGoal` / `monthly_goal` |
| Passaporte | `passport` | | Bingo da cidade | `bingo` |
| Turma | `crew` | | Lugar | `place` |
| Ajustes | `settings` | | Motivo ("por que pra você") | `reason` |
| "Como foi?" | `feedback` | | Humor | `mood` |
| Informar problema | `report` / `report-problem` | | Tempo disponível | `timeSlot` / `time_slot` |
| Fila offline | `syncQueue` | | Quanto quer gastar | `budget` |
| Dock (tab bar) | `FloatingTabBar` / `dock` | | Primeira abertura | `onboarding` |
| "Outra" | `other` | | "Bora, tô indo" | `go` |

**IDs de domínio** (iguais no app, no banco e nas chaves de i18n):
- **mood:** `curious` (Curioso), `lazy` (Preguiçoso), `romantic` (Romântico), `restless` (Inquieto), `chill` (Na paz), `social` (Social)
- **time_slot:** `1h`, `2h`, `half_day` (Meio dia), `full_day` (Dia todo)
- **budget:** `free` (De graça), `up_to_30` (Até R$30), `up_to_80` (Até R$80), `any` (Tanto faz)
- **category (bingo):** `viewpoint` (Mirante), `used_bookstore` (Sebo), `short_trail` (Trilha curta), `hidden_cafe` (Café escondido), `street_market` (Feira de bairro), `small_museum` (Museu pequeno), `street_cinema` (Cinema de rua), `garden` (Jardim), `open_studio` (Ateliê aberto), `free_show` (Show grátis), `new_square` (Praça nova), `bookstore` (Livraria), `neighborhood_bar` (Bar de bairro), `rooftop` (Rooftop), `library` (Biblioteca), `lake` (Lago)

**Commits (git)**
- Repositório já inicializado, com remote `origin` → `https://github.com/JulioAmaral007/role.git` e branch padrão `main`.
- **Todo commit é feito pela skill `git-commit`**, que analisa o diff, faz o stage dos arquivos certos e gera a mensagem em Conventional Commits. Não escrever `git commit` "na mão" fora dela.
- 🚫 **Nunca** adicionar `Co-Authored-By` (nem qualquer outra linha de atribuição ao Claude/IA) nas mensagens de commit. Conferir a mensagem antes de executar.
- **Formato:** `<tipo>(<escopo>): <descrição>`, no imperativo, com até 72 caracteres, em **pt-BR** (ex.: `feat(suggestion): adiciona troca de card com animação`). O escopo é o nome **em inglês** do módulo tocado: `home`, `suggestion`, `stamp`, `passport`, `plus`, `settings`, `feedback`, `onboarding`, `ui`, `theme`, `i18n`, `db`, `catalog`, `nav`, `notifications`, `plan`...
- **Tipos mais usados:** `feat` (feature), `fix`, `test`, `refactor`, `docs` (ARCHITECTURE, CURATION, plano), `build` (dependências, `app.json`, `eas.json`), `chore` (manutenção), `ci`. Para migrations do Supabase, usar `feat(db)` ou `fix(db)`.
- **Corpo do commit:** a fase e a tarefa do plano (ex.: `Fase 9 — Sugestão: "Outra"`) e as skills usadas.
- **Branches:** uma por fase, criada a partir da `main` atualizada no início da fase (`fase/02-design-system`, `fase/04-supabase`...). Os commits de tarefa vão nessa branch.
- **Fim de fase:** `git checkout main` → `git merge --no-ff fase/NN-...` (mensagem `chore(fase-NN): conclui <nome da fase>`) → apagar a branch local.
- 🚫 **Nunca fazer `git push`** (nem de branch, nem de tag). Tudo fica só local; quem envia para o `origin` é o usuário, manualmente. Ao fim de cada fase, registrar no Registro de iterações: "fase NN integrada na main — pronta para push manual".
- **Segurança:** nunca commitar `.env`, chaves ou arquivos com a service role do Supabase (conferir o `git status` antes). Nunca `--force`, `reset --hard`, `--no-verify` nem `amend` em commit já enviado. Se um hook falhar, corrigir e criar um commit **novo**. Nunca alterar o `git config`.

**i18n**
- Nenhum texto visível ao usuário fica hardcoded em componente. Tudo passa por `t('chave')` (a partir da Fase 2). O idioma base é **pt-BR**, com o texto exatamente igual ao do protótipo; os outros idiomas são traduções desse base. Datas, números, moeda e plurais usam `Intl` com o idioma ativo, nunca string montada à mão.
- Ao criar ou alterar uma tela, adicionar as chaves em **todos** os arquivos de idioma na mesma iteração (o teste de paridade precisa passar). Isso vale também para textos de notificações.

**Supabase**
- Toda mudança de schema é feita por **migration** em `supabase/migrations/` (Supabase CLI). Nunca alterar a estrutura direto no dashboard sem gerar a migration.
- **RLS ligado em todas as tabelas**, com policy explícita e testada (pgTAP / `supabase test db`).
- Depois de cada migration, regenerar os tipos (`supabase gen types typescript` → `src/types/database.ts`).
- No app só entram `EXPO_PUBLIC_SUPABASE_URL` e a chave pública (anon/publishable), via `.env`. A **service role nunca vai para o app**: fica só em Edge Functions e scripts locais. `.env` no `.gitignore` e `.env.example` versionado.
- O app conversa com o Supabase **só pela camada `services/`**. Telas e componentes nunca importam o client direto.
- Desenvolvimento com o Supabase local (`supabase start`) e um projeto remoto separado para o build de teste (ver D18).

**Privacidade (LGPD)**
- Coletar só o necessário. A localização é usada no aparelho para calcular distância e **não é salva no servidor** no MVP. Todo evento de analytics tem que estar listado na Fase 13.

---

## Referência rápida do protótipo

### Tokens de design

Os nomes dos tokens são em inglês (`colors.<token>` em `src/theme/tokens.ts`).

| Token | Valor | Uso |
|---|---|---|
| `yellow` | `#FFD43B` | fundo principal, destaques, texto sobre escuro |
| `ink` | `#141414` | texto, bordas 2px, botões primários, fundo do Plus |
| `cream` | `#FFFBEF` | cards, fundo do Passaporte |
| `blue` | `#2B3FD6` | tela de Carimbo, tags, células do bingo carimbadas |
| `blueDark` | `#1E2DA6` | card de meta na tela de Carimbo |
| `lavender` | `#E6E9FF` | texto secundário sobre azul |
| `olive` | `#3A3200` | rótulos/legendas sobre amarelo |
| `gray` | `#55524A` | texto secundário sobre creme |
| `grayLight` | `#8C887C` | semana perdida (borda tracejada) |
| `stripe` | `#F0E8CF` | placeholder listrado da foto |
| `sand` | `#D6D2C6` | ícones inativos da tab bar, texto secundário do Plus |
| `plus.*` | `#222220`, `#4A4842`, `#2A2614` | paywall escuro |
| `shadow.dock` | `0 12 32 rgba(20,20,20,.28)` + `0 2 6 rgba(20,20,20,.18)` | sombra da tab bar flutuante |

- **Fontes:** Bricolage Grotesque 700/800 (títulos, CTAs, números), Instrument Sans 400–700 (corpo), DM Mono 400/500 (rótulos em CAIXA ALTA, letter-spacing 0.08em).
- **Forma:** bordas sólidas de 2px na cor `ink`; pílulas com raio 999; botões com raio 14/16/18; cards com raio 20/24.
- **Layout:** padding de 52 em cima e 20 nas laterais; CTA principal com 58–62 de altura; alvos de toque ≥ 44.

### Tab bar — dock flutuante (revisão do protótipo em 02/10/2026)

A tab bar **não é mais** a barra fixa com borda superior e três itens iguais com ícone e texto. Agora é uma **pílula flutuante**:

- **Container:** `position: absolute`, a 20 das laterais e 22 da base (somar o safe area inferior no aparelho); fundo `ink`; raio 999; padding 6; gap 4 entre os itens; sombra `shadow.dock`.
- **Item ativo:** ocupa o espaço que sobra (`flex-grow`); altura 52; raio 999; fundo `yellow`; **ícone (22) + label** lado a lado, com gap 8; texto `ink`, 15/700.
- **Itens inativos:** largura fixa de 64 e altura 52; **só o ícone** (22), na cor `sand`. O nome vai apenas no `accessibilityLabel`.
- **Conteúdo das telas com tabs:** padding inferior de **106** (52 do item + 12 de padding + 22 de margem + folga) somado ao safe area, para nada ficar escondido atrás do dock. Isso é necessário porque o dock fica **por cima** do conteúdo.
- O mesmo dock escuro aparece em todas as tabs (fundo amarelo no Rolê, creme no Passaporte).

### Telas e fluxo

```
(tabs) ─ Rolê ──"Me tira da inércia"──▶ Sugestão ──"Bora, tô indo"──▶ Carimbo (modal) ──▶ Passaporte
       ├ Passaporte                       │  └"Outra" (sem cota) ──▶ Plus (modal)
       └ Turma (não desenhada)            └ "Reservar" | "Como chegar"
```

Telas que **não estão no protótipo** e serão criadas no mesmo visual: Onboarding, Ajustes (idioma, notificações, privacidade, apagar dados), "Como foi?" (feedback pós-rolê) e "Informar problema" do lugar.

1. **Rolê (home):** logo + pílula de ofensiva ("3 semanas"); título "Bora pra um lugar que não é o de sempre?"; seleção única em três grupos:
   - **01 · Como você tá?** Curioso, Preguiçoso, Romântico, Inquieto, Na paz, Social
   - **02 · Quanto tempo você tem?** 1h, 2h, Meio dia, Dia todo
   - **03 · Quanto quer gastar?** De graça, Até R$30, Até R$80, Tanto faz
   - CTA "Me tira da inércia" e contador "2 de 3 sugestões grátis nesta semana"; dock flutuante com Rolê (ativo), Passaporte e Turma.
2. **Sugestão:** voltar; resumo do filtro ("CURIOSO · 2H · ATÉ R$30"); pílula "N restantes". Card em formato de ingresso: foto, tag do tipo, "Nunca carimbado", nome, endereço e distância, picote, "Por que pra você, agora" (3 motivos ligados ao humor, ao tempo e à grana). CTA "Bora, tô indo"; "Outra" (gasta 1 da cota e, sem cota, abre o Plus); "Reservar" se o lugar for reservável, senão "Como chegar".
3. **Carimbo novo:** fundo azul; data ("SEX · 02 OUT"); "Carimbo novo!" com texto de ofensiva; selo circular girado −9° com "Nº 14", nome e data; card "Meta de outubro · 3 lugares onde você nunca foi" com progresso 3/3 e "Bingo da cidade: 7 de 16". Botões "Mandar pro grupo" (share) e "Ver meu passaporte".
4. **Passaporte:** header amarelo com estatísticas (carimbos, semanas de ofensiva, bingo X/16) e botão de compartilhar; **Ofensiva semanal** com as últimas 8 semanas ("1 saída por semana basta"); **Meta do mês**; **Bingo da cidade** em grade 4×4 com 16 categorias: Mirante, Sebo, Trilha curta, Café escondido, Feira de bairro, Museu pequeno, Cinema de rua, Jardim, Ateliê aberto, Show grátis, Praça nova, Livraria, Bar de bairro, Rooftop, Biblioteca, Lago.
5. **Plus (paywall):** fundo escuro; "Rolê sem limite."; tabela Grátis × Plus (Sugestões: 3/semana × Ilimitadas; Passaporte e bingo: incluso nos dois; Reserva no app: incluso nos dois); planos Mensal e Anual (preço `[PREÇO]`, Anual pré-selecionado); "Assinar o Plus"; link "Prefiro esperar: as grátis voltam segunda".

### Regras de negócio

- **Cota grátis:** 3 sugestões por semana, renovadas toda **segunda-feira** no fuso do usuário. Ver a primeira sugestão já gasta 1; cada "Outra" gasta mais 1. Usuário Plus não tem limite. A contagem fica no **servidor** (ver D12).
- **Carimbo:** tocar em "Bora, tô indo" gera um carimbo com número sequencial (Nº 14), lugar e data (no MVP o carimbo é imediato, ver D6).
- **Ofensiva semanal:** quantidade de semanas seguidas com pelo menos 1 carimbo.
- **Meta mensal:** 3 lugares nunca visitados no mês.
- **Bingo:** 16 categorias; uma célula é marcada quando existe pelo menos 1 carimbo daquela categoria.
- **Sugestão:** filtra por humor, tempo e orçamento; mostra só lugares **abertos** durante a janela de tempo escolhida; dá prioridade a lugares **nunca carimbados**; respeita as regras de segurança (lugares só de dia, ver Fase 9); cada lugar traz 3 textos de motivo e a flag `reservable`.

### Modelo de dados inicial (Supabase, refinar na Fase 1)

| Tabela | Campos principais | RLS |
|---|---|---|
| `cities` | id, nome, fuso, `daylight_cutoff` | leitura para autenticados |
| `places` | id, city_id, `category` (enum das 16 do bingo), name, address, lat/lng, `price_tier`, `duration_min`, `moods[]`, reservable, reservation_url, photo_path, `daylight_only`, `accessible`, `pet_friendly`, active, `verified_at` | leitura para autenticados (só `active`) |
| `place_translations` | place_id, locale, kind_label, reason_mood, reason_time, reason_money | leitura para autenticados |
| `place_hours` | place_id, weekday, opens, closes | leitura para autenticados |
| `profiles` | id (= auth.uid), locale, timezone, plan, created_at, accepted_terms_at | só o dono |
| `stamps` | id (uuid gerado no cliente), user_id, place_id, number, stamped_at | só o dono; insert idempotente |
| `suggestion_events` | user_id, place_id, action (`shown`/`other`/`go`), reason, created_at | insert só via RPC; leitura do dono |
| `place_feedback` | user_id, stamp_id, liked, comment | só o dono |
| `place_reports` | user_id, place_id, reason (`closed`/`wrong_info`/`unsafe`/`other`), note | só insert pelo dono |
| `events` | user_id, name, props jsonb, created_at | só insert (analytics) |
| `plus_interest` | user_id, plan_viewed, created_at | só insert (fake door, ver D13) |

RPCs / Edge Functions do MVP: `consume_suggestion()` (cota no servidor, `security definer`), `quota_status()` e Edge Function `delete-my-data`.

---

# 🟡 MVP

## Fase 0 — Preparação do repositório

- [x] Rodar `git init` e configurar o remote `origin` (feito pelo usuário; existe o commit `cc99286 Initial commit`).
- [x] Criar a branch `fase/00-preparacao`, conferir o `.gitignore` (incluir `.env`, `.env.*` exceto `.env.example`, e `supabase/.temp`) e commitar com a skill `git-commit` o que está pendente: o plano, as skills (`.agents/`, `.claude/skills/`, `skills-lock.json`) e o protótipo atualizado. Commits separados por assunto (ex.: `docs(plan): ...`, `chore: adiciona skills do projeto`, `docs(design): atualiza protótipo com dock flutuante`).
- [x] Adicionar os scripts `typecheck` (`tsc --noEmit`) e `test` no `package.json`.
- [ ] Rodar `npx expo-doctor` e registrar o resultado.
- [ ] Remover o conteúdo de demonstração do template (`explore.tsx`, `animated-icon`, `hint-row`, `web-badge` e afins) sem quebrar o build. Usar o `reset-project` só se fizer sentido; olhar o script antes de rodar.
- [ ] Conferir se o Supabase CLI e o Docker estão disponíveis (necessários para o Supabase local). Se não estiverem, registrar em Bloqueios com as instruções de instalação.

**Critérios de saída**
- [ ] App abre (`npx expo start`) com uma tela vazia sem erros.
- [ ] Lint e typecheck verdes.

---

## Fase 1 — Arquitetura 🧭 ARCH (+ ⚡ VRN como referência)

> **Obrigatório:** começar esta fase invocando a skill **`react-native-architecture`** (Skill tool, ou `/react-native-architecture`) e ler `.claude/skills/react-native-architecture/references/details.md`. Todas as decisões abaixo devem seguir os padrões dela (estrutura de pastas, Expo Router, React Query offline-first, separação entre `services` e `stores`, fluxo de auth, boas práticas de performance), adaptados para Expo SDK 57 e Supabase.
> Esta fase produz **documentação e esqueleto de pastas**, não features.

- [ ] 🧭 ARCH: invocar `react-native-architecture` e resumir em `docs/ARCHITECTURE.md` os padrões adotados.
- [ ] ⚡ VRN: invocar `vercel-react-native-skills`, ler as regras em `.agents/skills/vercel-react-native-skills/` e registrar em `docs/ARCHITECTURE.md` uma seção **Convenções de implementação** com as regras que valem para o projeto (prioridade: listas, animação, navegação e UI).
- [ ] Definir a **estrutura de pastas** em `docs/ARCHITECTURE.md`. Proposta inicial, a validar com a skill:
  ```
  supabase/
  ├── migrations/                # schema versionado (SQL)
  ├── functions/                 # Edge Functions (delete-my-data, depois webhooks)
  ├── tests/                     # testes de RLS/RPC (pgTAP)
  └── seed.sql                   # dados de dev
  scripts/
  └── catalog/                   # validação/importação do catálogo (CSV → Supabase)
  src/
  ├── app/                       # SOMENTE rotas (Expo Router)
  │   ├── _layout.tsx            # providers + Stack raiz + gate de onboarding
  │   ├── onboarding.tsx         # primeira abertura
  │   ├── (tabs)/
  │   │   ├── _layout.tsx        # tab bar custom (Rolê · Passaporte · Turma)
  │   │   ├── index.tsx          # Rolê (home)
  │   │   ├── passport.tsx       # Passaporte
  │   │   └── crew.tsx           # Turma
  │   ├── suggestion.tsx         # Sugestão (Stack push)
  │   ├── stamp.tsx              # Carimbo (fullScreenModal)
  │   ├── feedback.tsx           # "Como foi?" (modal)
  │   ├── report-problem.tsx     # "Informar problema" (modal)
  │   ├── plus.tsx               # modal (paywall / fake door)
  │   └── settings.tsx           # Ajustes (modal): idioma, notificações, privacidade, apagar dados
  ├── components/
  │   ├── ui/                    # button.tsx (Button), chip.tsx, pill.tsx, card.tsx, floating-tab-bar.tsx, icons/...
  │   └── features/              # home/, suggestion/, stamp/, passport/, plus/, settings/, feedback/, onboarding/
  ├── hooks/                     # use-quota.ts (useQuota), use-streak.ts, use-suggestion.ts, use-language.ts, use-dock-inset.ts...
  ├── lib/
  │   └── supabase.ts            # client único (sessão persistida)
  ├── services/                  # places, stamps, quota, feedback, reports, analytics, location, notifications, share
  ├── stores/                    # estado local persistido (preferências, fila offline, cache do passaporte)
  ├── domain/                    # regras puras: recommend.ts, streak.ts, bingo.ts, monthly-goal.ts, opening-hours.ts, safety.ts
  ├── theme/                     # tokens, fontes, tipografia
  ├── i18n/
  │   ├── index.ts               # init do i18next + detecção do idioma do aparelho
  │   ├── format.ts              # helpers Intl: data, moeda, distância, ordinais
  │   └── locales/               # pt-BR.json (base), en.json, es.json
  ├── types/                     # inclui database.ts gerado pelo Supabase
  └── utils/
  ```
- [ ] Definir o **mapa de navegação** (tipos de apresentação: push, modal e fullScreenModal; gate de onboarding; deep links com o scheme `role://`, por exemplo `role://suggestion` e `role://place/<id>`).
- [ ] Definir a **implementação da tab bar** (ADR curto): o dock flutuante do protótipo exige **tabs JS do Expo Router com `tabBar` customizado**, e não `NativeTabs`/tab bar nativa, que não permitem esse visual. Definir também como as telas recebem o recuo inferior (hook `useDockInset()` = altura do dock + margem + safe area), já que o dock fica sobreposto ao conteúdo. Conferir a API de tabs do Expo Router no SDK 57.
- [ ] Definir a **estratégia de estado**: estado de servidor com React Query (catálogo, carimbos, cota) e estado local persistido (preferências, filtros, fila offline) com uma lib de store + AsyncStorage. Justificar a escolha (ex.: Zustand) em um ADR curto.
- [ ] Definir a **arquitetura Supabase** (ADR):
  - **Auth anônima** (`signInAnonymously`) na primeira abertura, sem cadastro. Cada aparelho ganha um `user_id`, o que dá backup do passaporte e cota no servidor desde o MVP. A conta definitiva (vincular e-mail, Apple ou Google) fica para a Fase 15.
  - Sessão persistida conforme o guia oficial do Supabase para Expo, com refresh automático ligado ao `AppState`.
  - Schema conforme o "Modelo de dados inicial", com RLS e as RPCs `consume_suggestion()` e `quota_status()` (fuso do usuário em `profiles.timezone`).
  - **Recomendação no cliente** no MVP: baixar e cachear o catálogo da cidade e filtrar no aparelho (ver D16).
  - Fotos dos lugares no **Supabase Storage** (bucket público só leitura), servidas com `expo-image`.
- [ ] Definir a **estratégia offline-first** (Pattern 3 da skill):
  - catálogo cacheado (React Query persistido), com o passaporte funcionando sem internet;
  - carimbos criados offline com `id` uuid no cliente, colocados numa fila e enviados por `upsert` idempotente quando a conexão voltar;
  - **pedir uma sugestão nova exige internet** no MVP, porque a cota é consumida no servidor (ver D12), com uma tela clara de "sem conexão".
- [ ] Definir a **estratégia de i18n** (consultar o guia de localização do Expo SDK 57):
  - **Libs:** `expo-localization` (idioma e região do aparelho) + `i18next` + `react-i18next`. Justificar em um ADR curto; a alternativa é `i18n-js`.
  - **Resolução do idioma:** escolha salva pelo usuário → idioma do aparelho → `pt-BR` como fallback. O idioma ativo também fica salvo em `profiles.locale`, para as notificações.
  - **Troca em tempo real** (sem reiniciar o app), com a escolha persistida no store de preferências.
  - **Chaves:** organizadas por tela/feature (`home.title`, `suggestion.cta`, `plus.table.suggestions`...) e tipadas no TypeScript, para que uma chave inexistente dê erro de compilação.
  - **Plurais e interpolação** pelo i18next (`suggestion.remaining_one` / `suggestion.remaining_other`), ordinais ("3ª semana") via `Intl.PluralRules` com `type: 'ordinal'`, conferindo o suporte a `Intl` no Hermes.
  - **Formatação** com `Intl.DateTimeFormat` ("SEX · 02 OUT"), `Intl.NumberFormat` (moeda e km) e moeda separada do idioma (ver D10).
  - **Conteúdo do catálogo** vem da tabela `place_translations`, com fallback para pt-BR. A query key do React Query inclui o idioma.
  - **Textos nativos** (permissões e nome do app) via `locales` no `app.json`.
- [ ] Definir a **estratégia de testes**: jest-expo para `domain/`, hooks e services (com o Supabase mockado), Testing Library para componentes, teste de paridade de chaves de i18n, **pgTAP para RLS e RPCs** e, opcionalmente, Maestro para E2E.
- [ ] Definir **ambientes e segredos**: Supabase local (dev) e projeto remoto do MVP; `.env`/`.env.example`; variáveis `EXPO_PUBLIC_*` por perfil do EAS.
- [ ] Listar as **dependências planejadas** (instalar só na fase que usar), sempre via `npx expo install`: `@supabase/supabase-js` (e o que o guia oficial pedir para RN), `react-native-svg`, `@react-native-async-storage/async-storage`, `@tanstack/react-query` (+ persister), `zustand`, `expo-localization`, `i18next`, `react-i18next`, `expo-haptics`, `expo-location`, `expo-notifications`, `expo-sharing`/`Share` do RN, `expo-crypto` (uuid) e as fontes do `@expo-google-fonts`.
- [ ] Registrar em `docs/ARCHITECTURE.md` a seção **Convenções de nomenclatura** (tabela de padrões, Glossário e IDs de domínio deste plano) e, se der, reforçar com regras de lint (ex.: `@typescript-eslint/naming-convention` e checagem de nome de arquivo em kebab-case).
- [ ] Criar as pastas vazias, com `index.ts` ou `.gitkeep`, e o alias `@/` no `tsconfig` (conferir se já existe).
- [ ] Registrar em `docs/ARCHITECTURE.md` as **Decisões em aberto** (seção no fim) com o default escolhido.

**Critérios de saída**
- [ ] `docs/ARCHITECTURE.md` completo (pastas, navegação, estado, Supabase, offline, i18n, testes, ambientes, dependências).
- [ ] Skill `react-native-architecture` citada como base da arquitetura e `vercel-react-native-skills` como base das convenções de implementação.
- [ ] Usuário revisou e aprovou a arquitetura (**parar o loop aqui até aprovação**).

---

## Fase 2 — Design system e infraestrutura de i18n ⚡ VRN

**i18n (fazer primeiro, para que os componentes já nasçam traduzíveis)**
- [ ] Instalar `expo-localization`, `i18next` e `react-i18next` e configurar jest-expo (necessário para o teste de paridade).
- [ ] `src/i18n/index.ts`: init com recursos locais, `fallbackLng: 'pt-BR'` e detecção via `getLocales()`.
- [ ] `src/i18n/locales/pt-BR.json` com **todos os textos do protótipo** (ver "Referência rápida"), além de `en.json` e `es.json` traduzidos.
- [ ] Tipagem das chaves (module augmentation do `react-i18next`), para que uma chave errada quebre o `tsc`.
- [ ] `src/i18n/format.ts`: `formatDate`, `formatStampDate` ("02 · 10 · 2026"), `formatWeekdayShort` ("SEX · 02 OUT"), `formatCurrency`, `formatDistance` ("1,8 km" / "1.8 km") e `formatOrdinal`, todos lendo o idioma ativo. Com testes.
- [ ] Hook `useLanguage()` (`src/hooks/use-language.ts`): idioma atual, `setLanguage(lang | 'system')` e persistência no store de preferências, com troca imediata.
- [ ] Teste de paridade: todos os idiomas têm exatamente as mesmas chaves e placeholders (`{{count}}`, `{{name}}`).

**Design system**
- [ ] `src/theme/tokens.ts` com cores, espaçamentos, raios, bordas e alturas de toque (ver tabela acima).
- [ ] Carregar as fontes Bricolage Grotesque, Instrument Sans e DM Mono (via `expo-font`/`@expo-google-fonts`) e segurar a splash até elas carregarem.
- [ ] `src/theme/typography.ts` com as variantes: `display`, `title`, `cta`, `body`, `label` (mono em caixa alta) e `stat`.
- [ ] Ícones SVG do protótipo como componentes (`Logo`, `Bolt`, `Compass`, `Passport`, `Users`, `Arrow`, `Back`, `Close`, `Pin`, `Clock`, `Wallet`, `Smile`, `Refresh`, `Calendar`, `Share`, `Check`), mais `Settings`, `Flag` (informar problema) e `WifiOff`.
- [ ] Componentes `ui/`: `Button` (primary, outline, cream), `Chip` (seleção única, `aria-pressed` → `accessibilityState`), `SegmentedGrid`, `Pill`, `SectionLabel`, `Card`, `TicketDivider` (picote), `ProgressSegments`, `EmptyState`, `ErrorState`, `OfflineBanner`.
- [ ] Componente `FloatingTabBar` (`src/components/ui/floating-tab-bar.tsx`, o dock) fiel à seção "Tab bar — dock flutuante":
  - pílula `ink` absoluta com sombra `shadow.dock` (no Android, conferir `boxShadow`/`elevation` e se a sombra fica parecida);
  - item ativo expandido em `yellow` com ícone e label; inativos de 64 só com ícone `sand`;
  - **animação** de troca: o item ativo encolhe e o novo expande (largura e cor) com Reanimated, mais um haptic leve opcional. Seguir as regras `animation-` da `vercel-react-native-skills` (animar só no thread de UI, sem re-render por frame);
  - acessibilidade: `accessibilityRole="tab"`, `accessibilityState={{ selected }}` e `accessibilityLabel` traduzido nos itens só com ícone;
  - i18n: o label ativo usa `t()` e o teste de layout cobre o maior label entre os idiomas ("Passaporte" / "Passport" / "Pasaporte").
- [ ] Hook `useDockInset()` (`src/hooks/use-dock-inset.ts`), que devolve o recuo inferior (base de 106 + safe area) para as telas com tabs.
- [ ] Definir `userInterfaceStyle` como `light` (ver D2).

**Critérios de saída**
- [ ] Tela temporária de "catálogo de componentes" mostrando todos os componentes (remover depois), com um botão para alternar o idioma ali mesmo.
- [ ] Nenhuma cor hardcoded fora de `theme/` e nenhum texto hardcoded fora de `i18n/locales/`.
- [ ] Componentes de texto aguentam strings até ~40% maiores que o pt-BR sem estourar (botões, chips, pílulas e o item ativo do dock).
- [ ] Dock conferido num iPhone com home indicator e num Android com navegação por gestos e por botões (o safe area está correto e nada fica cortado).

---

## Fase 3 — Navegação e esqueleto das telas 🧭 ARCH ⚡ VRN

- [ ] `_layout.tsx` raiz com providers (i18n inicializado antes do primeiro render, QueryClient, fontes/splash, error boundary) e Stack.
- [ ] Gate de onboarding: na primeira abertura vai para `/onboarding`; depois, direto para as tabs (flag persistida).
- [ ] Grupo `(tabs)` com Rolê, Passaporte e Turma, usando o `FloatingTabBar` da Fase 2 via `tabBar` customizado (labels via `t()`). Todas as telas com tabs aplicam `useDockInset()` no conteúdo/scroll.
- [ ] Remover o `app-tabs.tsx` do template (e a variante `.web`), substituído pelo dock.
- [ ] Rotas `suggestion` (push), `stamp` (fullScreenModal), `feedback`, `report-problem`, `plus` e `settings` (modais) com placeholders.
- [ ] `settings` (Ajustes) com a seção **Idioma** funcional: "Idioma do aparelho", Português (Brasil), English e Español; o idioma ativo fica marcado e a troca vale na hora. O acesso fica num botão no header do Passaporte (ver D9).
- [ ] Títulos de tela e `accessibilityLabel` também traduzidos.
- [ ] Navegação de ponta a ponta funcionando com dados fake (Rolê → Sugestão → Carimbo → Passaporte; Sugestão → Plus → voltar).
- [ ] Testar os deep links `role://suggestion`, `role://passport` e `role://place/<id>` (este por enquanto abre um placeholder).

**Critérios de saída**
- [ ] O fluxo inteiro dá para clicar no Android e no iOS (ou na web) sem crash.
- [ ] Trocar o idioma em Ajustes atualiza tabs e telas na hora, e a escolha continua valendo depois de reabrir o app.

---

## Fase 4 — Supabase: setup, schema e segurança 🧭 ARCH

- [ ] `supabase init` no repositório e Supabase local rodando (`supabase start`). Documentar os comandos no `README.md`.
- [ ] Migration do schema do "Modelo de dados inicial": tabelas, enums (`category`, `mood`, `time_slot`, `budget`, `report_reason`), índices e `updated_at`.
- [ ] **RLS em todas as tabelas**, com policies conforme a tabela do modelo.
- [ ] RPC `consume_suggestion(place_id)`: `security definer`; valida a cota semanal no fuso do usuário (segunda 00:00), registra em `suggestion_events` e retorna `{ allowed, remaining, resets_at }`. Plus não tem limite.
- [ ] RPC `quota_status()`: devolve o restante e a data de renovação, sem consumir.
- [ ] Trigger: criar `profiles` automaticamente quando um usuário (inclusive anônimo) é criado.
- [ ] Edge Function `delete-my-data`: apaga o usuário e todos os dados dele (usa a service role só no servidor).
- [ ] Testes pgTAP: usuário A não lê nem escreve dados do B; cota bloqueia a 4ª sugestão da semana; a cota renova na segunda; anônimo lê só lugares ativos.
- [ ] `seed.sql` com uma cidade e ~10 lugares de exemplo (dev).
- [ ] Gerar `src/types/database.ts` e adicionar o script `npm run db:types`.
- [ ] `src/lib/supabase.ts`: client único com sessão persistida e auto-refresh ligado ao `AppState`, conforme o guia oficial atual.
- [ ] Auth anônima: `signInAnonymously` silencioso na primeira abertura, com retry e sem bloquear o onboarding. Habilitar a proteção contra abuso recomendada pelo Supabase (captcha/rate limit) e anotar no ADR.
- [ ] ⛔ Usuário cria o **projeto remoto do MVP** no Supabase e fornece a URL e a chave pública para o `.env` (ver D18). Aplicar as migrations (`supabase db push`).

**Critérios de saída**
- [ ] `supabase test db` verde.
- [ ] O app abre, cria o usuário anônimo e chama `quota_status()` com sucesso no Supabase local.
- [ ] Nenhuma chave secreta no código nem no bundle (conferir com uma busca por `service_role`).

---

## Fase 5 — Domínio e camada de dados 🧭 ARCH ⚡ VRN

- [ ] Configurar a cobertura do jest para `domain/`.
- [ ] Tipos de domínio em `src/types` derivados de `database.ts`: `Place` (com tradução e horários resolvidos), `Stamp`, `WeekStatus`, `QuotaStatus`, `Plan`. Humores, tempos, orçamentos e categorias do bingo são **IDs em inglês** conforme o Glossário (`curious`, `2h`, `up_to_30`, `viewpoint`...); o rótulo vem sempre do i18n.
- [ ] `domain/opening-hours.ts`: diz se o lugar fica aberto durante toda a janela escolhida (agora + duração), no fuso da cidade, incluindo horário que vira a meia-noite. Com testes.
- [ ] `domain/safety.ts`: lugares `daylight_only` não aparecem depois do `daylight_cutoff` da cidade (ver D19). Com testes.
- [ ] `domain/recommend.ts`: filtrar por humor, tempo, orçamento, horário e segurança; ordenar por distância compatível com o tempo; priorizar nunca carimbados; sortear sem repetir na sessão; fallback quando nada combina ("afrouxar" o orçamento e depois o humor, avisando o usuário).
- [ ] `domain/streak.ts`: ofensiva semanal e histórico das últimas 8 semanas.
- [ ] `domain/bingo.ts` e `domain/monthly-goal.ts`.
- [ ] `services/places`: `PlacesRepository` com `SupabasePlacesRepository` (catálogo da cidade + traduções + horários) e `InMemoryPlacesRepository` para testes. Exposto por um hook React Query com cache persistido.
- [ ] `services/quota`: `consume()` e `status()` chamando as RPCs; erro de rede vira o estado "offline".
- [ ] `services/stamps`: criar o carimbo localmente (uuid + número) → fila offline → `upsert` idempotente; listar os carimbos do usuário.
- [ ] `stores/`: preferências (idioma, filtros, onboarding, notificações) e fila offline, persistidas em AsyncStorage.

**Critérios de saída**
- [ ] Cobertura ≥ 90% em `domain/`.
- [ ] Carimbo criado em modo avião aparece no Supabase depois que a conexão volta, sem duplicar.
- [ ] Estado persiste depois de fechar e reabrir o app.

---

## Fase 6 — Catálogo e curadoria 🧭 ARCH

> **O valor do app está na qualidade das sugestões.** Sugerir um lugar fechado é a pior experiência possível. Esta fase é metade código (ferramentas) e metade conteúdo, e o conteúdo **só o usuário pode fornecer**.

- [ ] ⛔ Usuário define a **cidade inicial** (D7) e o processo de curadoria (D5b).
- [ ] Planilha-modelo (`scripts/catalog/template.csv`) com todos os campos de `places`, `place_hours` e `place_translations`, mais um guia de preenchimento em `docs/CURATION.md` (o que é um bom "motivo", tom de voz, como tirar ou escolher a foto).
- [ ] Script `scripts/catalog/validate`: todo lugar tem horários, coordenadas, categoria, as 3 razões em **todos** os idiomas, foto e `verified_at` recente. Aponta as combinações de filtro sem nenhum lugar.
- [ ] Script `scripts/catalog/import`: CSV → Supabase (upsert por id, usando a service role **só localmente**) e upload das fotos para o Storage.
- [ ] Relatório de cobertura: quantos lugares por categoria do bingo, por humor, por faixa de preço e por duração. Meta do MVP: **≥ 60 lugares**, com todas as 16 categorias cobertas.
- [ ] Rotina de manutenção documentada: revisar `place_reports` toda semana (view `reports_pending` no Supabase Studio), desativar lugares fechados (`active = false`) e reverificar lugares com `verified_at` antigo.
- [ ] ⛔ Usuário preenche o catálogo real; o loop roda `validate` e `import`.

**Critérios de saída**
- [ ] `validate` sem erros e meta de cobertura atingida no projeto remoto do MVP.

---

## Fase 7 — Onboarding, permissões e localização ⚡ VRN

- [ ] Onboarding com 2–3 telas curtas no visual do app: o conceito ("um lugar que não é o de sempre"), o passaporte e o bingo, e a cota de 3 sugestões por semana.
- [ ] Aceite dos **Termos e da Política de Privacidade** (links), registrado em `profiles.accepted_terms_at`.
- [ ] **Explicar antes de pedir** a localização: tela própria dizendo por que o app usa localização ("pra calcular a distância, sem salvar onde você está"), e só depois o prompt do sistema.
- [ ] Permissão negada: o app continua funcionando, sem mostrar distância e ordenando pela cidade, com um aviso discreto e um atalho para os ajustes do sistema.
- [ ] `services/location`: localização em primeiro plano (`expo-location`), com cache da última posição e textos de permissão traduzidos via `locales` no `app.json`.
- [ ] Estados de primeira vez nas telas: ofensiva "0 semanas" com texto motivador e passaporte vazio com um CTA para o primeiro rolê.

**Critérios de saída**
- [ ] Instalação limpa → onboarding → home funciona com a permissão aceita **e** com a permissão negada.

---

## Fase 8 — Tela Rolê (home) ⚡ VRN

- [ ] Header com logo e pílula de ofensiva ligada ao `streak`.
- [ ] Título e os três grupos de seleção, com estado inicial vindo dos últimos filtros (default: Curioso, 2h, Até R$30).
- [ ] CTA "Me tira da inércia": chama `quota.consume()` e navega para a Sugestão; sem cota, abre o Plus; sem internet, mostra o estado offline.
- [ ] Contador "X de 3 sugestões grátis nesta semana" vindo de `quota_status()` (plural do i18n; oculto para Plus). Valores de orçamento com `formatCurrency`.
- [ ] Card "Como foi o rolê no {{lugar}}?" quando houver carimbo sem feedback (abre `/feedback`).
- [ ] Acessibilidade: labels, `accessibilityRole`, estado selecionado e tamanho de fonte dinâmico sem quebrar o layout.

**Critérios de saída**
- [ ] Visual bate com o protótipo (comparar com screenshot) em pt-BR e não quebra em en/es.
- [ ] CTA "Me tira da inércia" e o contador ficam **acima** do dock, sem sobreposição, inclusive com fonte grande (o conteúdo rola se não couber).

---

## Fase 9 — Tela Sugestão ⚡ VRN

- [ ] Header com voltar, resumo do filtro (montado a partir dos rótulos traduzidos) e pílula "N restantes" (plural `_one`/`_other`).
- [ ] Card-ingresso: foto (`expo-image` vinda do Storage, com placeholder listrado), tags, nome, endereço com distância, picote e os 3 motivos traduzidos.
- [ ] Mostrar "Aberto até HH:MM" no card (vindo de `domain/opening-hours.ts`).
- [ ] "Outra": consome cota, troca de lugar com uma animação de troca de card (Reanimated) e vai para o Plus quando a cota acabar. Opcionalmente pergunta o motivo em um toque (chips: "longe", "caro", "não curti o tipo"), que vai para `suggestion_events.reason`. Nunca bloqueia a troca.
- [ ] "Reservar" (abre `reservation_url` no WebBrowser) ou "Como chegar" (abre o app de mapas com `Linking`), conforme `reservable`.
- [ ] Botão discreto **"Informar problema"** → modal `/report-problem` (fechou, informação errada, inseguro, outro + nota) → `place_reports`.
- [ ] "Bora, tô indo" registra o evento `go` e leva ao Carimbo.
- [ ] Estados de loading, vazio ("nenhum rolê aberto com esse filtro agora", com sugestão de afrouxar o filtro), offline e erro.

---

## Fase 10 — Carimbo e compartilhamento ⚡ VRN

- [ ] Registrar o `Stamp` (número sequencial, lugar, data e categoria) pela fila offline e atualizar ofensiva, meta e bingo.
- [ ] Tela azul com a data formatada no idioma ativo (`formatWeekdayShort`), texto dinâmico com ordinal localizado ("É a 3ª semana seguida…" / "3rd week in a row…") e o selo girado −9°.
- [ ] Animação de entrada do selo (escala + rotação com spring) e `expo-haptics` no impacto.
- [ ] Card da meta do mês com `ProgressSegments` e o texto do bingo.
- [ ] "Mandar pro grupo": compartilhar texto traduzido **com link** (no MVP, link da landing/loja ou `role://place/<id>`; universal links ficam para a Fase 16, ver D15). Como evolução, imagem do selo (`react-native-view-shot` + `expo-sharing`).
- [ ] "Ver meu passaporte" fecha o modal e abre a tab Passaporte.
- [ ] Modal `/feedback`: "Curtiu?" (👍/👎 + comentário opcional) → `place_feedback`. Aparece pelo card da home ou pela notificação da Fase 12, **nunca** logo após o carimbo, porque nesse momento o usuário ainda está saindo.

---

## Fase 11 — Passaporte e Ajustes ⚡ VRN

- [ ] Header com as 3 estatísticas, o botão de compartilhar o álbum e o botão de Ajustes.
- [ ] Ofensiva semanal com 8 semanas (feita/perdida).
- [ ] Meta do mês com o nome do mês no idioma ativo ("Meta de outubro" / "October goal").
- [ ] Bingo 4×4 com células carimbadas e pendentes; ao tocar, mostrar os carimbos daquela categoria (detalhe opcional).
- [ ] Estado vazio para usuário novo (0 carimbos).
- [ ] Conteúdo rolável com `useDockInset()`: a última linha do bingo fica visível acima do dock quando o scroll chega ao fim.
- [ ] O passaporte funciona offline (dados em cache) e mostra um indicador discreto quando há carimbos esperando sincronizar.
- [ ] **Ajustes** completo: Idioma; Notificações (liga/desliga por tipo); Termos e Privacidade (links); **"Apagar meus dados"** com confirmação dupla → Edge Function `delete-my-data` → limpa o armazenamento local e volta ao onboarding; versão do app.

---

## Fase 12 — Notificações locais ⚡ VRN

> No MVP as notificações são **locais** (agendadas no aparelho, sem servidor de push). Conferir nas docs do SDK 57 se o Expo Go basta para testar ou se é preciso um development build.

- [ ] `services/notifications` com `expo-notifications`: permissão, canais (Android) e agendamento/cancelamento.
- [ ] **Explicar antes de pedir** a permissão de notificação depois do **primeiro carimbo** ("quer que a gente te lembre da ofensiva?"), e não na primeira abertura.
- [ ] Lembretes (todos traduzidos, respeitando os toggles de Ajustes):
  - **Ofensiva em risco:** sexta à tarde, se não houver carimbo na semana ("Falta 1 rolê pra manter sua ofensiva de 3 semanas").
  - **Cota renovou:** segunda de manhã ("Suas 3 sugestões grátis voltaram").
  - **Como foi?:** ~3h depois do "Bora, tô indo", com deep link para `/feedback`.
- [ ] Reagendar tudo ao trocar de idioma, ao carimbar e ao desligar um tipo nos Ajustes.
- [ ] Limite de frequência: no máximo 2 notificações por semana, além do "Como foi?".

**Critérios de saída**
- [ ] Cada notificação dispara no horário certo (testar adiantando o agendamento) e abre a tela certa.

---

## Fase 13 — Prontidão do MVP 🧭 ARCH ⚡ VRN

**Observabilidade**
- [ ] Error boundary global com tela de erro amigável e botão "tentar de novo".
- [ ] Crash reporting conforme D14 (EAS Observe ou Sentry).
- [ ] `services/analytics` → tabela `events` (ou a ferramenta definida em D14). Só estes eventos: `onboarding_done`, `location_permission` (aceita/negada), `suggestion_requested`, `suggestion_other` (+ motivo), `go_tapped`, `stamp_created`, `feedback_sent`, `report_sent`, `paywall_viewed`, `plus_interest`, `share_tapped`, `notification_opened`, `language_changed`.
- [ ] Views SQL de métricas no Supabase (ver "Métricas do MVP" abaixo).

**Produto**
- [ ] Plus como **fake door** (D13): tela fiel ao protótipo, mas "Assinar o Plus" vira "Quero o Plus — me avisa", que grava em `plus_interest` e mostra um agradecimento. O preço só aparece se o usuário decidir mostrar um valor de teste.
- [ ] "Prefiro esperar" volta para a home e mostra quando a cota renova.

**Qualidade mínima**
- [ ] Acessibilidade básica: leitor de tela nas telas principais e contraste conferido (atenção ao `#3A3200` sobre `#FFD43B`).
- [ ] Revisão de i18n: varredura por strings hardcoded e checagem de layout em en/es.
- [ ] Testar em pelo menos 1 Android e 1 iPhone reais.

**Legal e distribuição**
- [ ] ⛔ Usuário fornece (ou aprova o rascunho de) **Política de Privacidade** e **Termos de Uso**, publicados numa URL pública e linkados no onboarding e em Ajustes.
- [ ] `app.json`: nome "Rolê Aleatório", bundle id / package (D20), ícone, splash `#FFD43B` e `locales`.
- [ ] `eas.json` com os perfis development e preview (variáveis do Supabase por perfil).
- [ ] `expo-updates`/EAS Update configurado no canal `preview`, para corrigir rápido durante o teste.
- [ ] Build de preview e distribuição para o grupo de teste (Android interno / TestFlight), conforme D17.

**Critérios de saída**
- [ ] Testadores instalaram o app e os eventos estão chegando no Supabase.
- [ ] **→ Marco MVP: parar o loop.**

---

## 🏁 Marco MVP — validação (o loop para aqui)

Registrar em **Bloqueios**: "Aguardando validação do MVP". Só retomar com autorização do usuário.

### Métricas do MVP

| Métrica | Pergunta | Meta sugerida |
|---|---|---|
| **⭐ Métrica principal:** % de usuários ativos com ≥ 1 carimbo na semana | O app faz a pessoa sair? | ≥ 40% |
| Conversão sugestão → "Bora" | A sugestão convence? | ≥ 30% |
| Taxa de "Outra" por sugestão | A primeira sugestão acerta? | ≤ 50% |
| Retenção na semana 2 e na semana 4 | A pessoa volta? | ≥ 35% / ≥ 20% |
| Feedback 👍 | O lugar valeu a pena? | ≥ 75% |
| Reports por 100 sugestões | O catálogo é confiável? | ≤ 3 |
| Cliques no Plus (fake door) por usuário que esgotou a cota | Alguém pagaria? | sinal qualitativo |

### Saída do marco
- [ ] Rodar o teste por ~4 semanas com o grupo definido em D17.
- [ ] Coletar as métricas e as entrevistas, e registrar o aprendizado em `docs/MVP_LEARNINGS.md`.
- [ ] Usuário decide: seguir, ajustar ou pivotar, e reordena as fases pós-MVP se precisar.

---

# 🔵 Pós-MVP

## Fase 14 — Plus e monetização real 🧭 ARCH ⚡ VRN

- [ ] ⛔ Usuário decide o provedor de pagamentos e os preços (D3). Exige development build.
- [ ] `services/billing` com interface, mais uma implementação mock para dev.
- [ ] Paywall completo: preço **vindo da loja** e já localizado, Mensal/Anual, **"Restaurar compras"** (exigido pela Apple), links para Termos e Privacidade e o texto de renovação automática exigido pelas lojas.
- [ ] Assinatura validada **no servidor**: webhook do provedor → Edge Function → tabela `subscriptions` → `profiles.plan`. `consume_suggestion()` passa a respeitar o plano do servidor, nunca do cliente.
- [ ] Tratar cancelamento, expiração, reembolso e período de carência.
- [ ] Testes em sandbox (iOS e Android).
- [ ] Avisar quem demonstrou interesse no fake door (`plus_interest`).

## Fase 15 — Conta, backup e múltiplos aparelhos 🧭 ARCH ⚡ VRN

- [ ] Vincular o usuário anônimo a uma conta definitiva (e-mail com link mágico, Apple e Google) **sem perder carimbos**, seguindo o fluxo de vincular identidade do Supabase.
- [ ] **Sign in with Apple** obrigatório no iOS se houver outro login social.
- [ ] Entrar num aparelho novo e recuperar o passaporte.
- [ ] **Exclusão de conta dentro do app** (exigência da Apple), reaproveitando `delete-my-data`.
- [ ] "Exportar meus dados" (direito de acesso da LGPD).
- [ ] Reduzir a burla da cota por reinstalação: incentivar o vínculo de conta e avaliar o rate limit por aparelho.

## Fase 16 — Sugestão mais inteligente 🧭 ARCH ⚡ VRN

- [ ] Mover a recomendação para uma RPC no Postgres com PostGIS (`suggest_place(...)`) quando o catálogo crescer (D16).
- [ ] Usar o feedback (👍/👎) e os motivos de "Outra" para ranquear os lugares.
- [ ] Clima: evitar trilha, mirante e lugares ao ar livre quando houver chuva prevista.
- [ ] Pôr do sol real por data e cidade, em vez do `daylight_cutoff` fixo.
- [ ] Filtros extras: acessível, aceita pet, bom para ir sozinho.
- [ ] (Opcional) Check-in por proximidade antes de carimbar (D6).
- [ ] **Universal links / App Links** com domínio próprio (D15): link compartilhado abre o lugar no app, ou a loja para quem não tem o app.
- [ ] Integração de reserva com parceiros.

## Fase 17 — Turma (social) 🧭 ARCH ⚡ VRN

> A aba existe no protótipo, mas a tela **não foi desenhada**. Depende da Fase 15 (conta).

- [ ] ⛔ Usuário define o escopo (D4): grupos, feed de carimbos dos amigos, convite por link, rolê em grupo? Desenhar antes de implementar.
- [ ] Privacidade: o que os amigos veem (carimbos sim, horário e localização exata não), com controle nos Ajustes.
- [ ] Moderação e denúncia de conteúdo, se houver texto ou foto de usuário.
- [ ] Até lá: placeholder "Em breve" na aba (desde o MVP), já com o dock e `useDockInset()`.

## Fase 18 — Qualidade final ⚡ VRN

- [ ] Testes E2E do fluxo principal (Maestro), rodando em pt-BR e em en.
- [ ] Revisão das traduções en/es por alguém fluente (D11).
- [ ] Acessibilidade completa (leitor de tela em todas as telas e fonte grande).
- [ ] Performance: FlashList onde couber, memoização onde o React Compiler não resolver e medição de TTI.
- [ ] Auditoria de RLS e das Edge Functions; revisar índices e o plano de backup do Supabase.
- [ ] Testes em aparelhos variados (Android de entrada inclusive).

## Fase 19 — Release nas lojas 🧭 ARCH

- [ ] `eas.json` com o perfil production e o projeto Supabase de produção.
- [ ] `app.json`: `locales` com o nome do app e os textos de permissão por idioma; declarar os idiomas suportados no iOS e no Android, conforme o guia de localização do Expo SDK 57.
- [ ] Formulários de privacidade das lojas (App Privacy da Apple e Data safety do Google) coerentes com os eventos coletados.
- [ ] Assets, screenshots e textos das lojas **em cada idioma suportado**.
- [ ] `eas submit` e EAS Update com os canais `preview` e `production`.

---

## Decisões em aberto (o loop **não** decide sozinho)

| # | Decisão | Status / default | Fase |
|---|---|---|---|
| D1 | Lib de estado local | Zustand + persist (AsyncStorage) | 1 |
| D2 | Tema escuro? | Não: app só no tema claro, como no protótipo | 2 |
| D3 | Provedor de pagamento e preços do Plus | — (sugestão: RevenueCat, que tem webhook fácil para o Supabase) | 14 |
| D4 | Escopo da aba Turma | Placeholder "Em breve" | 17 |
| D5 | Backend / banco de dados | ✅ **Decidido: Supabase** | 1 |
| D5b | Como o catálogo é curado | Curadoria própria em planilha → script de importação; manutenção pelo Supabase Studio | 6 |
| D6 | Check-in exige estar no local? | MVP: não (carimbo direto); avaliar no pós-MVP | 16 |
| D7 | Cidade inicial do catálogo | — **(bloqueia a Fase 6)** | 6 |
| D8 | Idiomas suportados no lançamento | pt-BR (base), en, es | 1 |
| D9 | Onde fica o seletor de idioma | Em Ajustes, acessado pelo header do Passaporte | 3 |
| D10 | Moeda muda junto com o idioma? | Não: valores sempre em BRL; só a formatação segue o idioma | 1 |
| D11 | Quem revisa as traduções en/es | — | 18 |
| D12 | Cota no MVP | Ligada (3/semana), contada no Supabase por usuário anônimo. Pedir sugestão exige internet. A burla por reinstalação é aceita no MVP | 4 |
| D13 | Plus no MVP | Fake door "Quero o Plus — me avisa" (mede interesse, sem cobrar) | 13 |
| D14 | Analytics e crash | Eventos na tabela `events` do Supabase + EAS Observe ou Sentry para crash | 13 |
| D15 | Domínio para links compartilháveis / landing | — (MVP: link da loja/landing; universal links no pós-MVP) | 10 / 16 |
| D16 | Onde roda a recomendação | MVP: no cliente, com o catálogo da cidade em cache; RPC com PostGIS quando passar de ~500 lugares | 1 / 16 |
| D17 | Grupo de teste do MVP | 15–30 pessoas da cidade inicial, ~4 semanas | 13 |
| D18 | Projetos Supabase | Local (dev) + 1 remoto para o MVP; projeto de produção separado no pós-MVP | 4 |
| D19 | Regra de segurança "só de dia" | Campo `daylight_only` no lugar + `daylight_cutoff` fixo por cidade (ex.: 18h) | 5 |
| D20 | Bundle id / package name | — (ex.: `com.<seu-nome>.rolealeatorio`) | 13 |

## Bloqueios

_(vazio)_

## Registro de iterações

| Data | Fase | Tarefa | Skills / regras aplicadas | Resultado | Commit |
|---|---|---|---|---|---|
| 2026-10-02 | 0 | Branch `fase/00-preparacao`, `.gitignore` e commits pendentes | `git-commit` (sem atribuição de IA, conforme o plano) | 3 commits: `84ce37b` (.gitignore), `63dfba6` (skills), `c48eb72` (protótipo); plano no commit seguinte | `84ce37b`..`c48eb72` |
| 2026-10-02 | 0 | Scripts `typecheck` e `test` no `package.json` | `git-commit` | Scripts adicionados (`test` = `jest --passWithNoTests`; o jest só é instalado na Fase 2). `tsc` e `expo lint` já falhavam antes, só no demo do template (`animated-icon.web`, `constants/theme.ts`, `use-color-scheme.web.ts`); a próxima tarefa remove esse código | `27ae9df` registrado acima; este commit abaixo |
