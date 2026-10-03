import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: mostra o `id` recebido, para conferir o deep link `role://place/<id>`.
export default function PlaceScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen title={t('place.title')} message={t('place.placeholder', { id })}>
      <FlowButton variant="primary" label={t('place.go')} onPress={() => push('/on-the-way')} />
      <FlowButton
        label={t('report.title')}
        onPress={() => push({ pathname: '/report-problem', params: { placeId: id } })}
      />
    </PlaceholderScreen>
  );
}
