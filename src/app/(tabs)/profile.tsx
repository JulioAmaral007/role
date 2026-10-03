import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/features/navigation/TabScreen';
import { SettingsSection } from '@/components/features/settings/SettingsSection';

// Fase 3: só a seção Ajustes. As preferências e o resto do Perfil vêm na Fase 11.
export default function ProfileScreen() {
  const { t } = useTranslation();
  return (
    <TabScreen title={t('tabs.profile')}>
      <SettingsSection />
    </TabScreen>
  );
}
