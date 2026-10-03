import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Back } from '@/components/ui/icons/Back';
import { Close } from '@/components/ui/icons/Close';
import { Text } from '@/components/ui/Text';
import { borderWidth, colors, height, layout, radius, space } from '@/theme/tokens';

export interface PlaceholderScreenProps {
  title: string;
  /** Texto de apoio abaixo do título (ex.: o id recebido pela rota). */
  message?: string;
  /** `back` nas telas empilhadas (push); `close` nos modais. */
  dismiss?: 'back' | 'close';
}

/**
 * Corpo provisório das rotas da Fase 3: topo com voltar/fechar e o título da tela. Cada tela real
 * (Fases 8 a 12) troca este componente pelo seu próprio conteúdo e mantém a rota.
 */
export function PlaceholderScreen({ title, message, dismiss = 'back' }: PlaceholderScreenProps) {
  const { t } = useTranslation();
  const { back, canGoBack, replace } = useRouter();
  // um deep link pode abrir a rota sem nada embaixo (sem âncora, em teste): nesse caso vai para o Rolê
  const onDismiss = () => (canGoBack() ? back() : replace('/'));
  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dismiss === 'close' ? t('a11y.close') : t('a11y.back')}
        onPress={onDismiss}
        style={styles.dismiss}
      >
        {dismiss === 'close' ? <Close /> : <Back />}
      </Pressable>
      <Text variant="display34" accessibilityRole="header">
        {title}
      </Text>
      {message != null && <Text variant="bodyLarge">{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: space[20],
    paddingTop: layout.screenPaddingTop,
    paddingHorizontal: layout.screenPaddingX,
    backgroundColor: colors.cream,
  },
  dismiss: {
    width: height.chip,
    height: height.chip,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
  },
});
