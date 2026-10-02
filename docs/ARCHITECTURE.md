# Rolê Aleatório — Arquitetura

> Documento vivo, construído na Fase 1 do `PLANO_DESENVOLVIMENTO.md`. Se a estrutura precisar mudar, **atualize este documento primeiro**.
> Base da arquitetura: skill **`react-native-architecture`** (`.claude/skills/react-native-architecture/`).
> Base das convenções de implementação: skill **`vercel-react-native-skills`** (seção 3, "Convenções de implementação").
> Stack: Expo SDK 57 · Expo Router · React 19.2 · React Native 0.86 · Reanimated 4 · React Compiler · Typed Routes · Supabase.

## 1. Padrões adotados da skill `react-native-architecture`

A skill define seis padrões (`references/details.md`). Esta seção diz o que o projeto adota de cada um e onde se afasta, com o motivo.

| # | Padrão da skill | Decisão no Rolê | Onde é detalhado |
|---|---|---|---|
| 1 | **Expo Router** com rotas por arquivo, grupos `(tabs)`, rotas dinâmicas e `router` para navegar | **Adotado.** Rotas só em `src/app/`. `Link`, `router` e `useLocalSearchParams` vêm de `expo-router`. Typed Routes ligado. A tab bar usa `tabBar` customizado (o dock flutuante), e não os ícones/estilos padrão do `Tabs` | Seção "Navegação" |
| 2 | **Fluxo de autenticação** com provider, `useSegments` e redirecionamento por grupo de rota | **Adaptado.** Não há tela de login: a identidade é a **auth anônima do Supabase** (`signInAnonymously`), silenciosa. O "gate" que a skill faz com `(auth)` vira o **gate de onboarding** no `_layout` raiz. O token **não** vai para `expo-secure-store` à mão: a sessão é persistida pelo client do Supabase, conforme o guia oficial para Expo | Seções "Navegação" e "Supabase" |
| 3 | **Offline-first com React Query**: `PersistQueryClientProvider`, persister em AsyncStorage, `onlineManager` ligado ao NetInfo, `networkMode: 'offlineFirst'`, `gcTime` de 24 h, atualização otimista | **Adotado**, com uma exceção: **pedir sugestão nova exige internet**, porque a cota é consumida no servidor. Carimbos são criados offline (uuid no cliente), entram numa fila e sobem por `upsert` idempotente | Seção "Offline-first" |
| 4 | **Integração de módulos nativos** por uma camada fina em `services/`, com guarda de `Platform.OS` (ex.: `haptics`) | **Adotado.** Nada de `expo-*` direto nas telas: haptics, localização, notificações, compartilhamento e analytics passam por `services/`. Cada serviço some a diferença de plataforma e é mockável nos testes | Seção "Camadas" |
| 5 | **Código específico por plataforma**: `Platform.select` para sombras, arquivos `.ios`/`.android`/`.web`, `Pressable` animado com Reanimated | **Adotado.** `Platform.select` só onde a plataforma realmente difere (ex.: sombra do dock). Preferir `boxShadow` quando o RN 0.86 o suportar nas duas plataformas. Arquivos `.ios.tsx`/`.android.tsx` só como último recurso | Seção "Camadas" |
| 6 | **Performance**: lista com `FlashList`, item memoizado, `keyExtractor` estável, `StyleSheet.create`, Reanimated no thread de UI | **Adotado**, ajustado ao **React Compiler** (ligado no projeto): não espalhar `memo`/`useCallback` por padrão; só onde a medição mostrar necessidade ou o compilador não alcançar. Listas do MVP são curtas (bingo 4×4, 8 semanas), então `FlashList` entra quando houver lista longa | Seção "Convenções de implementação" |

### Estrutura de pastas da skill × deste projeto

A skill propõe `app/`, `components/{ui,features}/`, `hooks/`, `services/`, `stores/`, `utils/` e `types/`. O projeto **mantém essa base** (rotas isoladas em `src/app/`, UI reutilizável separada de componentes de feature, `services` separados de `stores`) e **acrescenta**:

- `domain/`: regras puras e testáveis (recomendação, ofensiva, bingo, horário, segurança), sem React e sem Supabase;
- `lib/`: clients únicos (`supabase.ts`);
- `theme/`: tokens, fontes e tipografia;
- `i18n/`: configuração, formatação e arquivos de idioma.

### Onde a skill e o projeto divergem (e quem prevalece)

| Tema | Skill | Projeto | Motivo |
|---|---|---|---|
| Nome de arquivo | `PascalCase` em componentes (`Button.tsx`), `useX.ts` em hooks (`useTheme.ts`) | **Igual à skill** (decisão do usuário em 02/10/2026); só as rotas de `src/app/` ficam em `kebab-case`, porque viram URL | Sem divergência. Detalhes na seção "Convenções de nomenclatura" do plano |
| Ícones | `lucide-react-native` | **SVG próprios** do protótipo (`react-native-svg`) | Identidade visual do protótipo |
| Imagens | `FastImage` | **`expo-image`** | Recomendado no Expo e sem dependência nativa extra |
| Segredo de sessão | `expo-secure-store` manual | **Sessão do `supabase-js`** persistida (AsyncStorage) | Segue o guia oficial do Supabase para Expo. Avaliar `expo-secure-store` na revisão de segurança (Fase 18) |
| Tema | `useTheme()` com claro/escuro | **Só claro** (decisão D2) | O protótipo existe só no tema claro |
| Tabs | `Tabs` com ícones e cores padrão | **`tabBar` customizado** (dock flutuante) | Visual do protótipo; detalhado no ADR da tab bar |

> Quando a skill e o `docs/ARCHITECTURE.md` aprovado entrarem em conflito, **prevalece este documento**. A divergência é registrada no Registro de iterações do plano.

## 2. Camadas e fluxo de dados (visão geral)

```
 Tela (src/app) ──usa──▶ Hook (src/hooks) ──usa──▶ Service (src/services) ──▶ Supabase / SO
      │                       │                          │
      │                       ├─ estado de servidor: React Query (cache persistido)
      │                       └─ estado local persistido: Zustand + AsyncStorage (src/stores)
      └──────── regras de negócio puras: src/domain (sem React, sem rede)
```

Regras de dependência (da skill, endurecidas para o projeto):

1. **`src/app/` só tem rotas.** Telas são finas: juntam hooks e componentes. Nada de regra de negócio nem de acesso a dados.
2. **Telas e componentes nunca importam o client do Supabase.** Só `services/` o faz (a `lib/supabase.ts` é importada apenas por `services/`).
3. **`domain/` é puro:** não importa React, Expo, Supabase nem `services/`. Recebe dados e devolve dados, por isso é fácil de testar.
4. **`services/` isola o mundo externo** (rede, GPS, notificações, compartilhamento, haptics). Cada serviço expõe uma interface pequena e tem uma versão em memória para teste.
5. **Estado de servidor** (catálogo, carimbos, cota) fica no React Query; **estado local** (preferências, filtros, fila offline) fica em stores persistidos. Nunca duplicar o mesmo dado nos dois.
6. **`components/ui/`** não conhece o domínio (Button, Chip, Pill...). **`components/features/`** conhece o domínio e fala com hooks.

## 3. Convenções de implementação

Base: skill **`vercel-react-native-skills`** (`.claude/skills/vercel-react-native-skills/`, regras em `rules/`). Vale para toda tarefa que escreva ou altere código do app (Fases 2 a 18). As regras são citadas pelo prefixo da skill. Prioridade do projeto: **listas, animação, navegação e UI**. Quando uma regra da skill conflitar com este documento, prevalece este documento (ver "Exceções" no fim da seção).

Contexto técnico que muda a aplicação das regras: **React Compiler ligado** (`app.json` → `reactCompiler: true`), Reanimated 4.5, Gesture Handler 2.32, `expo-image` e `expo-font` já instalados, SDK 57.

### 3.1 Renderização (crítico: evita crash em produção)

- `rendering-text-in-text-component`: todo texto fica dentro de `<Text>`. Nada de string solta dentro de `<View>`.
- `rendering-no-falsy-and`: **nunca** `{valor && <X />}` com string ou número (`0`, `''`). Usar early return, ternário com `null` ou `!!valor`. Contadores (cota restante, número do carimbo, ofensiva) são o caso mais provável de dar errado. Reforçar com `react/jsx-no-leaked-render` no lint, se a regra existir na versão instalada do `eslint-plugin-react`.
- Texto sempre via `t()` (regra do plano) e `Text` do design system (ver 3.7).

### 3.2 Listas (`list-performance-*`)

- **Qualquer lista com tamanho aberto usa virtualizador** (`list-performance-virtualize`): catálogo, lista de carimbos do passaporte, histórico. Escolha do projeto: **FlashList**. Nunca `ScrollView` + `.map()` para dados que crescem.
- **Exceção:** grades de tamanho fixo e pequeno (bingo 4×4, 8 semanas da ofensiva, os 6/4/4 chips do filtro) ficam em `View` com `.map()`. Não há o que virtualizar e o layout em grade é mais simples.
- Itens leves (`list-performance-item-expensive`): sem query, sem cálculo caro, sem vários contextos. O pai busca e calcula; o item recebe **primitivos** (`list-performance-item-memo`) e lê estado dinâmico por seletor do Zustand.
- Referências estáveis (`list-performance-inline-objects`, `list-performance-function-references`, `list-performance-callbacks`): não fazer `map`/`filter` nos dados antes de passar para a lista; transformar dentro do item. `renderItem` fica fora do componente ou é um único callback; o item chama o callback com o `id`.
- Listas heterogêneas usam `getItemType` (`list-performance-item-types`).
- Imagens em lista (`list-performance-images`): pedir tamanho adequado (2× o tamanho exibido) e usar `recyclingKey`. Conferir na Fase 6 se o plano do Supabase oferece transformação de imagem; se não, subir as fotos já redimensionadas (dois tamanhos: card e miniatura).
- Com o React Compiler, **não** espalhar `memo`/`useCallback` por padrão; as regras de referência continuam valendo, porque o compilador não conserta objetos novos criados no pai.

### 3.3 Animação (`animation-*`)

- **Animar só `transform` e `opacity`** (`animation-gpu-properties`). Nada de `width`, `height`, `top`, `margin` nem `padding`. **Sem exceção, inclusive no dock:** o item ativo tem largura constante, então a troca de aba é feita com `translateX` e `opacity` (ver o ADR da tab bar e a tarefa do `FloatingTabBar` no plano).
- Estado real, não valor visual (`state-ground-truth`): o shared value guarda `pressed` (0/1), `activeIndex` ou `progress`; escala, opacidade e cor saem por `interpolate`/`interpolateColor`.
- Valor derivado de outro shared value usa `useDerivedValue`, não `useAnimatedReaction` (`animation-derived-value`). `useAnimatedReaction` fica para efeito colateral (haptic, log).
- **Com o React Compiler: `.get()` e `.set()`, nunca `.value`** (`react-compiler-reanimated-shared-values`).
- Feedback de toque animado (escala ao pressionar) com `GestureDetector` + `Gesture.Tap()` e shared value (`animation-gesture-detector-press`), não com `onPressIn`/`onPressOut`. A chamada de volta ao JS (`runOnJS` na skill) **precisa ser conferida na doc do Reanimated 4 / `react-native-worklets`** antes de usar: a API pode ter sido renomeada (`scheduleOnRN`).
- Posição de scroll nunca em `useState` (`scroll-position-no-state`): shared value com `useAnimatedScrollHandler` ou `ref`.
- Respeitar "reduzir movimento" do sistema nas animações de entrada e de troca de card (ver `useReducedMotion` do Reanimated, a conferir na doc).

### 3.4 Navegação (`navigation-native-navigators`)

- Stack do Expo Router (já nativo) para push e modais; `presentation: 'modal'`/`'fullScreenModal'`, e `formSheet` onde fizer sentido, em vez de bottom sheet em JS (`ui-native-modals`). **Nada de bottom sheet de biblioteca JS.**
- Cabeçalho: usar as opções nativas do `Stack.Screen` quando o visual do protótipo permitir. As telas do Rolê têm cabeçalho próprio desenhado no conteúdo (logo, voltar, pílulas); nesses casos `headerShown: false` e o cabeçalho é um componente de `ui/`.
- **Tabs: exceção** ao "native tabs" da skill, porque o dock flutuante exige `tabBar` customizado (ver 3.8 e o ADR da tab bar).
- Menus e seletores: usar menu nativo (`ui-menus`, zeego) se um dia houver dropdown. No MVP o seletor de idioma é uma lista de linhas em Ajustes, sem menu.

### 3.5 UI (`ui-*`)

- **`expo-image`** para toda imagem (`ui-expo-image`): `placeholder` (o estilo listrado do protótipo vira o placeholder de cor), `contentFit="cover"`, `transition`. Nunca o `Image` do `react-native`.
- **`Pressable`**, nunca `TouchableOpacity`/`TouchableHighlight` (`ui-pressable`). Alvo de toque ≥ 44.
- Estilo (`ui-styling`): `StyleSheet.create` e tokens do tema (regra do plano), mais:
  - `borderCurve: 'continuous'` sempre que houver `borderRadius`;
  - `gap` no pai em vez de margem nos filhos; `padding` para espaço interno;
  - `boxShadow` (string CSS) em vez de `shadow*`/`elevation`; o `shadow.dock` do protótipo vira `boxShadow` com as duas camadas. Conferir o resultado no Android (critério 👀 da Fase 2);
  - degradê com `experimental_backgroundImage`, sem biblioteca de gradiente. Se o protótipo não usa degradê, não há o que fazer.
  - A regra "evitar vários tamanhos de fonte" (`ui-styling`) **vale para corpo e rótulos**: só **4 tamanhos** (12, 14, 16 e 20), com hierarquia por peso e cor dentro do mesmo tamanho. A **exceção** são os tamanhos de display do protótipo (28, 32, 34, 38, 44, 50 e 64), mantidos como identidade visual. Tudo em `theme/typography.ts` (ver 3.9).
- Safe area (`ui-safe-area-scroll`, `ui-scrollview-content-inset`): usar `contentInsetAdjustmentBehavior="automatic"` no scroll raiz **no iOS**. O recuo do dock (`useDockInset()`) é **padding estático** no `contentContainerStyle`, e não `contentInset`, porque `contentInset` só existe no iOS e o dock precisa funcionar igual no Android.
- Medição de tamanho (`ui-measure-views`): `onLayout` (e `useLayoutEffect` com `getBoundingClientRect`, disponível no RN 0.86), com updater para comparar antes de atualizar o estado. Nunca `measure()`.
- Galeria de imagem em tela cheia (`ui-image-gallery`): fora do escopo do MVP; se surgir, `@nandorojo/galeria`.

### 3.6 Estado e React Compiler (`react-state-*`, `react-compiler-*`, `state-ground-truth`)

- **Estado mínimo** (`react-state-minimize`): o que dá para calcular no render não vira `useState` (ex.: filtro resumido, `remaining`, progresso da meta, células do bingo). Nada de `useEffect` só para copiar estado.
- **Fallback em vez de valor inicial** (`react-state-fallback`): a escolha do usuário começa `undefined` e a tela usa `escolha ?? padrão`. Serve para os filtros do Rolê (humor, tempo, orçamento) e para o idioma (`undefined` = "Idioma do aparelho").
- **Updater** quando o próximo estado depende do atual (`react-state-dispatcher`): `setX(prev => ...)`.
- **Com o React Compiler, desestruturar funções cedo** (`react-compiler-destructure-functions`): `const { push } = useRouter()`, e não `router.push(...)` espalhado.
- **Zustand com seletor** (`useStore(s => s.x)`), nunca o store inteiro; vale também fora de listas. Contexto React só para dado quase estático (provider de i18n, sessão).
- Estado de servidor no React Query, estado local persistido no Zustand, sem duplicar (regra 5 da seção 2).

### 3.7 Design system (`design-system-*`, `imports-design-system-folder`)

- **Importar do design system, não do pacote:** telas e componentes de feature importam `Text`, botões, ícones etc. de `@/components/ui/...`, e não diretamente de bibliotecas de terceiros quando houver wrapper (ex.: `Text` com variantes de tipografia). Começa só reexportando e evolui sem mexer nas telas.
- **Composição explícita** (`design-system-compound-components`): componente que aceita string é um componente de texto. `Button` com ícone e texto usa `Button` + `ButtonText` + `ButtonIcon`. Componentes só de texto (`Chip`, `Pill`, `SectionLabel`) recebem uma prop `label: string`, sem `children` polimórfico.
- `ui/` não conhece o domínio; recebe valores e callbacks prontos.

### 3.8 Fontes, Intl e demais

- **Intl** (`js-hoist-intl`): `Intl.DateTimeFormat`, `NumberFormat`, `PluralRules` e afins nunca são criados dentro do render nem de laço. `i18n/format.ts` guarda os formatadores em um cache por idioma (módulo), reaproveitado entre chamadas.
- **Fontes** (`fonts-config-plugin`): a skill prefere o config plugin do `expo-font` (fonte embarcada no build). O plano pede `useFonts` + splash segurada na Fase 2, o que **funciona no Expo Go**. Decisão: começar com `useFonts` e a splash, e **migrar para o config plugin na Fase 13** (build de distribuição), quando já houver development build. Registrado nas exceções.
- **Monorepo** (`monorepo-*`): não se aplica (app único).

### 3.9 Exceções e decisões que divergem da skill

| Regra da skill | Decisão no projeto | Motivo |
|---|---|---|
| `navigation-native-navigators` (tabs nativas) | `tabBar` customizado com o dock flutuante | Visual do protótipo; `NativeTabs` não permite |
| `fonts-config-plugin` | `useFonts` + splash até a Fase 13 | Compatível com Expo Go e mais simples de iterar |
| `ui-scrollview-content-inset` (`contentInset`) | Padding estático para o recuo do dock | `contentInset` é só iOS |
| `ui-styling` (poucos tamanhos de fonte) | **Exceção parcial:** só os tamanhos de display (28–64) fogem da regra; corpo e rótulos usam 4 tamanhos (12, 14, 16, 20) | Os títulos grandes são a identidade do protótipo; no corpo, os tamanhos vizinhos (12/13, 14/15, 16/17, 18–21) eram quase indistinguíveis |
| `list-performance-virtualize` (virtualizar tudo) | Grades fixas e pequenas ficam em `View` | Nada a virtualizar; layout em grade mais simples |
| `list-performance-item-memo`/`callbacks` (`memo`, `useCallback`) | Não usar por padrão | React Compiler ligado |

Divergências novas devem entrar nesta tabela e no Registro de iterações do plano.

## 4. Estrutura de pastas

Base da skill `react-native-architecture` (`app/`, `components/{ui,features}/`, `hooks/`, `services/`, `stores/`, `utils/`, `types/`), validada contra ela e acrescida de `domain/`, `lib/`, `providers/`, `theme/` e `i18n/` (seção 1). O grupo `(auth)` da skill **não existe** aqui: não há login (auth anônima). Hoje só existem `src/app/_layout.tsx` e `src/app/index.tsx`; as demais pastas são criadas na tarefa "Criar as pastas vazias" desta fase.

### 4.1 Árvore

```
supabase/                          # SEM CLI: tudo aqui o usuário aplica no dashboard
├── sql/                           # 001_initial_schema.sql … 005_*.sql, seed_dev.sql (em ordem)
├── functions/<nome-em-kebab>/     # Edge Functions (delete-my-data/index.ts), coladas no editor do dashboard
├── checks/                        # checagens SQL que devolvem (test, ok)
└── APPLIED.md                     # script × projeto (role-dev / role-mvp) × data
tests/
└── db/                            # integração contra o role-dev (npm run test:db)
scripts/
└── catalog/                       # template.csv, validate.ts, buildCsv.ts (sem service role)
docs/                              # ARCHITECTURE.md, SUPABASE_SETUP.md, CURATION.md...
src/
├── app/                           # SOMENTE rotas (Expo Router). Nomes em kebab-case: viram URL
│   ├── _layout.tsx                # providers + Stack raiz + gate de onboarding
│   ├── +not-found.tsx             # rota inexistente (deep link inválido)
│   ├── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx            # <Tabs tabBar={FloatingTabBar}>
│   │   ├── index.tsx              # Rolê (home)
│   │   ├── passport.tsx
│   │   └── crew.tsx               # Turma (placeholder "Em breve")
│   ├── suggestion.tsx             # push
│   ├── place/[id].tsx             # deep link role://place/<id>
│   ├── stamp.tsx                  # fullScreenModal
│   ├── feedback.tsx               # modal ("Como foi?")
│   ├── report-problem.tsx         # modal
│   ├── plus.tsx                   # modal (paywall / fake door)
│   └── settings.tsx               # modal (idioma, notificações, privacidade, apagar dados)
├── components/
│   ├── ui/                        # genéricos, sem domínio
│   │   ├── Button.tsx  Chip.tsx  Pill.tsx  Card.tsx  Text.tsx  FloatingTabBar.tsx ...
│   │   └── icons/                 # Logo.tsx, Bolt.tsx, Compass.tsx ... (react-native-svg)
│   └── features/                  # conhecem o domínio, falam com hooks
│       ├── home/  suggestion/  stamp/  passport/  plus/  settings/  feedback/  onboarding/
├── hooks/                         # useQuota.ts, useStreak.ts, useSuggestion.ts, usePlaces.ts, useLanguage.ts, useDockInset.ts
├── providers/                     # QueryProvider.tsx, I18nProvider.tsx, AuthProvider.tsx
├── lib/
│   └── supabase.ts                # client único; importado só por services/
├── services/                      # uma pasta por assunto; cada uma com index.ts como entrada pública
│   ├── places/                    # placesRepository.ts (interface), supabasePlacesRepository.ts, inMemoryPlacesRepository.ts, index.ts
│   ├── stamps/  quota/  feedback/  reports/  analytics/
│   └── location.ts  notifications.ts  share.ts  haptics.ts   # módulos nativos: um arquivo cada
├── stores/                        # Zustand + AsyncStorage: preferencesStore.ts, syncQueueStore.ts, passportCacheStore.ts
├── domain/                        # regras puras: recommend.ts, streak.ts, bingo.ts, monthlyGoal.ts, openingHours.ts, safety.ts
├── theme/                         # tokens.ts, typography.ts, fonts.ts
├── i18n/
│   ├── index.ts                   # init do i18next + idioma do aparelho
│   ├── format.ts                  # Intl (cache por idioma)
│   └── locales/                   # pt-BR.json (base), en.json, es.json
├── types/                         # database.ts (Supabase) + tipos de domínio
└── utils/                         # helpers genéricos sem domínio (ex.: uuid.ts, clamp.ts)
```

Testes ficam **ao lado do arquivo testado** (`streak.test.ts`, `FloatingTabBar.test.tsx`); só a integração do banco fica em `tests/db/`. O alias `@/*` → `src/*` já existe no `tsconfig.json` (assim como `@/assets/*` → `assets/*`).

### 4.2 Quem pode importar quem

Sentido único, de cima para baixo. Uma seta quebrada é erro de revisão.

| Camada | Pode importar | **Não** pode importar |
|---|---|---|
| `app/` | `components`, `hooks`, `providers`, `theme`, `i18n`, `types` | `services`, `stores`, `lib`, `domain` direto (passa por hook) |
| `components/features/` | `components/ui`, `hooks`, `theme`, `i18n`, `types` | `services`, `lib`, outras `features/` |
| `components/ui/` | `theme`, `i18n`, `types`, `utils` | `hooks` de domínio, `services`, `domain`, `features/` |
| `hooks/` | `services`, `stores`, `domain`, `i18n`, `types`, `utils` | `components`, `app` |
| `providers/` | `services`, `stores`, `lib` (só o necessário para iniciar), `i18n` | `components/features` |
| `services/` | `lib`, `domain`, `types`, `utils` | `hooks`, `components`, `stores`, `app` |
| `stores/` | `types`, `utils` | `services`, `components`, `hooks` |
| `domain/` | só `types` e `utils` | React, Expo, Supabase, `services`, `stores` |
| `lib/`, `theme/`, `utils/`, `types/` | nada do projeto acima deles (`types` pode ser importado por todos) | — |

Notas:

- `app/` usa **hooks**, e é o hook que combina `services` + React Query + `stores` + `domain`. Isso mantém as telas finas.
- `features/` isoladas entre si: o que for compartilhado sobe para `components/ui/` (se genérico) ou vira hook (se tiver regra).
- Sem barris (`index.ts` que reexportam tudo). Barril só em `services/<assunto>/index.ts`, que é a **API pública** do assunto; o restante importa pelo caminho do arquivo, para não puxar código à toa no Metro.
- O `FloatingTabBar` (`ui/`) recebe os itens por props e não importa as rotas; quem liga o dock às rotas é `app/(tabs)/_layout.tsx`.
- Se a regra da tabela for violada por necessidade real, atualizar **primeiro** este documento.

### 4.3 Onde colocar o quê (decisões rápidas)

| Preciso de… | Vai para… |
|---|---|
| Uma regra de negócio ("este lugar está aberto?") | `domain/` (função pura + teste) |
| Chamar o Supabase ou um módulo nativo | `services/` (com versão em memória se for mockável) |
| Estado vindo do servidor (catálogo, carimbos, cota) | hook com React Query em `hooks/` |
| Preferência ou fila offline persistida | `stores/` |
| Um botão ou chip genérico | `components/ui/` |
| Um card de lugar, o ingresso, a grade do bingo | `components/features/<tela>/` |
| Um texto visível | `i18n/locales/*.json` (nunca no componente) |
| Cor, espaço, raio, fonte | `theme/` |
| Uma tela nova | `src/app/<nome-em-kebab>.tsx`, fina, só juntando hooks e componentes |

## 5. Mapa de navegação

Base: skill `react-native-architecture` (padrão 1, Expo Router) e a doc do Expo Router conferida em 02/10/2026 (`router/advanced/modals`, `protected`, `router-settings`, `custom-tabs`, `error-handling`). Typed Routes ligado: todo `href` é tipado, nunca montado por concatenação de string.

### 5.1 Grafo

```
Stack raiz (src/app/_layout.tsx, headerShown: false, anchor: '(tabs)')
│
├─ [guard: onboarding NÃO concluído]
│    └─ onboarding ............................ tela cheia, sem voltar, sem gesto
│
└─ [guard: onboarding concluído]
     ├─ (tabs) ............................... Rolê · Passaporte · Turma (dock flutuante)
     ├─ suggestion ........................... push        (Rolê → Sugestão)
     ├─ place/[id] ........................... push        (deep link; placeholder no MVP)
     ├─ stamp ................................ fullScreenModal (Sugestão "Bora, tô indo" → Carimbo)
     ├─ feedback ............................. modal       ("Como foi?")
     ├─ report-problem ....................... modal       (Sugestão/Carimbo → "Informar problema")
     ├─ plus ................................. modal       (Sugestão "Outra" sem cota → Plus)
     └─ settings ............................. modal       (botão no header do Passaporte)
```

Fluxo principal: `Rolê ──"Me tira da inércia"──▶ suggestion ──"Bora, tô indo"──▶ stamp ──"Ver meu passaporte"──▶ (tabs)/passport`. Ramo: `suggestion ──"Outra" sem cota──▶ plus ──fechar──▶ suggestion`.

### 5.2 Tabela de rotas

| Arquivo (`src/app/`) | URL | Apresentação | Deep link público | Parâmetros | Voltar |
|---|---|---|---|---|---|
| `onboarding.tsx` | `/onboarding` | tela cheia (stack, sem header) | não | — | desligado (`gestureEnabled: false`); sair só concluindo |
| `(tabs)/index.tsx` | `/` | tab | **sim** `role://` | — | sai do app (Android) |
| `(tabs)/passport.tsx` | `/passport` | tab | **sim** `role://passport` | — | volta para a tab anterior |
| `(tabs)/crew.tsx` | `/crew` | tab | não | — | idem |
| `suggestion.tsx` | `/suggestion` | push | **sim** `role://suggestion` | nenhum: o filtro (humor, tempo, orçamento) vem do store de preferências | volta para o Rolê |
| `place/[id].tsx` | `/place/<id>` | push | **sim** `role://place/<id>` | `id` (uuid do lugar) | volta para o Rolê (âncora) |
| `stamp.tsx` | `/stamp?stampId=<uuid>` | `fullScreenModal` | não | `stampId`: o carimbo já existe no aparelho (criado offline, ver a seção de offline) | gesto desligado; sai por "Ver meu passaporte" ou fechar |
| `feedback.tsx` | `/feedback?stampId=<uuid>` | `modal` | não | `stampId` | gesto de fechar ligado; nunca bloqueia |
| `report-problem.tsx` | `/report-problem?placeId=<uuid>` | `modal` | não | `placeId` | gesto de fechar ligado |
| `plus.tsx` | `/plus?source=<origem>` | `modal` | não | `source` (`quota`/`settings`, para métrica) | gesto de fechar ligado |
| `settings.tsx` | `/settings` | `modal` | não | — | gesto de fechar ligado |
| `+not-found.tsx` | qualquer URL sem rota | — | — | — | link para `/` |

Regras:

1. **Cabeçalho nativo desligado em tudo** (`headerShown: false`): cada tela desenha o próprio topo com componentes de `ui/` (seção 3.4).
2. **Rota interna aberta por link sem parâmetro** (ex.: `role://stamp`): a tela detecta o parâmetro ausente e faz `<Redirect href="/" />`. Nada de crash nem tela vazia.
3. **Parâmetros carregam só identificadores**, nunca objetos nem dados do usuário. O dado vem do hook (React Query ou store) a partir do `id`.
4. **Localização nunca vai na URL.**
5. Modais cobrem o dock porque ficam no Stack raiz, acima de `(tabs)`; o `suggestion` (push) também cobre o dock. Só as três tabs mostram o dock.
6. `fullScreenModal` no Android cai para `modal` (comportamento do Expo Router); o `stamp` precisa ficar correto nos dois, então não depende do tipo de apresentação para o visual (fundo azul próprio, ocupando a tela inteira).
7. Esquema `role://` já está no `app.json` (`"scheme": "role"`). Links universais (`https://`) ficam para o pós-MVP, porque exigem domínio.

### 5.3 Gate de onboarding

- **Mecanismo:** `Stack.Protected` com `guard` no `_layout.tsx` raiz, como na doc do Expo Router: `onboarding` protegido por `!onboardingDone` e as demais rotas por `onboardingDone`. Não usar `<Redirect>` espalhado pelas telas.
- **Fonte da flag:** `onboardingDone` no store de preferências (persistido em AsyncStorage). A flag só é lida **depois da reidratação** do store: a splash fica segurada (`SplashScreen.preventAutoHideAsync`) até terminarem a reidratação, as fontes e o init do i18n. Sem isso, o app piscaria o onboarding antes de abrir o Rolê.
- **Concluir o onboarding:** gravar `onboardingDone = true`. O guard muda e o Expo Router leva sozinho à âncora `(tabs)`, removendo `onboarding` do histórico (comportamento documentado do `Stack.Protected`).
- **Âncora:** `export const unstable_settings = { anchor: '(tabs)' }` no `_layout.tsx` raiz. Assim, um deep link para `/suggestion` ou `/place/<id>` abre com o Rolê por baixo, e o voltar funciona.
- **Deep link antes do onboarding:** cai no `onboarding` (primeira tela disponível) e, depois de concluir, vai ao Rolê; **o destino do link é descartado**. Aceito no MVP, porque o link só chega a quem já instalou e abriu o app.
- **Limite da doc do SDK 57:** a opção `redirectTo` do `Stack.Protected` é do SDK 58+. Aqui vale o redirecionamento padrão (âncora/primeira tela), que atende ao fluxo acima.
- **A auth anônima não entra no gate.** `signInAnonymously` roda em segundo plano (AuthProvider) e nunca bloqueia o onboarding nem o Rolê. Telas que dependem de sessão (cota, carimbos no servidor) tratam "sessão ainda não pronta" como estado de carregamento ou offline.

### 5.4 Tabs

- Grupo `(tabs)` com três rotas: `index` (Rolê), `passport`, `crew`. Aba inicial: `index`.
- O dock flutuante **não** usa `NativeTabs`. Como ele é montado (propriedade `tabBar` das tabs JS do Expo Router, ou os componentes `Tabs`/`TabList`/`TabTrigger`/`TabSlot` de `expo-router/ui`, que a doc mostra com uma barra flutuante) é decidido no **ADR da tab bar**, na próxima seção desta fase. O mapa de navegação não muda com essa escolha.
- Cada tela de tab aplica `useDockInset()` no conteúdo, porque o dock fica por cima.

### 5.5 Erros e rotas inexistentes

- **`+not-found.tsx`** personalizado: texto via `t()`, visual do app e botão que leva a `/`.
- **`ErrorBoundary`** exportado pelo `_layout.tsx` raiz (padrão do Expo Router: o erro de uma rota sobe para o `ErrorBoundary` mais próximo): tela com mensagem traduzida e botão "Tentar de novo" (`retry`). Erros de rede **não** passam por aqui; viram estado `offline`/`error` da própria tela.

### 5.6 Pontos que ficam para a implementação (conferir na doc antes de usar)

Não decididos aqui porque dependem de API que precisa ser lida na doc do SDK 57 na hora de codar:

- como fechar `stamp` e `suggestion` de uma vez e cair em `/passport` (`dismissAll`, `dismissTo` ou `navigate` com reset): Fase 10;
- `sheetAllowedDetents` e `formSheet` para `feedback`/`report-problem`, se o design pedir uma folha parcial em vez de modal cheio (limitação do Android: sem header nativo nem stack aninhado dentro de formSheet);
- teste dos deep links com `npx uri-scheme open role://... ` feito pelo usuário (👀) na Fase 3.

## 6. Itens detalhados nas próximas tarefas da Fase 1

Esta seção é um índice. Cada item abaixo é uma tarefa própria do plano e vira uma seção deste documento quando for feita:

- ADR da tab bar (dock flutuante) e `useDockInset()`
- ADR da estratégia de estado
- ADR da arquitetura Supabase
- Estratégia offline-first
- Estratégia de i18n
- Estratégia de testes
- Ambientes e segredos
- Dependências planejadas
- Convenções de nomenclatura
- Decisões em aberto
