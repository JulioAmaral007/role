import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, height, radius, space } from '@/theme/tokens';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  /** Seleção única: só um chip do grupo fica selecionado. */
  selected: boolean;
  onPress: () => void;
}

/** Chip de seleção (humor no Rolê). O estado selecionado vai para a acessibilidade. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text variant="button" color={selected ? colors.yellow : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: height.chip,
    paddingHorizontal: space[18],
    paddingVertical: space[6],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
    backgroundColor: 'transparent',
  },
  selected: {
    backgroundColor: colors.ink,
  },
  pressed: {
    opacity: 0.85,
  },
});
