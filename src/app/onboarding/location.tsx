import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/Button';
import { Back } from '@/components/ui/icons/Back';
import { Text } from '@/components/ui/Text';
import { useOnboarding } from '@/hooks/useOnboarding';
import { borderWidth, colors, height, layout, radius, space } from '@/theme/tokens';

// Placeholder da Fase 3. "Usar minha localização" ainda não pede a permissão (Fase 7): só conclui o
// onboarding. "Agora não" leva a "Sem localização".
export default function LocationScreen() {
  const { t } = useTranslation();
  const { back, push } = useRouter();
  const { completeOnboarding } = useOnboarding();
  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.back')}
        onPress={() => back()}
        style={styles.back}
      >
        <Back />
      </Pressable>
      <Text variant="display38" accessibilityRole="header" style={styles.title}>
        {t('onboarding.location.title')}
      </Text>
      <View style={styles.actions}>
        <Button size="cta" onPress={completeOnboarding}>
          <ButtonText label={t('onboarding.location.useLocation')} />
        </Button>
        <Button variant="outline" size="medium" onPress={() => push('/onboarding/no-location')}>
          <ButtonText label={t('onboarding.location.notNow')} />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: space[20],
    paddingTop: layout.screenPaddingTop,
    paddingBottom: layout.screenPaddingBottom,
    paddingHorizontal: layout.screenPaddingX,
    backgroundColor: colors.cream,
  },
  back: {
    width: height.chip,
    height: height.chip,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
  },
  title: {
    flex: 1,
  },
  actions: {
    gap: space[10],
  },
});
