import { colors } from '@/theme/tokens';

import { Text } from './Text';

export type SectionLabelTone = 'olive' | 'gray' | 'lavender' | 'yellow';

const TONE_COLORS: Record<SectionLabelTone, string> = {
  /** Sobre fundo amarelo (Rolê). */
  olive: colors.olive,
  /** Sobre creme (card da sugestão). */
  gray: colors.gray,
  /** Sobre azul (Carimbo). */
  lavender: colors.lavender,
  /** Sobre fundo escuro (Plus). */
  yellow: colors.yellow,
};

export interface SectionLabelProps {
  label: string;
  tone?: SectionLabelTone;
}

/** Rótulo de seção em caixa alta (DM Mono). Anunciado como título para leitor de tela. */
export function SectionLabel({ label, tone = 'olive' }: SectionLabelProps) {
  return (
    <Text variant="label" color={TONE_COLORS[tone]} accessibilityRole="header">
      {label}
    </Text>
  );
}
