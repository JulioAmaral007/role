import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/components/ui/Button';
import { Arrow } from '@/components/ui/icons/Arrow';
import { Text } from '@/components/ui/Text';
import { colors, layout, space } from '@/theme/tokens';

// Placeholder da Fase 3: só o título e o "Começar" do protótipo. A tela fiel (cartões de exemplo,
// texto e aceite dos Termos) é da Fase 7.
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  return (
    <View style={styles.screen}>
      <Text variant="display38" accessibilityRole="header">
        {t('onboarding.welcome.title')}
      </Text>
      <Button size="large" justify="space-between" onPress={() => push('/onboarding/location')}>
        <ButtonText label={t('onboarding.welcome.start')} />
        <ButtonIcon icon={Arrow} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    gap: space[20],
    paddingTop: layout.screenPaddingTop,
    paddingBottom: layout.screenPaddingBottom,
    paddingHorizontal: layout.screenPaddingX,
    backgroundColor: colors.yellow,
  },
});
