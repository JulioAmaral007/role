import type { BoxShadowValue } from 'react-native';

// Tokens de design do Rolê Aleatório. Fonte: protótipo (`assets/Rolê Aleatório.html`) e a tabela
// "Referência rápida" do PLANO_DESENVOLVIMENTO.md. Tipografia e fontes ficam em `typography.ts`.
// Nenhuma tela ou componente usa cor ou medida solta: tudo vem daqui.

export const colors = {
  /** Fundo principal, destaques, texto sobre escuro. */
  yellow: '#FFD43B',
  /** Texto, bordas de 2px, botões primários, fundo do Plus. */
  ink: '#141414',
  /** Cards e fundo do Passaporte. */
  cream: '#FFFBEF',
  /** Tela de Carimbo, tags, células carimbadas do bingo. */
  blue: '#2B3FD6',
  /** Card de meta na tela de Carimbo. */
  blueDark: '#1E2DA6',
  /** Texto secundário sobre azul. */
  lavender: '#E6E9FF',
  /** Rótulos e legendas sobre amarelo. */
  olive: '#3A3200',
  /** Texto secundário sobre creme. */
  gray: '#55524A',
  /** Semana perdida (borda tracejada). */
  grayLight: '#8C887C',
  /** Faixa clara do placeholder listrado da foto. */
  stripe: '#F0E8CF',
  /** Ícones inativos do dock e texto secundário do Plus. */
  sand: '#D6D2C6',
  /** Paywall escuro. */
  plus: {
    /** Cabeçalho da tabela Grátis × Plus. */
    tableHeader: '#222220',
    /** Bordas e divisórias da tabela e do plano não selecionado. */
    border: '#4A4842',
    /** Fundo do plano selecionado. */
    selected: '#2A2614',
  },
} as const;

/** Escala de espaço (gap, padding e margem) usada pelo protótipo, em pontos. */
export const space = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
} as const;

/** Medidas de layout das telas. */
export const layout = {
  /** Recuo lateral de todas as telas. */
  screenPaddingX: 20,
  /** Recuo superior das telas (abaixo da barra de status). */
  screenPaddingTop: 52,
  /** Recuo inferior das telas sem dock. */
  screenPaddingBottom: 24,
  /** Largura do aparelho de referência do protótipo. */
  referenceWidth: 390,
} as const;

/** Raios de borda. `pill` serve para pílulas e círculos. */
export const radius = {
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  24: 24,
  pill: 999,
} as const;

/** Espessuras de borda. */
export const borderWidth = {
  /** Divisórias e tags. */
  thin: 1.5,
  /** Borda padrão do visual: sólida, na cor `ink`. */
  regular: 2,
  /** Contorno de destaque (selo). */
  thick: 3,
} as const;

/** Alturas e áreas de toque. Todo alvo de toque tem pelo menos `minTouch`. */
export const height = {
  /** Menor alvo de toque permitido. */
  minTouch: 44,
  /** Chip de seleção do humor e botão circular (voltar, fechar). */
  chip: 44,
  /** Célula da grade de tempo e orçamento. */
  segment: 48,
  /** Botão secundário (Outra, Reservar, Como chegar). */
  buttonSecondary: 50,
  /** Item do dock. */
  dockItem: 52,
  /** CTA principal da Sugestão e do Plus. */
  cta: 58,
  /** CTA principal do Rolê. */
  ctaLarge: 62,
  /** Quadrado do ícone dos motivos da sugestão. */
  iconBadge: 36,
} as const;

/** Dock flutuante (tab bar). Ver a seção "Tab bar — dock flutuante" do plano. */
export const dock = {
  /** Recuo do dock até as laterais da tela. */
  sideMargin: 20,
  /** Recuo do dock até a base (somar o safe area inferior). */
  bottomMargin: 22,
  /** Padding interno da pílula. */
  padding: 6,
  /** Espaço entre os itens. */
  gap: 4,
  /** Largura do item inativo (só ícone). */
  inactiveItemWidth: 64,
  /** Tamanho do ícone. */
  iconSize: 22,
  /** Recuo inferior das telas com tabs, sem o safe area (o dock fica por cima do conteúdo). */
  baseInset: 106,
} as const;

const SHADOW_COLOR = '20, 20, 20';

/** Sombras, no formato `boxShadow` do React Native. */
export const shadow = {
  dock: [
    { offsetX: 0, offsetY: 12, blurRadius: 32, color: `rgba(${SHADOW_COLOR}, 0.28)` },
    { offsetX: 0, offsetY: 2, blurRadius: 6, color: `rgba(${SHADOW_COLOR}, 0.18)` },
  ],
} as const satisfies Record<string, BoxShadowValue[]>;
