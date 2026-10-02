import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/features/navigation/TabScreen';

// "Em breve" no MVP (D4). A tela desenhada da Turma entra na Fase 17.
export default function CrewScreen() {
  const { t } = useTranslation();
  return <TabScreen title={t('tabs.crew')} message={t('crew.comingSoon')} />;
}
