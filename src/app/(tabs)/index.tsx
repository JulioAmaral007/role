import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/features/navigation/TabScreen';

// Placeholder da Fase 3. A home de verdade (filtros, CTA e contador) é da Fase 8.
export default function HomeScreen() {
  const { t } = useTranslation();
  return <TabScreen title={t('home.title')} />;
}
