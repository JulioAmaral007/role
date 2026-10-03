import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { TabScreen } from '@/components/features/navigation/TabScreen';
import { SettingsSection } from '@/components/features/settings/SettingsSection';

// Fase 3: o botão do Plus (no protótipo é o card do plano) e a seção Ajustes. As preferências e o
// resto do Perfil vêm na Fase 11.
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  return (
    <TabScreen title={t('tabs.profile')}>
      <FlowButton label={t('plus.badge')} onPress={() => push({ pathname: '/plus', params: { source: 'profile' } })} />
      <SettingsSection />
    </TabScreen>
  );
}
