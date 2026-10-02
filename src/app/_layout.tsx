import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppFonts } from '@/hooks/useAppFonts';
import { useStoresHydrated } from '@/hooks/useStoresHydrated';
import { I18nProvider } from '@/providers/I18nProvider';
import { QueryProvider } from '@/providers/QueryProvider';

// Tela de erro de rota (seção 5.5 do ADR): o Expo Router procura este nome no layout.
export { RootErrorBoundary as ErrorBoundary } from '@/components/features/navigation/RootErrorBoundary';

// No escopo do módulo, para rodar antes de a splash sumir sozinha (doc do expo-splash-screen).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsReady = useAppFonts();
  const storesHydrated = useStoresHydrated();
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
          <Stack screenOptions={{ headerShown: false }} />
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
