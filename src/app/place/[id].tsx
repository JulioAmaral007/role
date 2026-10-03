import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: mostra o `id` recebido, para conferir o deep link `role://place/<id>`.
export default function PlaceScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceholderScreen title={t('place.title')} message={t('place.placeholder', { id })} />;
}
