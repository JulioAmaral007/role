import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabScreen } from './TabScreen';

function metrics(bottom: number) {
  return {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom },
  };
}

async function renderWithInset(bottom: number, ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={metrics(bottom)}>{ui}</SafeAreaProvider>);
}

/** O `contentContainerStyle` da rolagem, achatado. */
function contentStyle() {
  const scroll = screen.getByTestId('tab-screen-scroll');
  const flat = (scroll.props.contentContainerStyle as object[]).flat() as Record<string, unknown>[];
  return Object.assign({}, ...flat) as { paddingBottom: number; paddingTop: number; paddingHorizontal: number };
}

describe('TabScreen', () => {
  it('shows the title as a heading', async () => {
    await renderWithInset(0, <TabScreen title="Passaporte" />);
    expect(screen.getByRole('header', { name: 'Passaporte' })).toBeOnTheScreen();
  });

  it('shows the message and the children below the title', async () => {
    await renderWithInset(
      0,
      <TabScreen title="Turma" message="Em breve">
        <Text>conteúdo</Text>
      </TabScreen>,
    );
    expect(screen.getByText('Em breve')).toBeOnTheScreen();
    expect(screen.getByText('conteúdo')).toBeOnTheScreen();
  });

  it('leaves room under the content for the floating dock', async () => {
    await renderWithInset(0, <TabScreen title="Rolê" />);
    expect(contentStyle().paddingBottom).toBe(106);
  });

  it('adds the bottom safe area to that room', async () => {
    await renderWithInset(34, <TabScreen title="Rolê" />);
    expect(contentStyle().paddingBottom).toBe(106 + 34);
  });

  it('keeps the screen margins of the prototype', async () => {
    await renderWithInset(0, <TabScreen title="Rolê" />);
    expect(contentStyle()).toMatchObject({ paddingTop: 52, paddingHorizontal: 20 });
  });
});
