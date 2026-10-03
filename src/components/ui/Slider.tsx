import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors, height, radius } from '@/theme/tokens';
import { positionToValue, snapToStep, valueToFraction } from '@/utils/slider';

// Controle deslizante da marca (Perfil: "Distância máxima"). O do `@expo/ui` não serve pelo mesmo
// motivo do `Switch`: o universal não aceita cor, e o protótipo usa o trilho `line` com o trecho
// vencido em ink. O gesto roda no JS (`runOnJS`): o valor é a prop `value`, a verdade do componente.
const THUMB = 28;
const TRACK_HEIGHT = 6;

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** O que o controle ajusta (ex.: "Distância máxima"). */
  accessibilityLabel: string;
  /** Valor falado para leitor de tela (ex.: "5 km"); sem ele, vale o número. */
  valueText?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  accessibilityLabel,
  valueText,
  disabled = false,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const usable = Math.max(width - THUMB, 0);
  const current = snapToStep(value, min, max, step);
  const travel = valueToFraction(current, min, max) * usable;

  const handleLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((previous) => (previous === next ? previous : next));
  };

  const moveTo = (x: number) => {
    // o toque mede o centro do círculo: desconta meio círculo do início
    const next = positionToValue(x - THUMB / 2, usable, min, max, step);
    if (next !== current) onValueChange(next);
  };

  const pan = Gesture.Pan()
    .withTestId('slider-pan')
    .runOnJS(true)
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((event) => moveTo(event.x))
    .onUpdate((event) => moveTo(event.x));

  const adjust = (direction: 1 | -1) => {
    const next = snapToStep(current + direction * step, min, max, step);
    if (next !== current) onValueChange(next);
  };

  return (
    <GestureDetector gesture={pan}>
      <View
        testID="slider"
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: current, text: valueText }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') adjust(1);
          if (event.nativeEvent.actionName === 'decrement') adjust(-1);
        }}
        onLayout={handleLayout}
        style={[styles.touch, disabled && styles.disabled]}
      >
        <View style={styles.track}>
          {/* trecho vencido: uma camada do tamanho do trilho, deslocada com `transform` */}
          <View
            testID="slider-fill"
            style={[styles.fill, { transform: [{ translateX: travel + THUMB / 2 - width }] }]}
          />
        </View>
        <View testID="slider-thumb" style={[styles.thumb, { transform: [{ translateX: travel }] }]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touch: {
    height: height.minTouch,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    height: TRACK_HEIGHT,
    overflow: 'hidden',
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    backgroundColor: colors.line,
  },
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.ink,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
});
