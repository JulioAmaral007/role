import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/features/navigation/TabScreen';

// Placeholder da Fase 3. O Perfil (preferências e Ajustes, com o idioma) vem nas próximas tarefas.
export default function ProfileScreen() {
  const { t } = useTranslation();
  return <TabScreen title={t('tabs.profile')} />;
}
