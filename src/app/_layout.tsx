import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAppFonts } from '@/hooks/useAppFonts';

// No escopo do módulo, para rodar antes de a splash sumir sozinha (doc do expo-splash-screen).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady) SplashScreen.hide();
  }, [fontsReady]);

  // Sem fontes não há o que mostrar: a splash segue visível.
  if (!fontsReady) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
