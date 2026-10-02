import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { borderWidth, colors, space } from '@/theme/tokens';

const NOTCH_SIZE = 28;
const HEIGHT = 30;

export interface TicketDividerProps {
  /** Cor do fundo da tela, para os recortes laterais parecerem furos no ingresso. */
  notchColor?: string;
}

/**
 * Picote do ingresso: linha tracejada com um recorte em cada ponta. Deve ficar dentro de um
 * `Card` de tom `ticket`, que corta a metade de fora de cada recorte. Decorativo.
 */
export function TicketDivider({ notchColor = colors.yellow }: TicketDividerProps) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={styles.container}
    >
      <View style={[styles.notch, styles.notchStart, { backgroundColor: notchColor }]} />
      <Svg width="100%" height={borderWidth.regular} style={styles.line}>
        <Line
          x1={0}
          y1={borderWidth.regular / 2}
          x2="100%"
          y2={borderWidth.regular / 2}
          stroke={colors.ink}
          strokeWidth={borderWidth.regular}
          strokeDasharray="6 5"
        />
      </Svg>
      <View style={[styles.notch, styles.notchEnd, { backgroundColor: notchColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    justifyContent: 'center',
  },
  line: {
    marginHorizontal: space[24],
  },
  notch: {
    position: 'absolute',
    top: (HEIGHT - NOTCH_SIZE) / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
  },
  notchStart: {
    left: -16,
  },
  notchEnd: {
    right: -16,
  },
});
