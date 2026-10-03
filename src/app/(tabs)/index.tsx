import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { TabScreen } from '@/components/features/navigation/TabScreen';

// Placeholder da Fase 3. A home de verdade (filtros, CTA e contador) é da Fase 8; os botões ligam
// o fluxo com dados fake.
export default function HomeScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  return (
    <TabScreen title={t('home.title')}>
      <FlowButton variant="primary" label={t('home.cta')} onPress={() => push('/suggestion')} />
      <FlowButton label={t('noMatch.title')} onPress={() => push('/no-match')} />
      <FlowButton label={t('offline.title')} onPress={() => push('/offline')} />
    </TabScreen>
  );
}
