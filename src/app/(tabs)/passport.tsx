import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FlowButton } from '@/components/features/navigation/FlowButton';
import { TabScreen } from '@/components/features/navigation/TabScreen';
import { FAKE_STAMP_ID } from '@/utils/fakeIds';

// Placeholder da Fase 3. O Passaporte de verdade é da Fase 11; o botão abre o detalhe de um carimbo fake.
export default function PassportScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  return (
    <TabScreen title={t('passport.title')}>
      <FlowButton
        label={t('passport.sampleStamp')}
        onPress={() => push({ pathname: '/stamp/[id]', params: { id: FAKE_STAMP_ID } })}
      />
    </TabScreen>
  );
}
