import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';
import { FAKE_STAMP_ID } from '@/utils/fakeIds';

// Placeholder da Fase 3: a tela real troca só o corpo e mantém a rota.
export default function FeedbackScreen() {
  const { t } = useTranslation();
  const { replace } = useRouter();
  // o Como foi sai para o Carimbo sem ficar no histórico (avaliando ou pulando)
  const openStamp = () => replace({ pathname: '/stamp', params: { stampId: FAKE_STAMP_ID } });
  return (
    <PlaceholderScreen title={t('feedback.title')} dismiss="close">
      <FlowButton variant="primary" label={t('feedback.getStamp')} onPress={openStamp} />
      <FlowButton label={t('feedback.later')} onPress={openStamp} />
    </PlaceholderScreen>
  );
}
