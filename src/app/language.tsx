import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';
import { LanguageOptions } from '@/components/features/settings/LanguageOptions';

export default function LanguageScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen title={t('settings.language')} dismiss="close">
      <LanguageOptions />
    </PlaceholderScreen>
  );
}
