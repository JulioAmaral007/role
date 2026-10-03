import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen } from '@testing-library/react-native';
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

async function startAt(initialUrl: string) {
  await AsyncStorage.clear();
  usePreferencesStore.setState({ language: 'pt-BR', onboardingDone: true });
  await usePreferencesStore.persist.rehydrate();
  await i18n.changeLanguage('pt-BR');
  return renderRouter(routes, { initialUrl });
}

describe('placeholder routes', () => {
  beforeEach(() => {
    jest.mocked(useAppFonts).mockReturnValue(true);
  });

  it.each([
    ['/suggestion', 'Sugestão'],
    ['/on-the-way', 'A caminho'],
    ['/feedback', 'Como foi?'],
    ['/stamp', 'Carimbo novo!'],
    ['/story', 'Story'],
    ['/no-match', 'Nada bateu'],
    ['/offline', 'Sem internet'],
    ['/report-problem', 'Informar problema'],
    ['/plus', 'Rolê sem limite.'],
    ['/language', 'Idioma'],
  ])('opens %s with its translated title', async (url, title) => {
    await startAt(url);
    expect(await screen.findByRole('header', { name: title })).toBeOnTheScreen();
  });

  it('opens the place detail with the id from the deep link', async () => {
    await startAt('/place/abc-123');
    expect(await screen.findByText('Detalhe do lugar')).toBeOnTheScreen();
    expect(screen.getByText('Lugar abc-123')).toBeOnTheScreen();
  });

  it('opens the stamp detail with the id from the deep link', async () => {
    await startAt('/stamp/42');
    expect(await screen.findByText('Detalhe do carimbo')).toBeOnTheScreen();
    expect(screen.getByText('Carimbo 42')).toBeOnTheScreen();
  });

  it('leaves a route opened without anything below it through the back button', async () => {
    await startAt('/suggestion');
    await fireEvent.press(await screen.findByRole('button', { name: 'Voltar' }));
    expect(await screen.findByText('Bora pra um lugar que não é o de sempre?')).toBeOnTheScreen();
  });
});
