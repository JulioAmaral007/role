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
│       ├── home/  suggestion/  stamp/  passport/  plus/  settings/  feedback/  onboarding/  navigation/
├── hooks/                         # useQuota.ts, useStreak.ts, useSuggestion.ts, usePlaces.ts, useLanguage.ts, useDockInset.ts
├── providers/                     # QueryProvider.tsx, I18nProvider.tsx, AuthProvider.tsx
├── lib/
│   └── supabase.ts                # client único; importado só por services/
├── services/                      # uma pasta por assunto; cada uma com index.ts como entrada pública
│   ├── places/                    # placesRepository.ts (interface), supabasePlacesRepository.ts, inMemoryPlacesRepository.ts, index.ts
│   ├── stamps/  quota/  feedback/  reports/  analytics/
│   └── location.ts  notifications.ts  share.ts  haptics.ts   # módulos nativos: um arquivo cada
├── stores/                        # Zustand + AsyncStorage: preferencesStore.ts, syncQueueStore.ts, suggestionSessionStore.ts (ver ADR da seção 7)
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
- O `FloatingTabBar` (`ui/`) recebe os itens por props e não importa as rotas nem o React Navigation; quem liga o dock às rotas é o adaptador `components/features/navigation/AppTabBar.tsx`, usado por `app/(tabs)/_layout.tsx` (ADR da seção 6).
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
- O dock flutuante **não** usa `NativeTabs`. A decisão está no **ADR da tab bar** (seção 6): tabs JS de `expo-router/js-tabs` com a prop `tabBar` customizada.
- Cada tela de tab aplica `useDockInset()` no conteúdo, porque o dock fica por cima.

### 5.5 Erros e rotas inexistentes

- **`+not-found.tsx`** personalizado: texto via `t()`, visual do app e botão que leva a `/`.
- **`ErrorBoundary`** exportado pelo `_layout.tsx` raiz (padrão do Expo Router: o erro de uma rota sobe para o `ErrorBoundary` mais próximo): tela com mensagem traduzida e botão "Tentar de novo" (`retry`). Erros de rede **não** passam por aqui; viram estado `offline`/`error` da própria tela.

### 5.6 Pontos que ficam para a implementação (conferir na doc antes de usar)

Não decididos aqui porque dependem de API que precisa ser lida na doc do SDK 57 na hora de codar:

- como fechar `stamp` e `suggestion` de uma vez e cair em `/passport` (`dismissAll`, `dismissTo` ou `navigate` com reset): Fase 10;
- `sheetAllowedDetents` e `formSheet` para `feedback`/`report-problem`, se o design pedir uma folha parcial em vez de modal cheio (limitação do Android: sem header nativo nem stack aninhado dentro de formSheet);
- teste dos deep links com `npx uri-scheme open role://... ` feito pelo usuário (👀) na Fase 3.

## 6. ADR — Tab bar (dock flutuante) e recuo inferior

**Status:** aceito em 02/10/2026. **Contexto:** o protótipo tem uma pílula flutuante `ink` sobre o conteúdo (seção "Tab bar — dock flutuante" do plano). API conferida **nos tipos instalados** do `expo-router` 57.0.24 (`node_modules/expo-router/build/...`), porque a doc online não detalha a prop `tabBar`.

### 6.1 Opções avaliadas

| Opção | Resultado |
|---|---|
| **A. Tabs JS do Expo Router com `tabBar` customizado** | **Escolhida.** `BottomTabNavigationOptions` tem `tabBar?: (props: BottomTabBarProps) => ReactNode`, com `BottomTabBarProps = { state, descriptors, navigation, insets }`. Mantém estado e histórico por aba, evento `tabPress` com `preventDefault`, `lazy` e as opções por tela (`title`, `sceneStyle`, `tabBarAccessibilityLabel`) |
| B. Tabs "headless" de `expo-router/ui` (`Tabs`, `TabList`, `TabTrigger`, `TabSlot`) | Serve (a doc mostra até uma barra flutuante), mas cada trigger exige `href`, o estado "ativo" vem só por `asChild`/`isFocused` e não há `descriptors`. Mais código manual para o mesmo resultado. **Reserva** se a opção A mudar de API |
| C. `NativeTabs` (tab bar nativa) | **Descartada.** Não permite a pílula flutuante, o item ativo expandido nem o fundo `ink` |

Isso é a exceção já registrada à regra `navigation-native-navigators` (seção 3.9).

### 6.2 Decisões

1. **Import:** `import { Tabs } from 'expo-router/js-tabs'`. O `Tabs` exportado direto de `expo-router` está marcado como **`@deprecated` no SDK 57**. O tipo `BottomTabBarProps` sai do mesmo módulo (`export *` de `layouts/Tabs`).
2. **Dois componentes, para a regra de camadas da seção 4.2:**
   - `components/ui/FloatingTabBar.tsx`: **puro**, não conhece Expo Router nem React Navigation. Props: `items` (`{ key, label, icon, accessibilityLabel }[]`), `activeIndex`, `bottomInset`, `onPress(index)`, `onLongPress?(index)`. Concentra o visual, a animação e a acessibilidade; é testável sozinho.
   - `components/features/navigation/AppTabBar.tsx`: **adaptador**. Recebe `BottomTabBarProps`, monta os `items` (ícone por nome de rota, `label` vindo de `descriptors[route.key].options.title`, já traduzido) e liga `onPress` ao padrão do React Navigation: emitir `tabPress` com `canPreventDefault` e, se a aba não estiver em foco e o evento não tiver sido cancelado, navegar para a rota. Usa `insets.bottom` das props. Se o SDK 58 mudar a API, só este arquivo muda.
3. **`app/(tabs)/_layout.tsx`:**
   ```tsx
   <Tabs
     tabBar={(props) => <AppTabBar {...props} />}
     screenOptions={{ headerShown: false }}
   >
     <Tabs.Screen name="index"    options={{ title: t('tabs.home'),     sceneStyle: { backgroundColor: colors.yellow } }} />
     <Tabs.Screen name="passport" options={{ title: t('tabs.passport'), sceneStyle: { backgroundColor: colors.cream } }} />
     <Tabs.Screen name="crew"     options={{ title: t('tabs.crew'),     sceneStyle: { backgroundColor: colors.yellow } }} />
   </Tabs>
   ```
   O layout usa `useTranslation()`, então os títulos (e o dock) se atualizam ao trocar o idioma. `sceneStyle` dá o fundo por aba, sem faixa de outra cor atrás do dock.
4. **O dock é `position: 'absolute'` dentro do contêiner das tabs.** Pela implementação do `BottomTabView` (coluna: telas com `flex: 1`, depois a barra), uma barra absoluta fica **por cima** das telas, sem encolhê-las. Posição: `left`/`right` 20, `bottom` = 22 + `insets.bottom`.
5. **Recuo inferior: `useDockInset()`** (`src/hooks/useDockInset.ts`) devolve `DOCK_BASE_INSET + insets.bottom`, com `DOCK_BASE_INSET = 106` (52 do item + 12 de padding + 22 de margem + 20 de folga) e `insets` de `useSafeAreaInsets()`. **Não** usar `useBottomTabBarHeight()`: a barra customizada e absoluta não registra altura útil, e o hook só funciona dentro de tabs. A constante e a altura/margem do dock vêm do mesmo lugar (`theme/tokens.ts`), para não divergirem.
6. **Como o recuo é aplicado:** `contentContainerStyle={{ paddingBottom: dockInset }}` no scroll da tela (seção 3.5: padding estático, não `contentInset`). Telas sem scroll somam o valor ao padding inferior do contêiner.
7. **Animação** (detalhada na tarefa do `FloatingTabBar`, Fase 2): só `transform` e `opacity`, largura do item ativo constante, um shared value `activeIndex` como fonte de verdade, sincronizado a partir de `state.index` (`.set()`/`.get()`, React Compiler). Medir a largura útil uma vez com `onLayout`.
8. **Acessibilidade:** contêiner com `accessibilityRole="tablist"`; cada item `accessibilityRole="tab"`, `accessibilityState={{ selected }}` e `accessibilityLabel` traduzido (nos inativos, só ícone, é o único nome). Alvo de toque ≥ 44 (itens têm 52).
9. **Ícones por rota** ficam num mapa tipado no adaptador (`Record<'index' | 'passport' | 'crew', IconComponent>`), então uma rota nova sem ícone quebra o `tsc`.
10. **Dock só nas três abas.** Push (`suggestion`, `place/[id]`) e modais ficam no Stack raiz, acima de `(tabs)`, e cobrem o dock sem código extra (seção 5.2).

### 6.3 Riscos e como foram tratados

| Risco | Tratamento |
|---|---|
| API de `tabBar` mudar no próximo SDK | Isolada em `AppTabBar`; `FloatingTabBar` não depende dela. Reserva: opção B |
| Sombra do dock diferente no Android | `boxShadow` com as duas camadas do protótipo; conferir no critério 👀 da Fase 2 |
| Label maior em en/es estourar o item ativo | Largura ativa constante (202 em 390): teste de layout com o maior label entre idiomas ("Passaporte"/"Passport"/"Pasaporte") |
| Conteúdo escondido atrás do dock | `useDockInset()` obrigatório em toda tela de aba |
| Aparelho com largura bem menor | A largura ativa sai da largura medida (`338 − 128 − 8` em 390); mínimo a validar no 👀 |

## 7. ADR — Estratégia de estado

**Status:** aceito em 02/10/2026. **Base:** skill `react-native-architecture` (padrão 3, React Query offline-first), regras `react-state-*` e `state-ground-truth` da `vercel-react-native-skills` (seção 3.6) e a doc atual do Zustand v5 (`persist`, `createJSONStorage`, hidratação).

### 7.1 Decisão

| Tipo de estado | Ferramenta | Exemplos |
|---|---|---|
| **Servidor** (a verdade está no Supabase) | **React Query** (`@tanstack/react-query` + persister em AsyncStorage) | catálogo da cidade, carimbos, cota |
| **Local persistido** (a verdade está no aparelho) | **Zustand v5** com o middleware `persist` + `AsyncStorage` | idioma, onboarding, filtros do Rolê, fila offline de carimbos |
| **Local efêmero** (some ao fechar o app) | **Zustand sem `persist`** ou `useState` | lugares já vistos na sessão, lugar atual da sugestão |
| **De tela** (um componente só) | `useState`/`useReducer` | chip em foco, modal aberto |
| **Derivado** | **calculado no render ou no hook**, nunca guardado | cota restante, ofensiva, progresso da meta, células do bingo, resumo do filtro |

Regra de ouro (seção 2, regra 5): **o mesmo dado nunca vive em dois lugares**. Se vem do servidor, é do React Query; o store não faz cópia dele.

### 7.2 Por que Zustand (e não outra coisa)

| Alternativa | Por que não |
|---|---|
| Context + `useReducer` | Todo consumidor re-renderiza a cada mudança; ruim para listas e para o dock. Fica só para dado quase estático (i18n, sessão) |
| Redux Toolkit | Mais cerimônia do que o app precisa (3 stores pequenos); sem ganho para o MVP |
| Jotai | Bom, mas a persistência e o modelo de "um store por assunto" casam melhor com Zustand; a skill e as regras de lista já citam seletores do Zustand |
| MMKV | Módulo nativo: exige development build e não roda no Expo Go. A leitura síncrona não compensa agora |
| `expo-sqlite/kv-store` | Existe como substituto do AsyncStorage no SDK 57 (inclusive com API síncrona, e roda no Expo Go), mas adiciona um módulo. **Reserva:** se a hidratação assíncrona do AsyncStorage causar atraso perceptível na abertura, trocar o `storage` do `persist` por ele, sem mudar mais nada |

Zustand v5 + `persist` é pequeno, tipado, usa seletor por padrão (regra `list-performance-item-expensive` e `react-state-minimize`) e funciona bem com o React Compiler.

### 7.3 Stores do MVP (`src/stores/`)

| Store (arquivo) | Persistido? | Conteúdo |
|---|---|---|
| `preferencesStore.ts` | **sim** (`role.preferences`, `version: 1`) | `language` (`'system'` \| `'pt-BR'` \| `'en'` \| `'es'`; começa `'system'`), `onboardingDone`, `mood`/`timeSlot`/`budget` (começam `undefined`, regra `react-state-fallback`), preferências de notificação |
| `syncQueueStore.ts` | **sim** (`role.syncQueue`, `version: 1`) | fila de carimbos ainda não enviados: `{ id (uuid), placeId, number, stampedAt, attempts }[]`, com `enqueue`, `acknowledge(id)` e `markFailed(id)` |
| `suggestionSessionStore.ts` | **não** | ids de lugares já mostrados nesta sessão (para "sortear sem repetir") e o lugar atual |

Observações:

- **Sem `passportCacheStore`.** A árvore inicial previa um cache do passaporte em store; ele **duplicaria** os carimbos que já ficam no cache persistido do React Query. O passaporte offline vem do cache do React Query **mais** os itens pendentes da `syncQueueStore`, juntados por um hook (`usePassport`) com `domain/`.
- **Localização não é persistida.** As coordenadas ficam só em memória (hook de localização), nunca em store persistido nem enviadas ao servidor (regra de privacidade do plano).
- O idioma efetivo é derivado: `language === 'system' ? idioma do aparelho : language`; o store guarda só a **escolha** do usuário.

### 7.4 Regras de uso do Zustand

1. **Sempre seletor:** `usePreferencesStore((s) => s.language)`. Nunca ler o store inteiro. Seletor que devolve objeto ou array novo usa `useShallow` (obrigatório no v5, senão há re-render em laço).
2. **Ações no próprio store**, nomeadas por intenção (`setLanguage`, `completeOnboarding`, `enqueueStamp`), e não `set` solto nas telas.
3. **`partialize`** para persistir só dados, nunca funções nem estado transitório (`_hasHydrated`).
4. **Versionar:** `version` + `migrate` em todo store persistido. Mudar o formato sem migração é erro de revisão.
5. **Camadas (seção 4.2):** `stores/` só importa `types` e `utils`. **Não** chama `services/`. Quem une fila + rede é um hook (`useSyncQueue`), que pode importar `services` e `stores`.
6. **Em listas:** o item lê o que precisa por seletor, em vez de receber do pai (seção 3.2).
7. **Testes:** o estado se inspeciona e se reseta com `getState()`/`setState()`; o `AsyncStorage` entra com o mock oficial do pacote.

### 7.5 Hidratação (o ponto sensível do `persist` com storage assíncrono)

A doc do Zustand avisa que, com storage assíncrono, o store **não está hidratado no primeiro render** e mostraria os valores iniciais antes dos persistidos. Para o Rolê isso quebraria o gate de onboarding e o idioma. Decisão:

- cada store persistido expõe se já hidratou (`persist.hasHydrated()` e `persist.onFinishHydration()`), encapsulado em um hook `useStoresHydrated()`;
- o `_layout.tsx` raiz **mantém a splash** (`SplashScreen.preventAutoHideAsync`) até: store(s) hidratados, fontes carregadas e i18n inicializado (seção 5.3);
- nenhum componente decide nada com base em valor de store antes disso.

### 7.6 Estado de servidor (React Query): contrato

O detalhe de cache e de offline fica na tarefa da estratégia offline-first; aqui só o contrato de uso:

- **Chaves em uma fábrica** (`queryKeys.places(cityId, locale)`, `queryKeys.stamps(userId)`, `queryKeys.quota(userId)`), sempre com o **idioma** onde o conteúdo é traduzido.
- Leitura vive em **hooks de `hooks/`** (`usePlaces`, `useStamps`, `useQuota`) que chamam `services/`; a tela nunca chama `useQuery` direto.
- **Cota é autoridade do servidor:** `consume_suggestion()` é uma mutação **sem** atualização otimista; a UI espera a resposta.
- **Carimbo é otimista por fila:** grava na `syncQueueStore` e aparece já no passaporte; o envio é `upsert` idempotente, e o sucesso remove o item da fila e invalida `stamps`.
- Dados derivados do servidor (`useStreak`, `useBingo`, `useMonthlyGoal`) são hooks que aplicam `domain/` sobre o resultado do React Query; **não** são salvos em store.

### 7.7 Riscos

| Risco | Tratamento |
|---|---|
| Piscar de tela por hidratação assíncrona | Splash segurada até hidratar (7.5); reserva `expo-sqlite/kv-store` |
| Formato do store mudar entre versões do app | `version` + `migrate` obrigatórios (7.4, regra 4) |
| Fila offline crescer sem controle | `attempts` por item e teto a definir na estratégia offline (descartar ou alertar ao passar do limite) |
| Duplicar dado entre React Query e store | Regra de ouro (7.1) e remoção do `passportCacheStore` |

## 8. ADR — Arquitetura Supabase

**Status:** aceito em 02/10/2026. **Base:** skill `react-native-architecture` (fluxo de auth e camada de serviços) e a doc atual do Supabase (quickstart de React Native, tutorial de Expo, Auth anônima, RLS, API keys, Storage, Edge Functions pelo dashboard e referência de `startAutoRefresh`). Os detalhes de API são conferidos de novo na tarefa de implementação (Fase 4), porque o Supabase muda rápido.

### 8.1 Decisão em uma tabela

| Tema | Decisão |
|---|---|
| Operação | **Só pelo dashboard web.** Sem CLI, sem Docker, sem Supabase local |
| Identidade | **Auth anônima** (`signInAnonymously`) na primeira abertura; sem cadastro no MVP |
| Sessão | `supabase-js` com `AsyncStorage`, `autoRefreshToken` e `AppState` |
| Chave no app | **Publishable key** (`sb_publishable_...`), nunca a secret nem a `service_role` |
| Segurança de dados | **RLS em todas as tabelas** + grants mínimos + RPCs `security definer` para o que o cliente não pode escrever |
| Cota | No servidor, por `auth.uid()` e fuso de `profiles.timezone` (D12) |
| Recomendação | No cliente, sobre o catálogo da cidade em cache (D16) |
| Fotos | Storage, bucket público `place-photos` (só leitura), servido com `expo-image` |
| Apagar dados | Edge Function `delete-my-data`, colada no editor do dashboard |

### 8.2 Fluxo de operação (sem CLI)

```
 escrever SQL em supabase/sql/NNN_*.sql ─▶ usuário cola no SQL Editor (role-dev) ─▶ confirma no chat
        ▲                                                                                │
        └─── loop registra em supabase/APPLIED.md ◀─────────────────────────────────────┘
```

- Script aplicado **não se edita**; a mudança vai num script novo. Idempotente sempre que der.
- Mudança feita na UI do dashboard é transcrita pelo loop para um script ou para `docs/SUPABASE_SETUP.md`.
- Tipos: `src/types/database.ts` à mão no início, trocado pelo gerado no dashboard se existir (a doc atual é conferida na Fase 4).
- Ambientes (D18): `role-dev` para desenvolvimento e `test:db`; `role-mvp` recebe todos os scripts de uma vez na Fase 13.

### 8.3 Auth anônima

- **Como funciona (doc atual):** o usuário anônimo recebe o role Postgres `authenticated` e a claim `is_anonymous = true` no JWT. Para o RLS, ele é igual a qualquer usuário logado; `auth.uid()` identifica o aparelho. O role `anon` (sem login) **não tem acesso a nada**: o app sempre loga antes de consultar.
- **Quando loga:** no primeiro render do `AuthProvider` (`providers/AuthProvider.tsx`), em segundo plano, **sem bloquear o onboarding**. Falha de rede → retry com espera crescente e estado `signingIn | ready | error`. Sem sessão, o app mostra só o que não precisa de servidor.
- **Quem chama:** `services/auth` (`ensureSession()`), nunca uma tela. Hooks de dados usam `enabled: !!userId`; o `userId` sai do `AuthProvider`.
- **Política do RLS no MVP:** não há nada exclusivo de usuário permanente, então **não é preciso** policy restritiva por `is_anonymous`. Quando existir conta (Fase 15), `updateUser()` (e-mail) ou `linkIdentity()` (Apple/Google) convertem o **mesmo** `user_id`, e o passaporte continua.
- **Abuso:** o Supabase limita criação de anônimos a **30 por hora por IP** (ajustável no dashboard) e recomenda captcha. No MVP: manter o limite padrão e **subir só se o grupo de teste dividir a mesma rede**; captcha (Turnstile) exige WebView e fica para o pós-MVP (risco aceito, ver 8.10).
- **Limpeza:** o Supabase não apaga anônimos antigos sozinho. Nada a fazer no MVP; se um dia precisar, um script SQL manual que apaga só contas **sem carimbos** e antigas.
- **Custo conhecido:** a sessão vive no aparelho. Desinstalar ou limpar os dados **perde o passaporte** até existir conta (Fase 15). É o mesmo trade-off da D12; o texto de Ajustes e do onboarding não promete "backup entre aparelhos".

### 8.4 Client e sessão (`src/lib/supabase.ts`)

Um único client, importado **só por `services/`** (regra 2 da seção 2):

```ts
createClient(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // não há URL de OAuth no MVP
  },
})
```

- **AppState:** um único listener registrado no módulo (`active` → `supabase.auth.startAutoRefresh()`; qualquer outro estado → `stopAutoRefresh()`). No celular o refresh roda continuamente em segundo plano, então ele é amarrado ao primeiro plano, como pede a referência do `supabase-js`.
- **Onde a sessão fica:** o tutorial do Supabase usa `LargeSecureStore` (SecureStore + criptografia em AsyncStorage, com `aesjs` e `react-native-get-random-values`). **No MVP usamos AsyncStorage puro:** a sessão é anônima, sem dado pessoal, e evita três dependências nativas/de polyfill. **Reserva:** trocar o `storage` pelo `LargeSecureStore` na Fase 15, quando a sessão passar a ter e-mail.
- **Polyfill:** o guia lista `react-native-url-polyfill`. Conferir na Fase 4 se ainda é necessário no RN 0.86 antes de instalar.
- **Chave e variáveis:** a doc atual manda usar a **publishable key** (`sb_publishable_...`) no cliente e avisa que `anon` e `service_role` serão descontinuadas até o fim de 2026. Variáveis: `EXPO_PUBLIC_SUPABASE_URL` e **`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (nome que substitui o `..._ANON_KEY` citado antes no plano). O `supabase-js` aceita a nova chave sem mudar o código. A secret key nunca entra no app nem no repositório.

### 8.5 Schema e RLS: regras que valem para todos os scripts

1. **RLS ligado em toda tabela do schema `public`**, sem exceção, e coberto por teste (`test:db`).
2. **Grants mínimos:** como a doc manda, `revoke all` de `anon` e `authenticated` e `grant` só do necessário (por exemplo, `select` em `places`; `select, insert` em `stamps`). Tabela sem grant não é alcançável nem por engano.
3. **Policies sempre `to authenticated`**, escritas com `(select auth.uid())` (avaliado uma vez por consulta, não por linha) e com índice em `user_id`.
4. **O cliente nunca escolhe o dono:** `with check ((select auth.uid()) = user_id)` em todo insert, e `user_id` com default `auth.uid()`.
5. **Colunas sensíveis protegidas:** `profiles.plan` **não** é gravável pelo cliente. Só `locale` e `timezone` entram no grant de `update`; o plano muda por RPC/webhook (Fase 14). Sem isso, qualquer um viraria Plus com um `update`.
6. **Funções `security definer`** (`consume_suggestion`, `quota_status`, o trigger de `profiles`): `set search_path = ''` com nomes qualificados, `revoke execute ... from public, anon` e `grant execute ... to authenticated`. Elas usam `auth.uid()` por dentro e **não recebem `user_id` como parâmetro**.
7. **`suggestion_events` só por RPC** (sem `insert` direto), para a cota não ser burlada gravando eventos a mais ou a menos.
8. **`events` e `plus_interest`: só insert**, sem leitura pelo cliente; `place_reports`: só insert pelo dono.
9. **Catálogo** (`cities`, `places`, `place_translations`, `place_hours`): `select` para `authenticated`; `places` só mostra `active`. Escrita só pelo dashboard.
10. **Exclusão em cascata:** toda tabela de usuário tem `user_id uuid references auth.users on delete cascade`. Apagar o usuário apaga tudo (é o que `delete-my-data` usa).

### 8.6 Cota (D12)

- `quota_week_start(ts, tz)`: função pura que devolve a segunda 00:00 do fuso (testada em `supabase/checks/`).
- `consume_suggestion(place_id)` → `{ allowed, remaining, resets_at }`; `quota_status()` → o mesmo sem consumir. Plus não tem limite.
- O fuso vem de `profiles.timezone`. O app grava o IANA do aparelho (`Intl.DateTimeFormat().resolvedOptions().timeZone`) no primeiro login e quando mudar; a função valida o nome e cai em `America/Sao_Paulo` se for inválido.
- **Sem internet não há sugestão nova** (a cota é do servidor); o app mostra a tela de "sem conexão". Isso é o contrato da seção 7.6 (mutação sem otimismo).

### 8.7 Catálogo e fotos

- **Catálogo:** o app baixa a cidade inteira (`places` + `place_translations` + `place_hours`, no idioma ativo com fallback `pt-BR`), guarda no React Query persistido e filtra com `domain/recommend.ts` (D16). A query key leva `cityId` e idioma.
- **Fotos:** bucket `place-photos` **público**. Pela doc, bucket público dispensa policy de leitura, mas **upload, delete e move continuam protegidos**; por isso `005_storage_policies.sql` **não** cria policy de escrita para `authenticated`, e só o dashboard sobe fotos. A URL pública é montada no service a partir de `photo_path`.
- **Tamanho:** a transformação de imagens do Storage depende do plano e não foi confirmada, então o MVP **não depende dela**: as fotos entram já redimensionadas (a definir na curadoria, Fase 6) e o `expo-image` faz o cache e o placeholder listrado.

### 8.8 Edge Function `delete-my-data`

- **Código versionado em `supabase/functions/delete-my-data/index.ts`.** O editor do dashboard **não tem versionamento**, então o repositório é a fonte de verdade e o usuário cola o código lá. Cada mudança é um novo handoff.
- **O que faz:** lê o usuário pelo JWT do `Authorization`, confere que existe e chama `auth.admin.deleteUser(id)` com a chave de serviço, que só existe **dentro da função** (variável de ambiente do próprio Supabase). A cascata (8.5, regra 10) apaga os dados.
- **Cliente:** `deleteMyData()` em `services/account`, via `supabase.functions.invoke('delete-my-data')`; depois faz `signOut` local, limpa o cache do React Query e os stores e volta ao onboarding (novo usuário anônimo na próxima abertura).
- **A conferir na Fase 4:** o nome exato da variável da chave de serviço (por causa da migração para secret keys), se a verificação de JWT vem ligada por padrão e como configurá-la no editor. A doc consultada não detalha esses pontos.

### 8.9 Camada de serviços

- Cada assunto é uma pasta de `services/` (`places`, `stamps`, `quota`, `feedback`, `reports`, `analytics`, `auth`, `account`), com **interface pequena + implementação Supabase + implementação em memória** para teste (regra 4 da seção 2). Os hooks recebem o service por contexto/parâmetro, o que permite testar sem rede.
- O service **converte** linha do banco (`database.ts`, `snake_case`) em tipo de domínio (`camelCase`) e os erros do Supabase em um erro nosso (`AppError` com `code`), para que nada acima de `services/` dependa do formato do Supabase.
- Hooks de leitura usam React Query (7.6); escrita de carimbo passa pela fila (7.3); cota é mutação sem otimismo.

### 8.10 Riscos

| Risco | Tratamento |
|---|---|
| Limite de 30 anônimos/hora por IP barrar o grupo de teste na mesma rede | Subir o limite no dashboard se acontecer; captcha no pós-MVP |
| Reinstalar perde o passaporte e reseta a cota (burla aceita) | D12; conta na Fase 15; texto honesto no onboarding e em Ajustes |
| Cliente alterar `plan`, `user_id` ou a cota | Grants por coluna, `with check`, RPCs `security definer` e testes em `test:db` |
| Editor de Edge Functions sem versionamento | Repositório como fonte de verdade; handoff a cada mudança |
| `anon`/`service_role` descontinuadas até o fim de 2026 | App já nasce com a publishable key; função confere o nome da variável da chave de serviço na Fase 4 |
| Detalhe de API divergir da doc (polyfill, nome de variável, JWT da função) | Conferir a doc atual no início de cada tarefa de banco/auth, antes de escrever |
| Anônimos acumulando sem limpeza | Sem custo relevante no MVP; script manual se preciso |

## 9. ADR — Estratégia offline-first

**Status:** aceito em 02/10/2026. **Base:** Pattern 3 da skill `react-native-architecture` (React Query offline-first), a doc atual do TanStack Query (`persistQueryClient`, guia de React Native), a doc do `expo-network` no SDK 57 e as seções 7 (estado) e 8 (Supabase) deste documento.

### 9.1 O que funciona sem internet

| Recurso | Offline? | Como |
|---|---|---|
| Abrir o app e ver o **Passaporte** (ofensiva, meta, bingo, carimbos) | Sim | Carimbos e catálogo vêm do cache persistido do React Query, somados aos itens pendentes da `syncQueueStore` |
| **Criar um carimbo** ("Bora, tô indo") | Sim | Vai para a fila e aparece já no passaporte; envio quando a conexão voltar |
| Ver o catálogo, a **Ajustes**, trocar o idioma | Sim | Cache e store local |
| **Pedir uma sugestão nova** ("Me tira da inércia", "Outra") | **Não** | A cota é do servidor (D12). Tela clara de "sem conexão", **sem gastar cota** |
| Primeira abertura **sem** internet | Não | Não há sessão nem catálogo; mostra o estado de "sem conexão" com "Tentar de novo" |
| Informar problema, "Como foi?", fake door do Plus | Parcial | Entram na mesma fila (ver 9.6); sem internet ficam guardados |

Pelo desenho do plano, **a sugestão é a única coisa que exige rede**, e ela só é pedida depois que o usuário toca no CTA.

### 9.2 Conectividade

- **Fonte:** `expo-network` (módulo oficial do Expo, SDK 57), no lugar do `@react-native-community/netinfo` que a skill usa. Motivo: `AGENTS.md` pede preferir módulos do Expo, e a doc do TanStack tem o mesmo exemplo com `expo-network` (`addNetworkStateListener` + `getNetworkStateAsync` para o estado inicial).
- **Ligação com o React Query** (um módulo, `src/lib/onlineManager.ts`, importado uma vez pelo `QueryProvider`): `onlineManager.setEventListener` alimentado pelo `expo-network`, e `focusManager.setFocused(state === 'active')` alimentado pelo `AppState` (o React Query não detecta foco sozinho no celular).
- **Limite conhecido:** no iOS, `isInternetReachable` é igual a `isConnected`, e um Wi-Fi sem saída para a internet aparece como "online". Por isso **estar online nunca é prova de sucesso**: todo envio trata falha de rede (9.5) e a tela de sugestão trata erro de rede (9.4), além do estado do `expo-network`.
- Hook `useIsOnline()` (`src/hooks/useIsOnline.ts`): lê o `onlineManager` com `useSyncExternalStore`. É o que alimenta o `OfflineBanner` (Fase 2) e a decisão de desabilitar o CTA.

### 9.3 Cache de servidor (React Query persistido)

- **Provider:** `PersistQueryClientProvider` (`providers/QueryProvider.tsx`) com `createAsyncStoragePersister` (`@tanstack/query-async-storage-persister`), chave `role.queryCache`.
- **O que persiste** (lista branca por `shouldDehydrateQuery`, só queries com `status === 'success'` e `meta: { persist: true }`):

  | Query | Persiste? | `staleTime` | Observação |
  |---|---|---|---|
  | `places(cityId, locale)` (catálogo + traduções + horários) | **sim** | 6 h | Muda pouco; revalida ao voltar ao primeiro plano |
  | `stamps(userId)` | **sim** | 5 min | O passaporte offline depende dele |
  | `quota(userId)` | **não** | 0 | A cota é autoridade do servidor; um número velho enganaria. Offline a Home esconde o contador |
  | `profile`, `place feedback` etc. | não | — | Pouco valor offline |

- **Tempos:** `maxAge` do persister **7 dias** e `gcTime` do `QueryClient` **≥ 7 dias** (a doc exige `gcTime ≥ maxAge`, senão o cache é descartado antes). `networkMode: 'offlineFirst'` nas **queries**: usa o cache e tenta a rede; sem rede, não fica em laço de retry.
- **`buster`:** `CACHE_VERSION` (constante em `src/lib/queryClient.ts`), incrementada **sempre que o formato de uma query persistida mudar**. Cache com `buster` diferente é descartado na hora (mesma regra de `version`+`migrate` dos stores, seção 7.4).
- **Idiomas:** a chave leva o `locale`, então trocar de idioma cria outra entrada. Ao trocar, as entradas de `places` de **outros** idiomas são removidas (`removeQueries`), para o cache não crescer com três cópias.
- **Hidratação:** o `_layout` raiz segura a splash também até o cache ser restaurado (`useIsRestoring()` falso), somando-se ao que a seção 7.5 já exige (stores, fontes, i18n).
- **Limpeza:** "apagar meus dados" (seção 8.8) chama `queryClient.clear()` e `persister.removeClient()`.
- **Fotos:** `expo-image` com `cachePolicy="disk"` guarda no aparelho as fotos já vistas. **Não** se pré-baixa a cidade inteira no MVP; foto não vista e offline mostra o placeholder listrado.

### 9.4 Sugestão exige internet (e como não gastar cota à toa)

1. O CTA "Me tira da inércia" fica ativo mesmo offline, porque o aviso é mais útil que um botão morto. Ao tocar, o hook `useSuggestion` consulta `onlineManager.isOnline()`: se **offline**, abre o estado `OfflineState` na própria tela de sugestão (ícone `WifiOff`, texto e "Tentar de novo"), **sem chamar o servidor**.
2. `consume_suggestion` é uma mutação com `networkMode: 'always'` e **sem retry automático**. O padrão do React Query (`online`) **pausaria** a mutação offline e a tela ficaria presa; aqui queremos falhar rápido.
3. **Resposta perdida:** se a rede cair depois do servidor processar, o cliente vê erro mas a cota já foi gasta. Para o "Tentar de novo" **não cobrar duas vezes**, o cliente gera um `request_id` (uuid) por tentativa lógica e o reenvia; o servidor ignora repetições do mesmo `request_id`. **Entrada para a tarefa de banco (Fase 4):** `consume_suggestion(place_id, request_id uuid)` com índice único em `suggestion_events (user_id, request_id)` e retorno idêntico na repetição.
4. A tela só mostra o card depois da resposta `allowed = true`; `allowed = false` abre o Plus (regra de negócio, sem mudar nada aqui).

### 9.5 Fila de carimbos (`syncQueueStore`)

Já definida na seção 7.3; aqui o comportamento.

- **Criar o carimbo:** o cliente gera `id` (uuid v4, `expo-crypto`), o `number` e `stampedAt` e chama `enqueueStamp`. O carimbo aparece na hora (o passaporte junta cache + fila, seção 7.3). O **`number`** é atribuído no cliente como "total confirmado + pendentes + 1".
  - **Entrada para a tarefa de banco (Fase 4):** `stamps.id` é a chave primária e a base da idempotência. **Não** criar índice único em `(user_id, number)` no MVP, para uma colisão de numeração (só possível com mais de um aparelho, Fase 15) nunca virar carimbo perdido; a renumeração por ordem de `stamped_at` fica para a Fase 15.
  - **Entrada para a tarefa de banco (Fase 4):** a policy de leitura de `places` precisa deixar o usuário ler lugares **inativos que ele já carimbou** (`active or exists (select 1 from stamps ...)`), para o passaporte não perder o nome de um lugar que saiu do catálogo.
- **Envio** (`useSyncQueue`, em `hooks/`, une `stores` + `services`): `upsert` em lote com `onConflict: 'id'` e `ignoreDuplicates: true` (idempotente: reenviar o mesmo `id` não duplica). Roda com **trava de execução única** (se já está enviando, não começa outra).
- **Quando roda:** (a) ao abrir o app, depois de sessão e stores prontos; (b) quando o `onlineManager` volta a `online`; (c) quando o app volta ao primeiro plano; (d) logo após um `enqueueStamp`; (e) por um timer de reenvio com **backoff exponencial** (5 s, 15 s, 45 s... até 5 min) enquanto houver item pendente e o app estiver em primeiro plano. **Sem tarefa em segundo plano no MVP** (`expo-background-task` fica como evolução).
- **Sucesso:** `acknowledge(id)` remove o item e `invalidateQueries(stamps)` traz a versão do servidor.
- **Falha de rede/timeout/5xx:** o item **fica**, `attempts` sobe e o backoff continua. Isso nunca é erro para o usuário.
- **Falha permanente** (4xx do servidor, como violação de RLS ou de chave estrangeira): `markFailed(id)` guarda o motivo; o item **não é reenviado** sozinho. O app **não perde o carimbo**: ele continua aparecendo no passaporte com o estado "não enviado", e o evento `stamp_sync_failed` (Fase 13) mede quantos casos existem.
- **Teto:** no máximo **50** itens pendentes (mais do que isso, só acontece com um bug); acima disso `enqueueStamp` ainda aceita, mas dispara o evento e o log, para a gente descobrir cedo.
- **Lógica pura em `domain/syncQueue.ts`:** escolher o próximo lote, calcular o backoff e classificar o erro (`retry` × `permanent`) ficam em funções puras e testáveis; o hook só orquestra.

### 9.6 Outras escritas

`place_reports`, `place_feedback` e `plus_interest` são inserts simples, sem número e sem cota. Usam o **mesmo mecanismo** de fila (cada item com `id` uuid e `kind`), generalizando a `syncQueueStore` (`kind: 'stamp' | 'report' | 'feedback' | 'plusInterest'`), para o app não precisar de uma fila por assunto. O MVP **começa só com `stamp`**; os outros tipos entram na fase de cada tela, reutilizando o envio idempotente. Eventos de analytics (`events`) usam um buffer próprio e **descartável** (Fase 13): perder um evento é aceitável, perder um carimbo não.

### 9.7 Sessão e conflitos

- **Sessão offline:** o `supabase-js` guarda a sessão no AsyncStorage (seção 8.4). Se o refresh falhar por falta de rede, a sessão local continua válida; as consultas voltam a funcionar quando a rede volta.
- **Sem conflitos de edição:** carimbo é **só criado**, nunca editado, e há um aparelho por usuário no MVP. O `id` do cliente resolve a duplicidade; não é preciso resolver conflito de versão.
- **Relógio do aparelho:** `stampedAt` vem do relógio local. O servidor guarda também `created_at` próprio, e a ofensiva usa `stamped_at`; adiantar o relógio para ganhar ofensiva é aceito no MVP (sem competição entre usuários).

### 9.8 Dependências e testes

- **Dependências** (instaladas na Fase 5, via `npx expo install`): `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `expo-network`, `expo-crypto`. **Sem** `@react-native-community/netinfo`. A tarefa de dependências planejadas consolida a lista.
- **Testes:**
  - `domain/syncQueue.ts`: lote, backoff e classificação de erro, com jest puro;
  - `useSyncQueue`: service em memória que falha na rede e depois funciona, conferindo que o item sai da fila só no sucesso e que reenviar não duplica;
  - `QueryProvider`: só `places` e `stamps` entram no cache persistido (`quota` não);
  - `test:db`: reenviar o mesmo `id` de `stamps` não duplica, e repetir o `request_id` do `consume_suggestion` não gasta cota de novo.
- **Verificação 👀 (Fase 5/9):** modo avião → abrir o app e ver o passaporte; criar um carimbo offline; religar a rede e ver o envio; tentar sugestão offline e ver o `OfflineState` sem perder cota.

### 9.9 Riscos

| Risco | Tratamento |
|---|---|
| Wi-Fi "conectado" sem internet engana o `expo-network` | Falha de rede tratada em cada chamada; `onlineManager` só decide a UX inicial |
| Cota cobrada duas vezes por resposta perdida | `request_id` idempotente em `consume_suggestion` (9.4) |
| Carimbo "preso" por erro permanente | Estado "não enviado" visível + evento `stamp_sync_failed`; sem descarte silencioso |
| Cache crescer (3 idiomas, muitos lugares) | Lista branca de queries, remoção de outros idiomas, `maxAge` de 7 dias, `buster` |
| Cache velho incompatível após atualizar o app | `CACHE_VERSION` incrementada a cada mudança de formato |
| Splash demorar para hidratar tudo | Medir na Fase 13; reserva `expo-sqlite/kv-store` (seção 7.2) |
| Perder dados ao reinstalar | Fila e cache vivem no aparelho; o que já foi enviado está no servidor, o resto se perde (aceito no MVP, 8.3) |

## 10. ADR — Estratégia de i18n

**Status:** aceito em 02/10/2026. **Base:** doc de localização do Expo (SDK 57) e do `expo-localization`, doc do i18next (tipagem e plurais), doc do Hermes sobre `Intl` e doc do polyfill `@formatjs/intl-pluralrules`. Idiomas do lançamento (D8): **pt-BR (base), en, es**. Moeda separada do idioma (D10): valores sempre em BRL.

### 10.1 Bibliotecas

| Peça | Escolha | Por quê |
|---|---|---|
| Idioma do aparelho | `expo-localization` (`getLocales()`/`useLocales()`) | Módulo oficial do Expo |
| Tradução | **`i18next` 26 + `react-i18next` 17** | Plurais e ordinais prontos, interpolação, tipagem forte das chaves por augmentation, `useTranslation` com seletor fino, e o plano já previa |
| Plural em Hermes | **`@formatjs/intl-pluralrules`** (polyfill) | Ver 10.5: o Hermes não tem `Intl.PluralRules` e o i18next v24+ depende dele |

Alternativa descartada: `i18n-js` (a que o guia do Expo mostra). É menor, mas tem plural manual e **não tipa as chaves**, e a tipagem é requisito do plano ("chave inexistente dá erro de compilação"). Lingui e outras exigem etapa de compilação/extração que o app não precisa com 3 idiomas.

### 10.2 Resolução do idioma

```
escolha salva (preferencesStore.language) ─ se 'system' ─▶ idioma do aparelho ─ se não suportado ─▶ pt-BR
```

- **Tipo:** `Locale = 'pt-BR' | 'en' | 'es'` e `LanguagePreference = Locale | 'system'` (a escolha; o efetivo é derivado, seção 7.3).
- **Mapa do aparelho** por `languageCode` de `getLocales()` (mesmo critério para todas as regiões): `pt` (inclui `pt-PT`) → `pt-BR`; `en` (`en-GB`, `en-AU`...) → `en`; `es` (`es-MX`, `es-AR`...) → `es`; qualquer outro (ex.: `fr`) → **`pt-BR`**, porque o mercado inicial é o Brasil. Função pura em `i18n/resolveLocale.ts`, testada.
- **Acompanhar o aparelho:** com `language === 'system'`, o idioma efetivo segue `useLocales()`. No Android o usuário muda o idioma nas configurações sem reiniciar o app (e há idioma por app); por isso o `I18nProvider` também reavalia ao voltar ao primeiro plano (`AppState`), como a doc do Expo pede. No iOS o valor é constante durante a execução.
- **Idioma por app do sistema:** o plugin `expo-localization` recebe `supportedLocales` (`ios` e `android`: `["pt-BR", "en", "es"]`), para o app aparecer nas configurações de idioma por app. Quando o usuário escolhe lá, `getLocales()` já devolve esse idioma e a opção "Idioma do aparelho" o segue.
- **Perfil:** o idioma **efetivo** é gravado em `profiles.locale` (seção 8.5, o grant permite `update` de `locale`), pelo `services/account`, em segundo plano e sem tratar falha como erro. Se falhar, a divergência é corrigida na próxima abertura (compara o valor local com o do perfil). O dado serve para as notificações e comunicações futuras.

### 10.3 Inicialização e troca em tempo real

- **`src/i18n/index.ts`:** importa os polyfills (10.5) **antes** de tudo, cria a instância com os 3 JSON embutidos (`resources`), `fallbackLng: 'pt-BR'`, `interpolation: { escapeValue: false }` (não há HTML) e **init síncrono** (recursos locais; a opção se chama `initAsync` nas versões atuais, conferir na doc ao implementar). Começa com o idioma resolvido pelo aparelho, para o primeiro render nunca ficar sem texto.
- **Aplicar a escolha salva:** o store de preferências hidrata de forma assíncrona (seção 7.5). Depois de hidratado, o `I18nProvider` chama `i18n.changeLanguage(effective)` **antes de a splash ser liberada** (acrescenta-se "idioma aplicado" à condição de pronto da seção 7.5). Assim o usuário nunca vê um idioma e depois outro.
- **Troca:** `useLanguage().setLanguage(lang | 'system')` grava no store e o `I18nProvider` troca o idioma na hora; `react-i18next` re-renderiza só quem usa `t`. Sem reiniciar o app.
- **Efeitos que dependem do idioma ao trocar:** (a) as entradas de `places` do React Query de **outros** idiomas são removidas e a do novo é buscada (seção 9.3); (b) as notificações locais agendadas são **reagendadas** com o texto do novo idioma; (c) o rótulo do dock é remedido (Fase 2); (d) `profiles.locale` é atualizado.
- **Sem RTL:** nenhum dos idiomas é RTL; `supportsRTL` fica como está.

### 10.4 Chaves, arquivos e tipagem

- **Arquivos:** `src/i18n/locales/pt-BR.json` (base, texto igual ao do protótipo), `en.json` e `es.json`. **Um namespace só** (`translation`), porque são poucas telas.
- **Estrutura:** objeto aninhado por tela/feature, nomes de chave em inglês `camelCase`: `home.title`, `suggestion.cta`, `plus.table.suggestions`, `common.cancel`. Textos de acessibilidade em `a11y.*` (ex.: `a11y.tab.passport`). Textos de notificação em `notifications.*`.
- **Tipagem:** arquivo `src/i18n/i18next.d.ts` com a augmentation de `CustomTypeOptions` (`defaultNS: 'translation'`, `resources: { translation: typeof ptBR }`), tendo o **pt-BR como fonte dos tipos**. `resolveJsonModule` já vem ligado no `expo/tsconfig.base`. Resultado: `t('home.titulo')` não compila, e `t('suggestion.remaining', { count })` exige o `count`. A tipagem seletora nova (`enableSelector`) **não** entra agora; fica como evolução se o editor ficar lento.
- **Interpolação:** `{{name}}`, `{{count}}`; sempre por parâmetro, nunca concatenando string (regra do plano).
- **Plurais:** formato JSON v4 do i18next (`_one`, `_other`, e as categorias extras do idioma). **Atenção:** os idiomas não têm as mesmas categorias (em pt-BR e es existe `_many`, em en não). O teste de paridade (10.7) compara as chaves **sem o sufixo de plural** e exige `_other` em todo plural, em vez de exigir sufixos idênticos.
- **Ordinais:** pelo recurso nativo do i18next (`t('key', { count, ordinal: true })`, chaves `key_ordinal_one`...), que usa o mesmo `Intl.PluralRules` com `type: 'ordinal'`. Não se escreve função de ordinal à mão.
- **Nunca em `t()`:** nomes próprios do catálogo, rótulos vindos do banco, e valores calculados (data, número, moeda, distância), que usam os helpers da seção 10.6.

### 10.5 Plural no Hermes (verificação pedida pelo plano)

- **Fato conferido nas docs atuais:** o Hermes **não implementa `Intl.PluralRules`**; o i18next documenta que, desde a v24, sem ele só resolvem as formas `_one`/`_other` em inglês (pt-BR e es ficariam erradas).
- **Decisão:** `src/i18n/polyfills.ts` importa `@formatjs/intl-pluralrules/polyfill-force.js` e os dados de `locale-data/pt.js`, `en.js` e `es.js`. O **`polyfill-force`** (e não o `polyfill`) é o indicado para o Hermes, porque a detecção do `polyfill` comum é lenta no Android. Para não depender de uma suposição, o import é condicionado a `typeof Intl.PluralRules === 'undefined'`; se um Hermes futuro trouxer o recurso, o polyfill não carrega. Instalação com `npx expo install` (ou `npm i`, se o pacote não estiver na lista do Expo; registrar na tarefa de dependências).
- **Custo:** poucas centenas de KB e uma execução no início; medir na Fase 13 junto com a abertura.
- **O teste no jest roda no Node**, que tem `Intl.PluralRules` nativo, então ele **não prova** o comportamento do Hermes. Vira critério 👀 da Fase 2: no aparelho, conferir "1 restante" × "2 restantes" nos três idiomas.
- **Outros `Intl` no Hermes:** a doc do Hermes lista `NumberFormat`, `DateTimeFormat` e `Collator`; **não** cita `RelativeTimeFormat`, `ListFormat`, `DisplayNames` nem `Locale`. **Regra: não usar essas APIs.** Também **não usar `NumberFormat.formatToParts`** (só no Android) nem `signDisplay`/notação compacta (não suportados no iOS). O resultado do `Intl` pode variar com a versão do Android; por isso o que é visualmente crítico é validado no aparelho (👀).

### 10.6 Formatação (`src/i18n/format.ts`)

Funções puras que recebem o `Locale` (e não leem estado global), com testes. O hook chama com o idioma ativo.

| Helper | Saída (pt-BR) | Implementação |
|---|---|---|
| `formatStampDate(date, tz)` | `02 · 10 · 2026` | Partes numéricas montadas à mão (dia e mês com 2 dígitos, ano), independentes do `Intl`, para o carimbo ser idêntico em qualquer aparelho |
| `formatWeekdayShort(date, locale, tz)` | `SEX · 02 OUT` | `Intl.DateTimeFormat` com `weekday: 'short'` e `month: 'short'`, em maiúsculas e sem o ponto final (`sex.` → `SEX`). **Não** usa `formatToParts`. Se aparelhos divergirem no 👀, os nomes curtos passam para o JSON |
| `formatDate(date, locale, tz)` | `2 de outubro` | `Intl.DateTimeFormat` |
| `formatCurrency(value, locale)` | `R$ 30,00` / `R$30.00` | `Intl.NumberFormat` com `currency: 'BRL'` sempre (D10); só o formato segue o idioma |
| `formatDistance(meters, locale)` | `1,8 km` / `1.8 km`; abaixo de 1 km, `350 m` | `Intl.NumberFormat` decimal (1 casa) + símbolo `km`/`m`, sem `style: 'unit'` (suporte incerto no iOS) |
| ordinais | `3ª` | `t(..., { ordinal: true })` (10.4) |

- **Fuso:** datas de carimbo e "semana" usam o **fuso do usuário** (`profiles.timezone`, seção 8.6), não o do servidor.
- **Rótulos de faixa de preço** ("De graça", "Até R$30", "Até R$80") são **nomes de opção** fixos nos JSON, não valores calculados. Já o preço do lugar e os planos do Plus passam por `formatCurrency`.
- **Texto igual ao protótipo** só no pt-BR; en e es são traduções (revisão: D11).

### 10.7 Conteúdo do catálogo e do banco

- `place_translations(place_id, locale, kind_label, reason_mood, reason_time, reason_money)`: o service busca `locale in (ativo, 'pt-BR')` e **mescla**, com o pt-BR como fallback **por campo**. Assim um lugar sem tradução em en ainda aparece, em português.
- **No MVP, só o pt-BR do catálogo é obrigatório.** Traduzir os lugares é opcional e entra com a revisão do D11.
- A **query key leva o idioma** (seção 9.3) e o cache de outros idiomas é limpo ao trocar.
- Enums e IDs de domínio (`curious`, `2h`, `up_to_30`, `viewpoint`...) **nunca são traduzidos**; o rótulo vem de `mood.curious`, `budget.up_to_30`, `category.viewpoint` nos JSON.

### 10.8 Textos nativos (fora do JS)

- **Nome do app e permissões** (localização) por idioma, via a chave `locales` do `app.json`, apontando para arquivos em `src/i18n/native/pt-BR.json`, `en.json` e `es.json`. A doc do Expo mostra suporte a `CFBundleDisplayName`, descrições de permissão (iOS) e `app_name` (Android); o formato exato dos arquivos é conferido na Fase 13 (build). No iOS, `CFBundleAllowMixedLocalizations` ligado.
- **Notificações locais:** o texto é resolvido com `t()` **no momento de agendar**, no idioma ativo, e reagendado quando o idioma muda (10.3). Entra nas chaves de todos os arquivos, como o plano exige.
- **Paridade:** o teste de paridade também cobre `notifications.*`.

### 10.9 Testes

- **Paridade de chaves** (`i18n/locales.test.ts`): mesmas chaves-base nos 3 arquivos (ignorando o sufixo de plural, 10.4), mesmos placeholders (`{{count}}`, `{{name}}`) por chave, `_other` presente em todo plural, e nenhum valor vazio.
- **`resolveLocale`:** `pt-PT`→`pt-BR`, `en-GB`→`en`, `es-MX`→`es`, `fr`→`pt-BR`, e a escolha salva ganhando do aparelho.
- **`format.ts`:** cada helper nos 3 idiomas, com um fuso fixo (virada de dia incluída).
- **Estouro de texto:** testes de layout dos componentes com strings ~40% maiores (critério da Fase 2), incluindo o maior rótulo do dock ("Passaporte"/"Passport"/"Pasaporte").
- **Componente:** render em cada idioma troca o texto sem reiniciar.
- **👀 no aparelho (Fase 2/3):** plural no Hermes (10.5), nome do dia/mês, troca de idioma em tempo real e persistência após reabrir.

### 10.10 Riscos

| Risco | Tratamento |
|---|---|
| Plural errado em pt-BR/es no Hermes | Polyfill com dados de pt/en/es + 👀 no aparelho (10.5) |
| `Intl.DateTimeFormat` com saída diferente por aparelho/versão do Android | Carimbo montado sem `Intl`; nomes curtos normalizados; plano B: nomes no JSON |
| Texto longo em en/es quebra o layout | Critério de 40% e teste de layout (Fase 2) |
| Chave faltando em algum idioma | Teste de paridade + tipagem a partir do pt-BR |
| Flash de idioma errado na abertura | Splash segurada até o idioma salvo ser aplicado (10.3) |
| Polyfill pesar na abertura | `polyfill-force` + dados só de 3 idiomas; medir na Fase 13 |
| Tradução ruim de en/es | Revisão humana (D11), antes da Fase 18 |

## 11. ADR — Estratégia de testes

**Status:** aceito em 02/10/2026. **Base:** doc de testes do Expo (SDK 57: `jest-expo`, Testing Library), doc de testes do Expo Router (`renderRouter`), doc do Reanimated 4 e do Worklets sobre Jest, doc do Maestro e a seção 8 (Supabase sem CLI). Regra do projeto: **o loop nunca roda o app**, então a confiança vem de testes automáticos rodando em Node + critérios 👀 verificados pelo usuário.

### 11.1 Pirâmide

| Camada | Ferramenta | Roda onde | O que cobre | Quando |
|---|---|---|---|---|
| **1. Domínio** (`src/domain/`) | Jest puro | loop | `recommend`, `streak`, `bingo`, `monthlyGoal`, `openingHours`, `safety`, `syncQueue` (9.5) | Fase 5 em diante; **cobertura mínima de 90%** (linhas e ramos) |
| **2. i18n e formatação** | Jest | loop | paridade de chaves, `resolveLocale`, `format.ts` (seção 10.9) | Fase 2 |
| **3. Services** (`src/services/`) | Jest com `lib/supabase` mockado | loop | mapeamento linha→domínio, conversão de erro em `AppError`, montagem das queries | Fase 5 |
| **4. Hooks** | `renderHook` do Testing Library + `QueryClient` de teste + services em memória | loop | `useQuota`, `useSuggestion`, `useSyncQueue`, `usePassport`, `useLanguage` | Fases 5 a 10 |
| **5. Componentes** (`ui/` e `features/`) | `@testing-library/react-native` | loop | comportamento e acessibilidade (papel, rótulo, estado), estouro de texto, animação do dock | Fase 2 em diante |
| **6. Rotas e navegação** | `renderRouter` (`expo-router/testing-library`) | loop | gate de onboarding, apresentação das rotas, deep links, `+not-found` | Fase 3 |
| **7. Banco** | `npm run test:db` + `supabase/checks/*.sql` | usuário aplica os scripts; o loop roda o `test:db` depois | RLS, cota, idempotência, `delete-my-data` | Fase 4 em diante |
| **8. E2E** | **Maestro** (opcional) | **usuário** | fluxo completo no aparelho | Fase 13, depois do MVP estável |
| **9. 👀 no aparelho** | usuário | usuário | o que só existe com o app aberto: Hermes, safe area, gestos, animação, permissões | fim de cada fase |

Os testes ficam mais **baratos e numerosos na base** (domínio, i18n) e **raros e caros no topo** (E2E).

### 11.2 Configuração

- **Pacotes (dev):** `jest`, `jest-expo`, `@types/jest` (instalados com `npx expo install ... --dev`, como a doc do Expo manda), `@testing-library/react-native` (v14+, exigida pelo `renderRouter`), `test-renderer` (o par que a doc atual do Testing Library pede, no lugar do `react-test-renderer`, por causa do React 19) e `eslint-plugin-testing-library`. O `jest-expo` 57 declara `@react-native/jest-preset` como peer; confirmar os avisos do `npm` na instalação.
- **`jest.config.js`** (projeto de app, rodado por `npm test`): `preset: 'jest-expo'`, `setupFilesAfterEnv` com `src/test/setup.ts`, `transformIgnorePatterns` da doc do Expo, e o alias `@/` (`moduleNameMapper`). O script `test` atual (`jest --passWithNoTests`) continua; **sem `--watchAll`** no script, porque o loop precisa de execução única (a doc do Expo usa `--watchAll`; deixamos `test:watch` à parte).
- **`src/test/setup.ts`:** matchers do `expo-router/testing-library/expect`; `setUpTests()` do Reanimated; mock do Worklets (`react-native-worklets/src/mock`); mock oficial do `AsyncStorage`; mock do `expo-network`, `expo-haptics`, `expo-localization` e `expo-crypto`; `process.env.TZ = 'UTC'` para as datas serem determinísticas. A tarefa de implementação confere na doc o que o `jest-expo` já mocka.
- **`tsconfig.json`:** acrescentar `"jest"` em `types` (doc do Expo).
- **`jest.db.config.js`:** projeto **separado** (ambiente `node`, sem o preset de UI), só com `tests/db/`, `testTimeout` maior e `maxWorkers: 1`. Lê o `.env` do `role-dev`. A forma exata (preset `jest-expo` com `testEnvironment: 'node'`, ou o preset node do pacote) e como as variáveis `EXPO_PUBLIC_*` chegam ao teste são conferidas na Fase 4. `npm test` **exclui** `tests/db/` (precisa de rede e do `role-dev`).
- **Scripts:** `test` (app, uma execução), `test:watch`, `test:coverage`, `test:db`, além de `typecheck` e `lint` que já existem.

### 11.3 Onde ficam os testes e como se chamam

- **Ao lado do arquivo testado**, com o mesmo case (`streak.test.ts`, `FloatingTabBar.test.tsx`), como diz a nomenclatura do plano.
- **Exceção, rotas:** a doc do Expo Router manda **nunca** colocar teste dentro de `src/app/` (viraria rota). Testes de navegação ficam em **`tests/app/`** (ex.: `tests/app/onboardingGate.test.tsx`).
- **Banco:** `tests/db/*.test.ts` (já na árvore da seção 4).
- **Apoio:** `src/test/` com `setup.ts`, `renderWithProviders.tsx` (i18n + `QueryClient` de teste sem retry e sem persistência), fábricas (`makePlace()`, `makeStamp()`) e os services em memória. `src/test/` só é importado por testes; o lint proíbe importá-lo de código de produção.
- **Descrições dos testes em inglês**, como todo nome técnico (`it('blocks the 4th suggestion of the week')`).

### 11.4 Regras de escrita

1. **Domínio é determinístico:** nenhuma função de `domain/` chama `Date.now()`/`new Date()` ou lê o fuso do sistema. Recebem `now` e `timeZone` por parâmetro, o que dispensa timers falsos e torna o teste da virada de semana trivial.
2. **Testar comportamento, não implementação:** componentes por papel, rótulo e texto (`getByRole`, `getByLabelText`), que é também o que garante a acessibilidade. `testID` só quando não houver alternativa.
3. **Sem snapshot de UI.** A própria doc do Expo recomenda cautela e prefere E2E para UI. Snapshot só para dados serializados pequenos e estáveis, se ajudar.
4. **Services em memória, não mock por chamada:** os hooks são testados contra a versão em memória do service (seção 2, regra 4), que **falha de propósito** quando o teste pede (rede caiu, 4xx). Mock de `lib/supabase` fica só nos testes do service real.
5. **Animação:** timers falsos + `toHaveAnimatedStyle` do Reanimated. O dock é conferido pela posição final (`translateX` × índice ativo) e pela opacidade do label, nunca por tempo de tela.
6. **Idiomas:** componentes com texto rodam nos três idiomas quando a largura importa (dock, botões, chips, pílulas).
7. **Isolamento:** cada teste limpa os stores (`setState` inicial) e o `QueryClient`; nada depende da ordem.
8. **Sem rede real** em testes de app; só `test:db` fala com o Supabase.
9. **Lint de teste:** `eslint-plugin-testing-library` nos arquivos `*.test.ts(x)` (configurado junto com as regras de nomenclatura, na tarefa de convenções).

### 11.5 Testes do banco (sem CLI)

Detalhe do que o plano pede, agora com as decisões do ADR:

- **Usuários de teste:** o Supabase limita criação de anônimos a **30 por hora por IP** (seção 8.3). Por isso o `test:db` cria **no máximo 2 usuários por execução** (A e B), em um `globalSetup`, e os reutiliza em todos os arquivos. No fim, os dois são apagados por `delete-my-data`, que também é testada. Duas execuções por hora cabem com folga; mais que ~12 por hora consomem a cota de IP, e o teste avisa isso na mensagem de falha.
- **Casos obrigatórios** (cada um com um caso negativo): A não lê nem escreve dados de B; **o cliente não consegue alterar `profiles.plan`** nem inserir direto em `suggestion_events`; a **4ª sugestão da semana é bloqueada**; repetir o `request_id` não cobra a cota duas vezes (seção 9.4); só `places` ativos aparecem, e lugar inativo já carimbado continua legível (9.5); **`stamps` com o mesmo `id` não duplica**; `anon` (sem login) não lê nada; `delete-my-data` apaga tudo do usuário (cascata).
- **O que `test:db` não alcança** vai para **`supabase/checks/*.sql`** (virada de semana, horário de verão, fusos): cada linha devolve `test, ok`, e todos os `ok` precisam ser `true`.
- **Quem roda:** o usuário aplica os scripts e preenche o `.env`; o loop só roda `npm run test:db` depois disso e quando a tarefa mexe no banco (protocolo, passo 5).
- **Dados de teste** carregam um prefixo reconhecível e são removidos no fim; nunca se toca nos dados do `seed_dev.sql`.

### 11.6 E2E (Maestro): opcional e fora do loop

- **Decisão:** **não entra antes da Fase 13.** Os fluxos são escritos pelo loop em `.maestro/` e **executados pelo usuário**, porque o loop não roda o app. Valor: um *smoke* do caminho principal (onboarding → Rolê → sugestão → carimbo → passaporte) e do modo avião.
- **Requisitos (doc atual):** Java 17+, o Maestro (no Windows, o `maestro.zip` no PATH) e um **dispositivo/emulador rodando**. Em **development build** usa-se `launchApp` com o `appId` (D20); no Expo Go seria `openLink` com a URL de desenvolvimento. iOS exige macOS; no Windows, **só Android**. A doc consultada não detalha o formato dos fluxos; conferir na Fase 13.
- Se o custo de manter os fluxos superar o ganho, o E2E vira só o roteiro 👀 do plano.

### 11.7 Verificação manual 👀 (o complemento dos testes)

O que os testes em Node **não** provam, e portanto continua com o usuário:

- Hermes: `Intl.PluralRules` (seção 10.5), nomes de dia/mês, fontes e renderização de texto;
- safe area, dock e home indicator, gestos de voltar, teclado;
- animações (fluidez a 60 fps, sombra do dock no Android);
- permissões (localização, notificações) e modo avião;
- desempenho de abertura e de lista.

Cada fase registra, em **Bloqueios**, um roteiro curto e numerado do que testar, como o plano já exige.

### 11.8 Portões de qualidade

- **A cada iteração do loop** (antes de marcar a tarefa): `npx expo lint`, `npx tsc --noEmit`, `npx jest` (a partir da Fase 2). Se a tarefa mexer no banco e os scripts já estiverem aplicados: `npm run test:db`. Tarefa que muda dependência ou rota também roda `npx expo export --platform android` (só gera o bundle).
- **A cada fim de fase:** `npx expo-doctor` e `jest --coverage` (confere o mínimo do `domain/`).
- **CI** (EAS Workflows ou GitHub Actions, a decidir na Fase 18): `lint`, `typecheck` e `test`; `test:db` fica **fora do CI** (depende de um projeto Supabase e de segredo de ambiente).
- **Cobertura:** limite **só em `domain/`** (90%). Nenhum limite global, para não incentivar teste vazio.

### 11.9 Riscos

| Risco | Tratamento |
|---|---|
| Teste em Node passar e o Hermes falhar (plural, `Intl`, fontes) | Critérios 👀 por fase (11.7) |
| `test:db` estourar o limite de 30 anônimos/hora | No máximo 2 usuários por execução, reuso em `globalSetup` (11.5) |
| Mocks demais escondendo bug de integração | Services em memória nos hooks; integração real no `test:db` |
| Teste de animação frágil | Assertar posição final e opacidade, não o tempo |
| Suíte lenta atrasando o loop | Camadas separadas; `test:db` fora do `npm test`; domínio sem React |
| Dependências de teste incompatíveis com o SDK 57 | Instalar com `npx expo install`; rodar o `expo-doctor` depois |
| Teste dentro de `src/app/` virar rota | Testes de rota em `tests/app/` e regra de lint/revisão |

## 12. ADR — Ambientes e segredos

**Status:** aceito em 02/10/2026. **Base:** doc de variáveis de ambiente do Expo, doc de variáveis do EAS (ambientes, visibilidade, `eas env:*`), doc do `eas.json`, e as seções 8 (Supabase) e 11 (testes). Decisões já tomadas: D18 (`role-dev` e `role-mvp`, produção separada só no pós-MVP) e o princípio "tudo que vai no app é público".

### 12.1 Ambientes

| | **Desenvolvimento** | **Preview (MVP)** | **Produção** (pós-MVP) |
|---|---|---|---|
| Quem usa | você, no aparelho/emulador | grupo de teste (D17) | público |
| Projeto Supabase | `role-dev` | `role-mvp` | `role-prod` (criado na Fase 19) |
| `EXPO_PUBLIC_APP_ENV` | `development` | `preview` | `production` |
| Origem das variáveis | arquivo **`.env`** local (ignorado pelo git) | ambiente **`preview`** do EAS | ambiente **`production`** do EAS |
| Perfil do `eas.json` | `development` (`developmentClient`, `distribution: internal`) | `preview` (`distribution: internal`, Android `apk`) | `production` (`distribution: store`, Android `app-bundle`) |
| Canal de EAS Update | — (o Metro serve o código) | `preview` | `production` |
| Dados | `seed_dev.sql`; pode ser apagado à vontade | catálogo curado (Fase 6/13); dados reais de testadores | catálogo curado; dados reais |
| Testes de integração | **`npm run test:db`** | só uma vez, antes dos testadores entrarem (12.4) | nunca |

- **Nada de dado de produção em desenvolvimento e vice-versa:** os projetos não compartilham usuário, banco, bucket nem chave.
- **O `role-prod` não existe no MVP.** Até a Fase 19 não há perfil `production` funcional; o plano já prevê a criação (Fase 19).
- **Limites do plano gratuito do Supabase** (pausa por inatividade, cotas) devem ser conferidos na doc atual ao criar cada projeto, no `docs/SUPABASE_SETUP.md`; as docs consultadas hoje não os detalham.

### 12.2 Variáveis

Lista **completa e fechada** do app no MVP (tudo público por natureza, porque é inlinado no bundle):

| Variável | Valor | Visibilidade no EAS |
|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | `development` \| `preview` \| `production` | plain text |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto | plain text |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key (`sb_publishable_...`, seção 8.4) | plain text |

Regras (doc do Expo):

1. **Só `EXPO_PUBLIC_*` entra no app** e **sempre por acesso estático** (`process.env.EXPO_PUBLIC_SUPABASE_URL`); `process.env[nome]` **não** é substituído no bundle.
2. **Leitura em um único lugar:** `src/lib/env.ts` lê cada variável de forma literal, **valida** (presença, `APP_ENV` conhecido, URL com `https`) e exporta um objeto tipado `env`. Faltou variável → **erro claro e imediato** (em desenvolvimento, mensagem apontando o `.env.example`; em release, falha na abertura em vez de um app meio quebrado). `lib/supabase.ts` e o analytics usam `env`, nunca `process.env` direto.
3. **Tipos:** `src/types/env.d.ts` declara as três variáveis em `ProcessEnv`.
4. **Mudou o `.env`?** Recarregar o app por completo (a doc avisa que o valor é inlinado).
5. **Arquivos `.env`:** o Expo carrega `.env`, `.env.local` e variantes por ordem de prioridade. O projeto usa **só o `.env`** (já no `.gitignore`, junto de `.env.*`, exceto `.env.example`). Não se troca de ambiente por `NODE_ENV`, como a doc manda: para apontar o local para outro projeto, edita-se o `.env` ou usa-se `eas env:pull`.
6. **`.env.example`** é versionado, sem valores, com as três chaves acima e um comentário por linha.
7. **`APP_ENV` vai junto de todo evento de analytics** (Fase 13), para o tráfego de `development` nunca contaminar as métricas do MVP.

### 12.3 Segredos: o que existe e onde mora

| Segredo | Onde fica | Nunca fica |
|---|---|---|
| Senha do banco do Supabase | com o usuário (gerenciador de senhas) | repositório, app, `.env`, conversa com o loop |
| **Secret key / `service_role`** | só dentro do Supabase: a Edge Function a lê da variável de ambiente que o próprio Supabase injeta (seção 8.8) | repositório, app, `.env`, `eas.json`, `test:db`, CI |
| Segredos de Edge Functions (ex.: webhook de pagamento, Fase 14) | *secrets* do editor de Edge Functions do dashboard | repositório |
| Credenciais de assinatura (Apple, Google) | gerenciadas pelo **EAS** (Fase 18) | repositório |
| `EXPO_TOKEN` para CI | cofre de segredos do provedor de CI (Fase 18) | repositório |
| Token do Sentry/Observe para source maps (D14) | variável do EAS com visibilidade **secret** (a DSN pública pode ser `EXPO_PUBLIC_`) | repositório, bundle |

- **Regra mestra do EAS (doc):** "tudo que vai no código do cliente é público". Por isso as três variáveis do app ficam como **plain text**; **não** se usa visibilidade *secret* para `EXPO_PUBLIC_*` (não faria sentido, o valor está no bundle) e **não** se cria `EXPO_PUBLIC_` para nada que seja segredo.
- **O loop nunca pede, lê nem guarda** senha, secret key ou `service_role`. O que o loop precisa (URL e publishable key do `role-dev`) está no `.env` do usuário e **não é commitado**.
- **Defesa em profundidade contra vazamento:**
  - `.gitignore` já cobre `.env`, `.env.*` e `supabase/.temp`;
  - antes de cada commit, o `git-commit` confere o `git status` (regra do plano);
  - **busca de segredos** por `service_role`, `SERVICE_ROLE` e `sb_secret_` nos arquivos versionados (`git grep`), feita no critério de saída da Fase 4 e no fim de cada fase;
  - se uma secret key vazar: **rotacionar no dashboard** (gerar nova e revogar a antiga) antes de qualquer outra ação; commit apagando o arquivo **não basta**, porque o histórico guarda o valor.
- **Preview e produção não usam `.env`:** o `.env` fica fora do que o EAS envia (o upload segue o `.gitignore`; confirmar na Fase 13). Cada build lê as variáveis do **ambiente do EAS** escolhido pelo campo `environment` do perfil no `eas.json` (`development`, `preview` ou `production`), então um build de testador nunca sai apontando para o `role-dev` por engano.

### 12.4 EAS, na prática (conferir os comandos na Fase 13)

- **Variáveis:** `eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment preview --visibility plaintext` (a página de gerenciamento da doc usa `env:set`; confirmar com `--help` ao executar), `eas env:list --environment preview` para conferir e `eas env:pull --environment development` para gerar o `.env` local quando for o caso.
- **`eas.json`:** cada perfil declara `environment` (`development`, `preview` ou `production`) e, nos de distribuição, o `channel` do EAS Update. Com `extends` para não repetir.
- **EAS Update:** desde o SDK 55 o `eas update` **exige** `--environment`; as correções para os testadores saem com `--environment preview` no canal `preview`.
- **`test:db` e proteção do `role-mvp`:** o script **aborta** se `EXPO_PUBLIC_APP_ENV` não for `development`. O teste de integração que o plano pede no `role-mvp` (Fase 13, **antes** de os testadores entrarem) exige um override explícito (`ALLOW_DB_TEST_ON=preview`, só naquela execução, informado pelo usuário). Depois que houver testador real, o `test:db` nunca roda lá.
- **Identificador do app (D20):** se for preciso instalar `development` e `preview` lado a lado no mesmo aparelho, o `app.config.ts` acrescenta um sufixo ao `bundleIdentifier`/`package` conforme o `APP_ENV`. Decisão junto da D20 (Fase 13); no MVP, o `app.json` atual basta.

### 12.5 Evolução do banco entre ambientes

- **Fluxo:** todo script SQL vai primeiro no `role-dev` e só depois no `role-mvp` (seção 8.2). O `APPLIED.md` mostra a diferença entre os dois ambientes, e o loop **não** marca uma fase como pronta com divergência não explicada.
- **Antes dos testadores (até a Fase 13):** o `role-mvp` recebe tudo de uma vez, na ordem, num único handoff.
- **Depois dos testadores:** mudança de schema só **aditiva e compatível com versões anteriores do app** (colunas novas opcionais, funções novas), porque há builds antigos em uso (a atualização por EAS Update só troca o JavaScript, não o que o aparelho já instalou). Remoção ou renomeação de coluna/RPC usa o padrão em duas etapas (adicionar o novo → migrar o app → remover o antigo depois).
- **Configurações fora do SQL** (sign-in anônimo, rate limit, bucket, secrets da função) são **por projeto**: o `docs/SUPABASE_SETUP.md` traz o mesmo checklist para os dois, e o handoff do `role-mvp` o repete inteiro.

### 12.6 Riscos

| Risco | Tratamento |
|---|---|
| Build de testador apontar para o `role-dev` | `environment` obrigatório por perfil; `.env` fora do upload (confirmar na Fase 13); `APP_ENV` validado em `src/lib/env.ts` |
| Secret key ou senha parar no repositório | `.gitignore`, `git grep` por fase, rotação imediata se vazar (12.3) |
| `test:db` apagar ou poluir dados reais | Aborta fora de `development`; usuários e dados de teste prefixados e removidos (seção 11.5) |
| Esquecer variável e o app abrir "meio quebrado" | `src/lib/env.ts` valida na abertura e falha com mensagem clara |
| Divergência entre `role-dev` e `role-mvp` | `APPLIED.md` por projeto e checklist de configurações idêntico |
| Dados de `development` entrarem nas métricas | `APP_ENV` em todo evento; filtrar `production`/`preview` na análise |
| Comando `eas env:*` ter mudado | Confirmar com `--help` na Fase 13 antes de executar |

## 13. Itens detalhados nas próximas tarefas da Fase 1

Esta seção é um índice. Cada item abaixo é uma tarefa própria do plano e vira uma seção deste documento quando for feita:

- Dependências planejadas
- Convenções de nomenclatura
- Decisões em aberto
