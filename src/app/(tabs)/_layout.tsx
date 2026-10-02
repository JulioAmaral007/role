import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { AppTabBar } from '@/components/features/navigation/AppTabBar';
import { colors } from '@/theme/tokens';

// Abas com o dock flutuante (docs/ARCHITECTURE.md, seção 6). `expo-router/js-tabs` e não o `Tabs` de
// `expo-router`, que está `@deprecated` no SDK 57. O `title` de cada aba vira o label do dock, então
// trocar o idioma atualiza a barra; `sceneStyle` dá o fundo por aba, sem faixa de outra cor atrás.
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), sceneStyle: { backgroundColor: colors.yellow } }}
      />
      <Tabs.Screen
        name="passport"
        options={{ title: t('tabs.passport'), sceneStyle: { backgroundColor: colors.cream } }}
      />
      <Tabs.Screen
        name="crew"
        options={{ title: t('tabs.crew'), sceneStyle: { backgroundColor: colors.cream } }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), sceneStyle: { backgroundColor: colors.cream } }}
      />
    </Tabs>
  );
}
