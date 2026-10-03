import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';
import { FAKE_PLACE_ID } from '@/utils/fakeIds';

// Placeholder da Fase 3: a tela real troca só o corpo e mantém a rota.
export default function SuggestionScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  return (
    <PlaceholderScreen title={t('suggestion.title')}>
      <FlowButton variant="primary" label={t('suggestion.go')} onPress={() => push('/on-the-way')} />
      <FlowButton
        label={t('suggestion.details')}
        onPress={() => push({ pathname: '/place/[id]', params: { id: FAKE_PLACE_ID } })}
      />
      <FlowButton label={t('suggestion.other')} onPress={() => push({ pathname: '/plus', params: { source: 'quota' } })} />
    </PlaceholderScreen>
  );
}
