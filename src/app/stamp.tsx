import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { PlaceholderScreen } from '@/components/features/navigation/PlaceholderScreen';

// Placeholder da Fase 3: a tela real troca só o corpo e mantém a rota.
export default function StampScreen() {
  const { t } = useTranslation();
  const { push, dismissAll, navigate } = useRouter();
  const { stampId } = useLocalSearchParams<{ stampId: string }>();
  return (
    <PlaceholderScreen title={t('stamp.title')} dismiss="close">
      <FlowButton
        variant="primary"
        label={t('stamp.share')}
        onPress={() => push({ pathname: '/story', params: { stampId } })}
      />
      <FlowButton
        label={t('stamp.viewPassport')}
        onPress={() => {
          // fecha tudo o que está acima das abas (ADR 5.2, regra 9) e abre o Passaporte
          dismissAll();
          navigate('/passport');
        }}
      />
    </PlaceholderScreen>
  );
}
