import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: a tela real troca só o corpo e mantém a rota.
export default function OnTheWayScreen() {
  const { t } = useTranslation();
  const { push, dismissTo } = useRouter();
  return (
    <PlaceholderScreen title={t('onTheWay.title')}>
      <FlowButton variant="primary" label={t('onTheWay.arrived')} onPress={() => push('/feedback')} />
      {/* cancela o rolê e volta para a Sugestão que está embaixo (ou a abre, se não houver) */}
      <FlowButton label={t('onTheWay.changeMind')} onPress={() => dismissTo('/suggestion')} />
    </PlaceholderScreen>
  );
}
