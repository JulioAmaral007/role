import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, space } from '@/theme/tokens';

import { Text } from './Text';

const MIN_HEIGHT = 52;

export interface ListRowProps {
  title: string;
  /** Segunda linha, menor e em cinza (ex.: "Sebo · ontem"). */
  subtitle?: string;
  /** À esquerda do texto, como um `Avatar`. */
  leading?: ReactNode;
  /** À direita do texto, como um `Switch` ou um botão. */
  trailing?: ReactNode;
  /** Com `onPress` a linha inteira vira um botão. */
  onPress?: () => void;
  /** Linha divisória de baixo (`lineSoft`, 1,5). Desligue na última linha do bloco. */
  separator?: boolean;
  /** Só é preciso quando o nome falado difere do `title`. */
  accessibilityLabel?: string;
}

/** Linha de lista do Perfil e da Turma, com separador. */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  separator = true,
  accessibilityLabel,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View style={styles.texts}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle != null && (
          <Text variant="caption" color={colors.gray}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
    </>
  );
  const rowStyle = [styles.row, subtitle != null && styles.withSubtitle, separator && styles.separator];

  if (onPress != null) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View accessibilityLabel={accessibilityLabel} style={rowStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  withSubtitle: {
    paddingVertical: 11,
  },
  separator: {
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.lineSoft,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
  },
  pressed: {
    opacity: 0.85,
  },
});
