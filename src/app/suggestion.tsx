import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: a tela real troca só o corpo e mantém a rota.
export default function SuggestionScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('suggestion.title')} />;
}
