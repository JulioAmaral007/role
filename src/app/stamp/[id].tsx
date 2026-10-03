import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: mostra o `id` recebido. Convive com `stamp.tsx` (ADR 5.2, regra 8).
export default function StampDetailScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen title={t('stamp.detailTitle')} message={t('stamp.detailPlaceholder', { id })}>
      <FlowButton
        variant="primary"
        label={t('stamp.share')}
        onPress={() => push({ pathname: '/story', params: { stampId: id } })}
      />
    </PlaceholderScreen>
  );
}
