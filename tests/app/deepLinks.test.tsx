import appConfig from '../../app.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import * as RootLayoutModule from '@/app/_layout';
import * as OnboardingLayoutModule from '@/app/onboarding/_layout';
import * as TabsLayoutModule from '@/app/(tabs)/_layout';
import CrewScreen from '@/app/(tabs)/crew';
import HomeScreen from '@/app/(tabs)/index';
import PassportScreen from '@/app/(tabs)/passport';
import ProfileScreen from '@/app/(tabs)/profile';
import FeedbackScreen from '@/app/feedback';
import LanguageScreen from '@/app/language';
import NoMatchScreen from '@/app/no-match';
import OfflineScreen from '@/app/offline';
import OnTheWayScreen from '@/app/on-the-way';
import PlaceScreen from '@/app/place/[id]';
import WelcomeScreen from '@/app/onboarding/welcome';
import PlusScreen from '@/app/plus';
import ReportProblemScreen from '@/app/report-problem';
import StampDetailScreen from '@/app/stamp/[id]';
import StampScreen from '@/app/stamp';
import StoryScreen from '@/app/story';
import SuggestionScreen from '@/app/suggestion';
import { useAppFonts } from '@/hooks/useAppFonts';
import i18n from '@/i18n';
import { usePreferencesStore } from '@/stores/preferencesStore';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hide: jest.fn(),
}));
jest.mock('@/hooks/useAppFonts');
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
  useLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

const routes = {
  _layout: RootLayoutModule,
  '(tabs)/_layout': TabsLayoutModule,
  '(tabs)/index': HomeScreen,
  '(tabs)/passport': PassportScreen,
  '(tabs)/crew': CrewScreen,
  '(tabs)/profile': ProfileScreen,
  suggestion: SuggestionScreen,
  'place/[id]': PlaceScreen,
  'on-the-way': OnTheWayScreen,
  feedback: FeedbackScreen,
  stamp: StampScreen,
  'stamp/[id]': StampDetailScreen,
  story: StoryScreen,
  'no-match': NoMatchScreen,
  offline: OfflineScreen,
  'report-problem': ReportProblemScreen,
  plus: PlusScreen,
  language: LanguageScreen,
};

// o objeto devolvido pelo `renderRouter` é quem sabe a URL atual (o `screen` do Testing Library não)
let app: ReturnType<typeof renderRouter>;

async function startApp(initialUrl = '/') {
  await AsyncStorage.clear();
  usePreferencesStore.setState({ language: 'pt-BR', onboardingDone: true });
  await usePreferencesStore.persist.rehydrate();
  await i18n.changeLanguage('pt-BR');
  app = renderRouter(routes, { initialUrl });
  return app;
}

async function press(name: string) {
  await fireEvent.press(await screen.findByRole('button', { name }));
}

async function expectPathname(pathname: string) {
  await waitFor(() => expect(app.getPathname()).toBe(pathname));
}

// Deep links públicos do ADR 5.2: `role://suggestion`, `role://passport` e `role://place/<id>`.
// O esquema `role` vem do `app.json` (primeiro teste). O `renderRouter` não tira o prefixo
// `role://` como o app faz no aparelho: ele recebe o caminho que sobra, que é o que o Expo Router
// resolve. O link com o esquema de verdade é conferido pelo usuário (👀, `npx uri-scheme open`).
describe('deep links', () => {
  beforeEach(() => {
    jest.mocked(useAppFonts).mockReturnValue(true);
  });

  it('has the `role` scheme configured', () => {
    expect(appConfig.expo.scheme).toBe('role');
  });

  it('opens the /suggestion link on the suggestion, with the home below it', async () => {
    await startApp('/suggestion');
    await expectPathname('/suggestion');
    expect(await screen.findByRole('header', { name: 'Sugestão' })).toBeOnTheScreen();

    // a âncora `(tabs)` deixa o Rolê por baixo, então o voltar funciona
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    await expectPathname('/');
    expect(await screen.findByRole('header', { name: 'Bora pra um lugar que não é o de sempre?' })).toBeOnTheScreen();
  });

  it('opens the /passport link on the passport tab', async () => {
    await startApp('/passport');
    await expectPathname('/passport');
    expect(await screen.findByRole('header', { name: 'Passaporte' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Passaporte', selected: true })).toBeOnTheScreen();
  });

  it('opens the /place/<id> link on the place detail with the id from the link', async () => {
    await startApp('/place/3f2c9a10-aaaa-4bbb-8ccc-0123456789ab');
    await expectPathname('/place/3f2c9a10-aaaa-4bbb-8ccc-0123456789ab');
    expect(await screen.findByRole('header', { name: 'Detalhe do lugar' })).toBeOnTheScreen();
    expect(screen.getByText('Lugar 3f2c9a10-aaaa-4bbb-8ccc-0123456789ab')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    await expectPathname('/');
  });

  it('keeps working from the place detail opened by link: "Bora" goes to the way', async () => {
    await startApp('/place/abc');
    await press('Bora');
    await expectPathname('/on-the-way');
  });

  it('sends a link to the welcome screen while the onboarding is not done (the destination is dropped)', async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState({ language: 'pt-BR', onboardingDone: false });
    await usePreferencesStore.persist.rehydrate();
    await i18n.changeLanguage('pt-BR');
    app = renderRouter(
      { ...routes, 'onboarding/_layout': OnboardingLayoutModule, 'onboarding/welcome': WelcomeScreen },
      { initialUrl: '/place/abc' },
    );
    await app;
    expect(await screen.findByText('Diga seu humor. A gente escolhe o lugar.')).toBeOnTheScreen();
    expect(screen.queryByText('Detalhe do lugar')).not.toBeOnTheScreen();
  });
});
