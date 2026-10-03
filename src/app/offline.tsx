import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: a tela real troca só o corpo e mantém a rota.
export default function OfflineScreen() {
  const { t } = useTranslation();
  const { back, canGoBack, replace, navigate } = useRouter();
  return (
    <PlaceholderScreen title={t('offline.title')}>
      <FlowButton
        variant="primary"
        label={t('offline.retry')}
        onPress={() => (canGoBack() ? back() : replace('/'))}
      />
      <FlowButton label={t('stamp.viewPassport')} onPress={() => navigate('/passport')} />
    </PlaceholderScreen>
  );
}
