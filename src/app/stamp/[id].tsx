import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: mostra o `id` recebido. Convive com `stamp.tsx` (ADR 5.2, regra 8).
export default function StampDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceholderScreen title={t('stamp.detailTitle')} message={t('stamp.detailPlaceholder', { id })} />;
}
