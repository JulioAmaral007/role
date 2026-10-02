import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CatalogScreen from '@/app/catalog';
import i18n from '@/i18n';
import { usePreferencesStore } from '@/stores/preferencesStore';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderCatalog() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <CatalogScreen />
    </SafeAreaProvider>,
  );
}

async function pickLanguage(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
  // aplica o efeito que troca o idioma do i18next
  await act(async () => {});
}

describe('catalog screen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState({ language: 'pt-BR' });
    await i18n.changeLanguage('pt-BR');
  });

  it('shows the components with the prototype texts in pt-BR', async () => {
    await renderCatalog();
    expect(screen.getByText('Bora pra um lugar que não é o de sempre?')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Me tira da inércia' })).toBeOnTheScreen();
    expect(screen.getByText('01 · Como você tá?')).toBeOnTheScreen();
    expect(screen.getByText('Carimbo novo!')).toBeOnTheScreen();
  });

  it('shows the plural forms right: 1 restante, 2 restantes', async () => {
    await renderCatalog();
    expect(screen.getByText('1 restante')).toBeOnTheScreen();
    expect(screen.getByText('2 restantes')).toBeOnTheScreen();
  });

  it('shows the stamp date and the weekday/month names of the prototype', async () => {
    await renderCatalog();
    expect(screen.getByText('SEX · 02 OUT')).toBeOnTheScreen();
    expect(screen.getByText(/02 · 10 · 2026/)).toBeOnTheScreen();
  });

  it('writes the ordinal week in pt-BR', async () => {
    await renderCatalog();
    expect(screen.getByText(/É a 3ª semana seguida/)).toBeOnTheScreen();
    expect(screen.getByText(/É a 21ª semana seguida/)).toBeOnTheScreen();
  });

  it('switches to English at once, with English plural and ordinal forms', async () => {
    await renderCatalog();
    await pickLanguage('English');
    expect(screen.getByText("Up for a place that's not your usual?")).toBeOnTheScreen();
    expect(screen.getAllByText('1 left').length).toBeGreaterThan(0);
    expect(screen.getByText('FRI · 02 OCT')).toBeOnTheScreen();
    expect(screen.getByText(/That's your 1st week/)).toBeOnTheScreen();
    expect(screen.getByText(/That's your 2nd week/)).toBeOnTheScreen();
    expect(screen.getByText(/That's your 11th week/)).toBeOnTheScreen();
    expect(screen.getByText(/That's your 21st week/)).toBeOnTheScreen();
  });

  it('switches to Spanish at once', async () => {
    await renderCatalog();
    await pickLanguage('Español');
    expect(screen.getByText('¿Vamos a un lugar que no es el de siempre?')).toBeOnTheScreen();
    expect(screen.getByText('VIE · 02 OCT')).toBeOnTheScreen();
    expect(screen.getByText('1 restante')).toBeOnTheScreen();
    expect(screen.getByText(/Es la 3\.ª semana seguida/)).toBeOnTheScreen();
  });

  it('saves the chosen language in the preferences store', async () => {
    await renderCatalog();
    await pickLanguage('English');
    expect(usePreferencesStore.getState().language).toBe('en');
  });

  it('labels the device-language option in the active language', async () => {
    await renderCatalog();
    expect(screen.getByRole('button', { name: 'Idioma do aparelho' })).toBeOnTheScreen();
    await pickLanguage('Español');
    expect(screen.getByRole('button', { name: 'Idioma del dispositivo' })).toBeOnTheScreen();
  });

  it('draws the dock with the four tabs, translated', async () => {
    await renderCatalog();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Perfil' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Passaporte' })).toBeOnTheScreen();
    await pickLanguage('English');
    expect(screen.getByRole('tab', { name: 'Passport' })).toBeOnTheScreen();
  });

  it('makes the dock tabs switch the active tab', async () => {
    await renderCatalog();
    await fireEvent.press(screen.getByRole('tab', { name: 'Turma' }));
    expect(screen.getByRole('tab', { name: 'Turma', selected: true })).toBeOnTheScreen();
  });
  it('draws the revised form components: switches, checkbox chips and the distance slider', async () => {
    await renderCatalog();
    expect(screen.getByRole('switch', { name: 'Só lugares acessíveis', checked: false })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Lembrete semanal da ofensiva', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Balada', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('adjustable', { name: 'Distância máxima' })).toBeOnTheScreen();
  });

  it('toggles a switch and a checkbox chip, and moves the slider by accessibility action', async () => {
    await renderCatalog();
    await fireEvent.press(screen.getByRole('switch', { name: 'Só lugares acessíveis' }));
    expect(screen.getByRole('switch', { name: 'Só lugares acessíveis', checked: true })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Bar' }));
    expect(screen.getByRole('checkbox', { name: 'Bar', checked: true })).toBeOnTheScreen();
    await fireEvent(screen.getByRole('adjustable', { name: 'Distância máxima' }), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(screen.getByText('6 km')).toBeOnTheScreen();
  });
});
