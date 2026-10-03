import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import * as RootLayoutModule from '@/app/_layout';
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

describe('navigation flow with fake data', () => {
  beforeEach(() => {
    jest.mocked(useAppFonts).mockReturnValue(true);
  });

  it('runs the whole main flow: home → suggestion → place → on the way → feedback → stamp → story', async () => {
    await startApp();
    await press('Me tira da inércia');
    await expectPathname('/suggestion');

    await press('Detalhes');
    await expectPathname('/place/fake-place');
    expect(await screen.findByText('Lugar fake-place')).toBeOnTheScreen();

    await press('Bora');
    await expectPathname('/on-the-way');

    await press('Cheguei!');
    await expectPathname('/feedback');

    await press('Pegar meu carimbo');
    await expectPathname('/stamp');
    expect(app.getPathnameWithParams()).toBe('/stamp?stampId=fake-stamp');

    await press('Mandar pro grupo');
    await expectPathname('/story');
    expect(app.getPathnameWithParams()).toBe('/story?stampId=fake-stamp');
  });

  it('goes from the new stamp to the passport and clears everything stacked above the tabs', async () => {
    await startApp('/suggestion');
    await press('Bora, tô indo');
    await press('Cheguei!');
    await press('Depois');
    await expectPathname('/stamp');

    await press('Ver meu passaporte');
    await expectPathname('/passport');
    expect(await screen.findByRole('header', { name: 'Passaporte' })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Carimbo novo!' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'A caminho' })).not.toBeOnTheScreen();
  });

  it('opens the stamp detail from the passport and sends it to the story', async () => {
    await startApp('/passport');
    await press('Carimbo de exemplo');
    await expectPathname('/stamp/fake-stamp');
    expect(await screen.findByText('Carimbo fake-stamp')).toBeOnTheScreen();

    await press('Mandar pro grupo');
    await expectPathname('/story');
  });

  it('"Mudei de ideia" goes back to the suggestion, not to a new one on top', async () => {
    await startApp();
    await press('Me tira da inércia');
    await press('Bora, tô indo');
    await expectPathname('/on-the-way');

    await press('Mudei de ideia');
    await expectPathname('/suggestion');
    // a Sugestão que já estava embaixo é a que fica: voltar leva ao Rolê, não à A caminho
    await fireEvent.press(await screen.findByRole('button', { name: 'Voltar' }));
    await expectPathname('/');
  });

  it('"Mudei de ideia" also works from a place detail that came from the suggestion', async () => {
    await startApp('/suggestion');
    await press('Detalhes');
    await press('Bora');
    await press('Mudei de ideia');
    await expectPathname('/suggestion');
    await fireEvent.press(await screen.findByRole('button', { name: 'Voltar' }));
    await expectPathname('/');
  });

  it('opens the paywall from "Outra" and closes it back to the suggestion', async () => {
    await startApp('/suggestion');
    await press('Outra');
    await expectPathname('/plus');
    expect(app.getPathnameWithParams()).toBe('/plus?source=quota');

    await press('Fechar');
    await expectPathname('/suggestion');
  });

  it('opens the paywall from the profile and closes it back to the profile', async () => {
    await startApp('/profile');
    await press('Rolê Plus');
    await expectPathname('/plus');
    expect(app.getPathnameWithParams()).toBe('/plus?source=profile');

    await press('Fechar');
    await expectPathname('/profile');
  });

  it('opens "Nada bateu" from the home, and "Mudar tudo" goes back to the home', async () => {
    await startApp();
    await press('Nada bateu');
    await expectPathname('/no-match');

    await press('Mudar tudo');
    await expectPathname('/');
    expect(await screen.findByRole('header', { name: 'Bora pra um lugar que não é o de sempre?' })).toBeOnTheScreen();
  });

  it('"Muda uma coisa só" tries a new suggestion', async () => {
    await startApp('/no-match');
    await press('Muda uma coisa só');
    await expectPathname('/suggestion');
  });

  it('opens "Sem internet" from the home and retries back to it', async () => {
    await startApp();
    await press('Sem internet');
    await expectPathname('/offline');

    await press('Tentar de novo');
    await expectPathname('/');
  });

  it('opens the passport from "Sem internet"', async () => {
    await startApp('/offline');
    await press('Ver meu passaporte');
    await expectPathname('/passport');
  });

  it('opens "Informar problema" from the place detail with the place id', async () => {
    await startApp('/place/abc');
    await press('Informar problema');
    await expectPathname('/report-problem');
    expect(app.getPathnameWithParams()).toBe('/report-problem?placeId=abc');
  });
});
