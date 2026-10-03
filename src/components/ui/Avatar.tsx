import { StyleSheet, View } from 'react-native';

import { borderWidth, colors } from '@/theme/tokens';

import { Text, type TextVariant } from './Text';

export type AvatarSize = 34 | 40 | 60;
export type AvatarTone = 'yellow' | 'blue' | 'cream' | 'sand';

const TONES: Record<AvatarTone, { background: string; foreground: string }> = {
  yellow: { background: colors.yellow, foreground: colors.ink },
  blue: { background: colors.blue, foreground: colors.cream },
  cream: { background: colors.cream, foreground: colors.ink },
  sand: { background: colors.sand, foreground: colors.ink },
};

/** Os três tamanhos do protótipo: Perfil (60), lista da Turma (40) e pilha de membros (34). */
const TEXT: Record<AvatarSize, TextVariant> = {
  60: 'avatar',
  40: 'badge',
  34: 'badge',
};

export interface AvatarProps {
  /** Uma ou duas letras já em caixa alta (ex.: "VC"). */
  initials: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  /** Sem nome, o avatar é decorativo (o nome da pessoa já está ao lado, no texto). */
  accessibilityLabel?: string;
}

/** Círculo com as iniciais, com contorno ink. */
export function Avatar({ initials, size = 40, tone = 'yellow', accessibilityLabel }: AvatarProps) {
  const palette = TONES[tone];
  return (
    <View
      accessible={accessibilityLabel != null}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel != null ? 'image' : undefined}
      importantForAccessibility={accessibilityLabel != null ? 'yes' : 'no-hide-descendants'}
      accessibilityElementsHidden={accessibilityLabel == null}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.background },
      ]}
    >
      <Text variant={TEXT[size]} color={palette.foreground}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
  },
});
