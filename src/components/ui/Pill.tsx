import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderWidth, colors, radius, space } from '@/theme/tokens';

import type { IconProps } from './icons/Icon';
import { Text, type TextVariant } from './Text';

export type PillTone = 'ink' | 'yellow' | 'tag' | 'tagOutline';

const TONES: Record<
  PillTone,
  { background: string; foreground: string; text: TextVariant; border?: string }
> = {
  /** Pílula escura: ofensiva e "N restantes". */
  ink: { background: colors.ink, foreground: colors.yellow, text: 'pill' },
  /** Pílula amarela com número: progresso da meta ("3/3"). */
  yellow: { background: colors.yellow, foreground: colors.ink, text: 'statMd' },
  /** Tag azul do tipo de lugar. */
  tag: { background: colors.blue, foreground: colors.cream, text: 'label' },
  /** Tag com contorno: "Nunca carimbado". */
  tagOutline: { background: 'transparent', foreground: colors.ink, text: 'label', border: colors.ink },
};

export interface PillProps {
  label: string;
  tone?: PillTone;
  /** Ícone opcional antes do texto (o raio da ofensiva). */
  icon?: ComponentType<IconProps>;
}

export function Pill({ label, tone = 'ink', icon }: PillProps) {
  const IconComponent = icon;
  const palette = TONES[tone];
  const isTag = tone === 'tag' || tone === 'tagOutline';
  return (
    <View
      style={[
        styles.base,
        isTag ? styles.tag : styles.pill,
        { backgroundColor: palette.background },
        palette.border != null && { borderWidth: borderWidth.thin, borderColor: palette.border },
      ]}
    >
      {IconComponent != null && <IconComponent color={palette.foreground} />}
      <Text variant={palette.text} color={palette.foreground} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[6],
    borderRadius: radius.pill,
    borderCurve: 'continuous',
  },
  pill: {
    paddingHorizontal: space[12],
    paddingVertical: space[6],
  },
  tag: {
    paddingHorizontal: space[10],
    paddingVertical: space[4],
  },
  text: {
    flexShrink: 1,
  },
});
