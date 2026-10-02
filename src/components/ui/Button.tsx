import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, height, radius, space } from '@/theme/tokens';

import type { IconProps } from './icons/Icon';
import { Text, type TextVariant } from './Text';

// Botão composto (docs/ARCHITECTURE.md, seção 3.7): `Button` + `ButtonText` + `ButtonIcon`.
// Os filhos leem a cor e o estilo de texto da variante por contexto.

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'outlineInverse' | 'cream';
export type ButtonSize = 'compact' | 'medium' | 'cta' | 'large';

const VARIANTS: Record<ButtonVariant, { background: string; foreground: string; border?: string }> = {
  /** Ink com texto amarelo: CTA do Rolê e da Sugestão. */
  primary: { background: colors.ink, foreground: colors.yellow },
  /** Amarelo com texto ink: CTA sobre fundo escuro ou azul. */
  accent: { background: colors.yellow, foreground: colors.ink },
  /** Contorno ink sobre fundo claro: "Outra". */
  outline: { background: 'transparent', foreground: colors.ink, border: colors.ink },
  /** Contorno creme sobre fundo azul ou escuro: "Ver meu passaporte". */
  outlineInverse: { background: 'transparent', foreground: colors.cream, border: colors.cream },
  /** Creme com contorno ink: "Reservar" e "Como chegar". */
  cream: { background: colors.cream, foreground: colors.ink, border: colors.ink },
};

const SIZES: Record<ButtonSize, { height: number; radius: number; text: TextVariant }> = {
  compact: { height: height.buttonSecondary, radius: radius[14], text: 'button' },
  medium: { height: height.dockItem, radius: radius[16], text: 'buttonLarge' },
  cta: { height: height.cta, radius: radius[18], text: 'cta' },
  large: { height: height.ctaLarge, radius: radius[18], text: 'cta' },
};

interface ButtonContextValue {
  foreground: string;
  text: TextVariant;
}

const ButtonContext = createContext<ButtonContextValue>({ foreground: colors.ink, text: 'button' });

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `space-between` leva o ícone para a ponta direita (CTAs com seta). */
  justify?: 'center' | 'space-between';
  onPress?: () => void;
  disabled?: boolean;
  /** Só é preciso quando o botão não tem texto. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'cta',
  justify = 'center',
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
  children,
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const metrics = SIZES[size];
  return (
    <ButtonContext value={{ foreground: palette.foreground, text: metrics.text }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          {
            height: metrics.height,
            borderRadius: metrics.radius,
            backgroundColor: palette.background,
            justifyContent: justify,
            paddingHorizontal: justify === 'space-between' ? space[22] : space[18],
          },
          palette.border != null && { borderWidth: borderWidth.regular, borderColor: palette.border },
          disabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    </ButtonContext>
  );
}

export function ButtonText({ label }: { label: string }) {
  const { foreground, text } = useContext(ButtonContext);
  // uma linha só; se a tradução for longa, o texto encolhe um pouco em vez de estourar o botão
  return (
    <Text
      variant={text}
      color={foreground}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      style={styles.text}
    >
      {label}
    </Text>
  );
}

export function ButtonIcon({ icon }: { icon: ComponentType<IconProps> }) {
  const IconComponent = icon;
  const { foreground } = useContext(ButtonContext);
  return <IconComponent color={foreground} />;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[10],
    borderCurve: 'continuous',
  },
  text: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
