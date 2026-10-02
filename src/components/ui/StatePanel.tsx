import type { ComponentType } from 'react';
import { StyleSheet, View, type AccessibilityRole } from 'react-native';

import { borderWidth, colors, radius, space } from '@/theme/tokens';

import { Button, ButtonText } from './Button';
import type { IconProps } from './icons/Icon';
import { Text } from './Text';

const ICON_BADGE_SIZE = 64;

export interface StatePanelProps {
  icon?: ComponentType<IconProps>;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  accessibilityRole?: AccessibilityRole;
}

/**
 * Painel de estado de tela (vazio, erro): ícone, título, mensagem e uma ação. Todo texto vem de
 * quem usa, porque `ui/` não conhece o domínio nem o idioma.
 */
export function StatePanel({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  accessibilityRole,
}: StatePanelProps) {
  const IconComponent = icon;
  return (
    <View accessibilityRole={accessibilityRole} style={styles.container}>
      {IconComponent != null && (
        <View style={styles.badge}>
          <IconComponent size={28} />
        </View>
      )}
      <Text variant="display28" style={styles.centered}>
        {title}
      </Text>
      {message != null && (
        <Text variant="bodyLarge" color={colors.gray} style={styles.centered}>
          {message}
        </Text>
      )}
      {actionLabel != null && onAction != null && (
        <Button variant="primary" size="medium" onPress={onAction} style={styles.action}>
          <ButtonText label={actionLabel} />
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[20],
    paddingVertical: space[24],
  },
  badge: {
    width: ICON_BADGE_SIZE,
    height: ICON_BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
    backgroundColor: colors.cream,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: space[6],
  },
});
