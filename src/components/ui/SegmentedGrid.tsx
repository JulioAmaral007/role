import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, height, radius, space } from '@/theme/tokens';

import { Text } from './Text';

export interface SegmentedOption<Id extends string> {
  id: Id;
  label: string;
}

export interface SegmentedGridProps<Id extends string> {
  options: readonly SegmentedOption<Id>[];
  /** `undefined` = nada escolhido ainda (a tela decide o padrão). */
  value: Id | undefined;
  onChange: (id: Id) => void;
  /** Células por linha. Padrão: 4 (tempo e orçamento do Rolê). */
  columns?: number;
  /** Nome do grupo para leitor de tela. */
  accessibilityLabel?: string;
}

function toRows<Item>(items: readonly Item[], size: number): (Item | null)[][] {
  const rows: (Item | null)[][] = [];
  for (let start = 0; start < items.length; start += size) {
    const row: (Item | null)[] = items.slice(start, start + size);
    while (row.length < size) row.push(null);
    rows.push(row);
  }
  return rows;
}

/** Grade de opções de seleção única, com células de largura igual. */
export function SegmentedGrid<Id extends string>({
  options,
  value,
  onChange,
  columns = 4,
  accessibilityLabel,
}: SegmentedGridProps<Id>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.grid}>
      {toRows(options, columns).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((option, cellIndex) =>
            option == null ? (
              <View key={`empty-${cellIndex}`} style={styles.cell} />
            ) : (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: option.id === value }}
                onPress={() => onChange(option.id)}
                style={({ pressed }) => [
                  styles.cell,
                  styles.option,
                  option.id === value && styles.selected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  variant="button"
                  color={option.id === value ? colors.yellow : colors.ink}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {option.label}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: space[6],
  },
  row: {
    flexDirection: 'row',
    gap: space[6],
  },
  cell: {
    flex: 1,
  },
  option: {
    height: height.segment,
    paddingHorizontal: space[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius[14],
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
