import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/features/navigation/TabScreen';

// Placeholder da Fase 3. O Passaporte de verdade é da Fase 11.
export default function PassportScreen() {
  const { t } = useTranslation();
  return <TabScreen title={t('passport.title')} />;
}
