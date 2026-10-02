import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, height, radius } from '@/theme/tokens';

// Interruptor da marca (Perfil > Ajustes). O do `@expo/ui` não serve: o universal não aceita cor
// (só `modifiers` por plataforma) e o protótipo desenha o seu: trilho de 52×32, bolinha de 26.
const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const KNOB = 26;
const INSET = 3;
const TRAVEL = TRACK_WIDTH - INSET * 2 - KNOB;
const TOUCH_WIDTH = 56;
const DURATION = 160;

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** O que o interruptor liga ou desliga. Obrigatório: o desenho não tem texto. */
  accessibilityLabel: string;
  disabled?: boolean;
}

/**
 * Animação só com `transform` e `opacity`: a bolinha desliza com `translateX` e as cores trocam por
 * um fundido de camadas (trilho ink sobre trilho `line`; bolinha amarela sobre bolinha creme).
 * `progress` (0 ou 1) é a única fonte da animação; a verdade é a prop `value`.
 */
export function Switch({ value, onValueChange, accessibilityLabel, disabled = false }: SwitchProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(value ? 1 : 0, { duration: DURATION }));
  }, [value, progress]);

  const knobPosition = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * TRAVEL }],
  }));
  // um estilo animado por view: o mesmo resultado de `useAnimatedStyle` em duas views atualiza só uma
  const trackOnOpacity = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const knobOnOpacity = useAnimatedStyle(() => ({ opacity: progress.get() }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.touch, disabled && styles.disabled]}
    >
      <View style={styles.track}>
        <Animated.View testID="switch-track-on" style={[styles.trackOn, trackOnOpacity]} />
        <Animated.View testID="switch-knob" style={[styles.knobSlot, knobPosition]}>
          <View style={[styles.knob, styles.knobOff]} />
          <Animated.View style={[styles.knob, styles.knobOn, knobOnOpacity]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    width: TOUCH_WIDTH,
    height: height.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    backgroundColor: colors.line,
  },
  trackOn: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    backgroundColor: colors.ink,
  },
  knobSlot: {
    position: 'absolute',
    top: INSET,
    left: INSET,
    width: KNOB,
    height: KNOB,
  },
  knob: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
  },
  knobOff: {
    backgroundColor: colors.cream,
  },
  knobOn: {
    backgroundColor: colors.yellow,
  },
});
