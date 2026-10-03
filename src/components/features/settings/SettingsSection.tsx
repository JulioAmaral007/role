import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ListRow } from '@/components/ui/ListRow';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { getLanguageLabel } from '@/i18n/languageNames';
import { colors, space } from '@/theme/tokens';


/** Seção "Ajustes" do Perfil (D9). Por ora só a linha Idioma, que abre a rota `language`. */
export function SettingsSection() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const { preference } = useLanguage();
  const current = getLanguageLabel(preference, t('settings.languageSystem'));
  return (
    <View style={styles.section}>
      <SectionLabel label={t('settings.title')} tone="gray" />
      <ListRow
        title={t('settings.language')}
        trailing={<Text variant="body" color={colors.gray}>{current}</Text>}
        accessibilityLabel={`${t('settings.language')}, ${current}`}
        onPress={() => push('/language')}
        separator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[8],
  },
});
