import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius, space } from '@/theme/tokens';

export type CardTone = 'ticket' | 'outline' | 'blue' | 'blueDark';

const TONES: Record<CardTone, ViewStyle> = {
  /** Ingresso da sugestão: creme, contorno ink, sem padding (o conteúdo traz o seu). */
  ticket: {
    backgroundColor: colors.cream,
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
    borderRadius: radius[24],
    overflow: 'hidden',
  },
  /** Bloco com contorno sobre creme: ofensiva semanal. */
  outline: {
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
    borderRadius: radius[20],
    paddingVertical: space[14],
    paddingHorizontal: space[16],
  },
  /** Bloco azul: meta do mês no Passaporte. */
  blue: {
    backgroundColor: colors.blue,
    borderRadius: radius[20],
    paddingVertical: space[14],
    paddingHorizontal: space[16],
  },
  /** Bloco azul escuro: meta na tela de Carimbo. */
  blueDark: {
    backgroundColor: colors.blueDark,
    borderRadius: radius[20],
    paddingVertical: space[16],
    paddingHorizontal: space[18],
  },
};

export interface CardProps {
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Card({ tone = 'outline', style, children }: CardProps) {
  return <View style={[styles.base, TONES[tone], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderCurve: 'continuous',
  },
});
