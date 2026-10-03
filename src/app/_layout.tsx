import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppFonts } from '@/hooks/useAppFonts';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useStoresHydrated } from '@/hooks/useStoresHydrated';
import { I18nProvider } from '@/providers/I18nProvider';
import { QueryProvider } from '@/providers/QueryProvider';

// Tela de erro de rota (seção 5.5 do ADR): o Expo Router procura este nome no layout.
export { RootErrorBoundary as ErrorBoundary } from '@/components/features/navigation/RootErrorBoundary';

// Âncora (seção 5.3 do ADR): um deep link para uma rota empilhada abre com o Rolê por baixo, e o
// voltar funciona.
export const unstable_settings = { anchor: '(tabs)' };

// No escopo do módulo, para rodar antes de a splash sumir sozinha (doc do expo-splash-screen).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsReady = useAppFonts();
  const storesHydrated = useStoresHydrated();
  // só vale depois de hidratar: antes disso é o valor inicial (`false`) e levaria todo mundo ao onboarding
  const { onboardingDone } = useOnboarding();
  // A splash só sai com as fontes carregadas e os stores hidratados (seção 7.5): sem isso o app
  // piscaria valores iniciais (idioma, onboarding) antes dos salvos.
  const ready = fontsReady && storesHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    // o `Slider` e os gestos do app precisam deste contêiner (o Expo Router só o põe no stack JS)
    <GestureHandlerRootView style={styles.root}>
      <I18nProvider>
        <QueryProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Gate do onboarding (seção 5.3 do ADR): o Expo Router só entrega as rotas liberadas. Quem
                ainda não passou cai na `welcome`; depois de `completeOnboarding()` o guard muda e a
                navegação vai sozinha para a primeira rota liberada, tirando o onboarding do histórico. */}
            <Stack.Protected guard={!onboardingDone}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
            {/* Rotas empilhadas acima das abas (ADR 5.2): por isso cobrem o dock sem código extra. */}
            <Stack.Protected guard={onboardingDone}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="suggestion" />
              <Stack.Screen name="place/[id]" />
              <Stack.Screen name="on-the-way" options={{ gestureEnabled: false }} />
              <Stack.Screen name="feedback" options={{ presentation: 'modal', gestureEnabled: false }} />
              <Stack.Screen name="stamp" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
              <Stack.Screen name="stamp/[id]" />
              <Stack.Screen name="story" options={{ presentation: 'modal' }} />
              <Stack.Screen name="no-match" />
              <Stack.Screen name="offline" />
              <Stack.Screen name="report-problem" options={{ presentation: 'modal' }} />
              <Stack.Screen name="plus" options={{ presentation: 'modal' }} />
              <Stack.Screen name="language" options={{ presentation: 'modal' }} />
            </Stack.Protected>
          </Stack>
        </QueryProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
