import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { colors } from '@/theme/tokens';
import { typography } from '@/theme/typography';

// Texto do design system: as telas importam este `Text` (e não o do react-native), escolhem a
// variante pela intenção e a cor pelos tokens (docs/ARCHITECTURE.md, seção 3.7).
const VARIANT_STYLES = {
  display28: typography.display[28],
  display32: typography.display[32],
  display34: typography.display[34],
  display38: typography.display[38],
  display44: typography.display[44],
  display50: typography.display[50],
  display64: typography.display[64],
  title: typography.title,
  cta: typography.cta,
  price: typography.price,
  wordmark: typography.wordmark,
  body: typography.body,
  bodyLarge: typography.bodyLarge,
  button: typography.button,
  buttonLarge: typography.buttonLarge,
  tabLabel: typography.tabLabel,
  caption: typography.caption,
  pill: typography.pill,
  label: typography.label,
  statLg: typography.stat.lg,
  statMd: typography.stat.md,
} as const;

export type TextVariant = keyof typeof VARIANT_STYLES;

export interface TextProps extends NativeTextProps {
  /** Intenção do texto. Padrão: `body`. */
  variant?: TextVariant;
  /** Cor do texto, vinda de `colors`. Padrão: `ink`. */
  color?: string;
}

export function Text({ variant = 'body', color = colors.ink, style, ...rest }: TextProps) {
  return <NativeText {...rest} style={[VARIANT_STYLES[variant], { color }, style]} />;
}
