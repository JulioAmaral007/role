import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

const SEGMENT_HEIGHT = 10;

export interface ProgressSegmentsProps {
  total: number;
  /** Quantos segmentos estão preenchidos (limitado entre 0 e `total`). */
  filled: number;
  color?: string;
  /** Cor do segmento vazio. */
  trackColor?: string;
  /** Descrição para leitor de tela (ex.: "Meta de outubro"). */
  accessibilityLabel?: string;
}

/** Barra de progresso em segmentos de mesma largura (meta do mês). */
export function ProgressSegments({
  total,
  filled,
  color = colors.yellow,
  trackColor = colors.blue,
  accessibilityLabel,
}: ProgressSegmentsProps) {
  const current = Math.min(Math.max(Math.round(filled), 0), total);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: total, now: current }}
      style={styles.row}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.segment, { backgroundColor: index < current ? color : trackColor }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space[6],
  },
  segment: {
    flex: 1,
    height: SEGMENT_HEIGHT,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
  },
});
