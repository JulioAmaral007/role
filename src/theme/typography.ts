import type { TextStyle } from 'react-native';

import { fontFamily } from './fonts';

// Escala tipográfica (decisão de 02/10/2026, PLANO_DESENVOLVIMENTO.md): o protótipo usa ~18
// tamanhos; o corpo e os rótulos consolidam em 4, conforme a regra `ui-styling`, e os tamanhos de
// display do protótipo ficam como identidade visual. Dentro do mesmo tamanho, a hierarquia vem de
// peso e cor. Nenhum `fontSize` é escrito fora deste arquivo.

/** Corpo e rótulos. */
export const size = {
  /** Rótulos mono em caixa alta, tags, legendas, pílulas (protótipo: 11, 12, 13). */
  xs: 12,
  /** Corpo, chips, botões secundários, label do dock (protótipo: 14, 15). */
  sm: 14,
  /** Parágrafos de destaque, títulos de card, preço do plano (protótipo: 16, 17, 18). */
  md: 16,
  /** CTAs principais (protótipo: 19, 20, 21). */
  lg: 20,
} as const;

/** Tamanhos de display, iguais ao protótipo. */
export const displaySize = [28, 32, 34, 38, 44, 50, 64] as const;
export type DisplaySize = (typeof displaySize)[number];

/** Espaçamento entre letras: o protótipo escreve em `em`, o React Native pede pontos. */
const em = (fontSize: number, ratio: number) => Math.round(fontSize * ratio * 100) / 100;
/** Altura de linha: o protótipo escreve a razão, o React Native pede pontos. */
const lineHeightOf = (fontSize: number, ratio: number) => Math.round(fontSize * ratio);

function displayStyle(fontSize: DisplaySize, letterSpacingEm: number, lineHeightRatio: number): TextStyle {
  return {
    fontFamily: fontFamily.display.extraBold,
    fontSize,
    lineHeight: lineHeightOf(fontSize, lineHeightRatio),
    letterSpacing: em(fontSize, letterSpacingEm),
  };
}

/** Variantes prontas. Escolher pela intenção do texto, não pelo tamanho. */
export const typography = {
  /** Títulos de tela e números grandes (Bricolage 800), por tamanho. */
  display: {
    28: displayStyle(28, 0, 1),
    32: displayStyle(32, -0.03, 1.05),
    34: displayStyle(34, -0.035, 1.02),
    38: displayStyle(38, -0.04, 1),
    44: displayStyle(44, -0.04, 0.98),
    50: displayStyle(50, -0.04, 0.95),
    64: displayStyle(64, -0.04, 1),
  },
  /** Títulos de seção e de card (Instrument Sans 700). */
  title: {
    fontFamily: fontFamily.body.bold,
    fontSize: size.md,
  },
  /** Texto dos CTAs principais (Bricolage 700). */
  cta: {
    fontFamily: fontFamily.display.bold,
    fontSize: size.lg,
    letterSpacing: em(size.lg, -0.01),
  },
  /** Preço do plano (Bricolage 700). */
  price: {
    fontFamily: fontFamily.display.bold,
    fontSize: size.md,
  },
  /** Marca em texto (Bricolage 800). */
  wordmark: {
    fontFamily: fontFamily.display.extraBold,
    fontSize: size.lg,
    letterSpacing: em(size.lg, -0.02),
  },
  /** Corpo (Instrument Sans 400). */
  body: {
    fontFamily: fontFamily.body.regular,
    fontSize: size.sm,
    lineHeight: lineHeightOf(size.sm, 1.4),
  },
  /** Parágrafo de destaque (Instrument Sans 400). */
  bodyLarge: {
    fontFamily: fontFamily.body.regular,
    fontSize: size.md,
    lineHeight: lineHeightOf(size.md, 1.45),
  },
  /** Chips e botões secundários (Instrument Sans 600). */
  button: {
    fontFamily: fontFamily.body.semiBold,
    fontSize: size.sm,
  },
  /** Label do item ativo do dock (Instrument Sans 700). */
  tabLabel: {
    fontFamily: fontFamily.body.bold,
    fontSize: size.sm,
  },
  /** Legendas (Instrument Sans 500). */
  caption: {
    fontFamily: fontFamily.body.medium,
    fontSize: size.xs,
    lineHeight: lineHeightOf(size.xs, 1.15),
  },
  /** Texto das pílulas (Instrument Sans 600). */
  pill: {
    fontFamily: fontFamily.body.semiBold,
    fontSize: size.xs,
  },
  /** Rótulos em caixa alta (DM Mono 500). */
  label: {
    fontFamily: fontFamily.mono.medium,
    fontSize: size.xs,
    letterSpacing: em(size.xs, 0.08),
    textTransform: 'uppercase',
  },
  /** Estatísticas: número grande (Bricolage 800, 28) e número de card (Bricolage 800, 16). */
  stat: {
    lg: displayStyle(28, 0, 1),
    md: {
      fontFamily: fontFamily.display.extraBold,
      fontSize: size.md,
    },
  },
} as const satisfies Record<string, TextStyle | Record<string, TextStyle>>;
