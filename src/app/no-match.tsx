import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: a tela real troca só o corpo e mantém a rota.
export default function NoMatchScreen() {
  const { t } = useTranslation();
  const { push, dismissTo } = useRouter();
  return (
    <PlaceholderScreen title={t('noMatch.title')}>
      <FlowButton variant="primary" label={t('noMatch.relax')} onPress={() => push('/suggestion')} />
      <FlowButton label={t('noMatch.changeAll')} onPress={() => dismissTo('/')} />
    </PlaceholderScreen>
  );
}
