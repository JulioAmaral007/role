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

- **Animar só `transform` e `opacity`** (`animation-gpu-properties`). Nada de `width`, `height`, `top`, `margin` nem `padding`. Exceção documentada para o dock em 3.8.
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
  - A regra "evitar vários tamanhos de fonte" da skill **não se aplica**: o protótipo define uma escala própria (`display`, `title`, `cta`, `body`, `label`, `stat`) em `theme/typography.ts`.
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
| `animation-gpu-properties` (só transform/opacity) | **Exceção só no dock:** o item ativo muda de largura. Implementar com Reanimated e um único shared value `activeIndex`; se a medição no aparelho mostrar queda de quadros, trocar por `scaleX` no fundo amarelo + `opacity` no label | São 3 itens e a largura é o que dá a leitura do protótipo. Validar no critério 👀 da Fase 2 |
| `fonts-config-plugin` | `useFonts` + splash até a Fase 13 | Compatível com Expo Go e mais simples de iterar |
| `ui-scrollview-content-inset` (`contentInset`) | Padding estático para o recuo do dock | `contentInset` é só iOS |
| `ui-styling` (poucos tamanhos de fonte) | Escala tipográfica própria do protótipo | Identidade visual |
| `list-performance-virtualize` (virtualizar tudo) | Grades fixas e pequenas ficam em `View` | Nada a virtualizar; layout em grade mais simples |
| `list-performance-item-memo`/`callbacks` (`memo`, `useCallback`) | Não usar por padrão | React Compiler ligado |

Divergências novas devem entrar nesta tabela e no Registro de iterações do plano.

## 4. Itens detalhados nas próximas tarefas da Fase 1

Esta seção é um índice. Cada item abaixo é uma tarefa própria do plano e vira uma seção deste documento quando for feita:

- Estrutura de pastas definitiva
- Mapa de navegação e deep links
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
