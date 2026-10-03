import { Stack } from 'expo-router';

// Stack próprio do onboarding (docs/ARCHITECTURE.md, seção 5.3): Boas-vindas → Localização → Sem
// localização. Quem protege o grupo inteiro é o gate do layout raiz.
// Sem isto o Expo Router abriria a primeira rota por ordem alfabética (`location`), e não a `welcome`.
export const unstable_settings = { initialRouteName: 'welcome' };

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
