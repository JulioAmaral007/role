import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';

import { WifiOff } from './icons/WifiOff';
import { Text } from './Text';

export interface OfflineBannerProps {
  /** Mensagem já traduzida (ex.: "Sem conexão. Seu passaporte continua aqui."). */
  label: string;
}

/** Faixa de aviso de falta de conexão. Anunciada ao aparecer, mas não interrompe o leitor. */
export function OfflineBanner({ label }: OfflineBannerProps) {
  return (
    <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.container}>
      <WifiOff size={18} color={colors.yellow} />
      <Text variant="pill" color={colors.yellow} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[14],
    paddingVertical: space[10],
    borderRadius: radius[14],
    borderCurve: 'continuous',
    backgroundColor: colors.ink,
  },
  text: {
    flex: 1,
  },
});
