import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, height, radius, space } from '@/theme/tokens';

import { Text } from './Text';

export type MultiChipSize = 'regular' | 'compact';

/** `regular` é o chip de 44 do "Como foi"; `compact` é o de 40 do Perfil. */
const SIZES: Record<MultiChipSize, { height: number; paddingHorizontal: number }> = {
  regular: { height: height.chip, paddingHorizontal: space[16] },
  compact: { height: 40, paddingHorizontal: space[14] },
};

// o chip compacto tem 40 de altura no desenho; a área de toque completa o que falta para 44
const COMPACT_HIT_SLOP = (height.minTouch - 40) / 2;

export interface MultiChipProps {
  label: string;
  /** Seleção múltipla: cada chip liga e desliga sozinho. */
  checked: boolean;
  onPress: () => void;
  size?: MultiChipSize;
}

/** Chip de seleção múltipla, anunciado como caixa de seleção (`accessibilityState.checked`). */
export function MultiChip({ label, checked, onPress, size = 'regular' }: MultiChipProps) {
  const metrics = SIZES[size];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={size === 'compact' ? { top: COMPACT_HIT_SLOP, bottom: COMPACT_HIT_SLOP } : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: metrics.height, paddingHorizontal: metrics.paddingHorizontal },
        checked && styles.checked,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="button" color={checked ? colors.yellow : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
    backgroundColor: 'transparent',
  },
  checked: {
    backgroundColor: colors.ink,
  },
  pressed: {
    opacity: 0.85,
  },
});
