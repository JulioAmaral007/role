import type { ErrorBoundaryProps } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/ui/ErrorState';
import { colors } from '@/theme/tokens';

/**
 * Tela de erro de rota (docs/ARCHITECTURE.md, seção 5.5). O Expo Router a usa quando uma tela lança
 * durante o render; erros de rede **não** passam por aqui, viram o estado da própria tela. Usa o
 * i18next global (e não o provider), porque o erro pode ter acontecido acima dele.
 */
export function RootErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.screen}>
      <ErrorState
        title={t('error.title')}
        message={t('error.message')}
        retryLabel={t('error.retry')}
        onRetry={retry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.yellow,
  },
});
