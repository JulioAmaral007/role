# Rolê Aleatório — Arquitetura

> Documento vivo, construído na Fase 1 do `PLANO_DESENVOLVIMENTO.md`. Se a estrutura precisar mudar, **atualize este documento primeiro**.
> Base da arquitetura: skill **`react-native-architecture`** (`.claude/skills/react-native-architecture/`).
> Base das convenções de implementação: skill **`vercel-react-native-skills`** (seção "Convenções de implementação", adicionada em outra tarefa da fase).
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
| Nome de arquivo | `PascalCase` (`Button.tsx`, `useTheme.ts`) | **kebab-case** (`button.tsx`, `use-theme.ts`) | O template do Expo e o plano usam kebab-case. Prevalece o plano |
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

## 3. Itens detalhados nas próximas tarefas da Fase 1

Esta seção é um índice. Cada item abaixo é uma tarefa própria do plano e vira uma seção deste documento quando for feita:

- Convenções de implementação (`vercel-react-native-skills`)
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
