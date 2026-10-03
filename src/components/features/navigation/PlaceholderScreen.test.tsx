import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import i18n from '@/i18n';

import { PlaceholderScreen } from './PlaceholderScreen';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: () => mockCanGoBack }),
    // mostra o `title` que a tela entrega ao navegador, para conferir a tradução
    Stack: { Screen: ({ options }: { options: { title?: string } }) => <MockText testID="stack-title">{options.title}</MockText> },
  };
});

describe('PlaceholderScreen', () => {
  beforeEach(async () => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack = true;
    await act(() => i18n.changeLanguage('pt-BR'));
  });

  it('shows the title as a header and hands the same title to the navigator', async () => {
    await render(<PlaceholderScreen title="Sugestão" />);
    expect(screen.getByRole('header', { name: 'Sugestão' })).toBeOnTheScreen();
    expect(screen.getByTestId('stack-title')).toHaveTextContent('Sugestão');
  });

  it('names the dismiss button in the active language', async () => {
    const view = await render(<PlaceholderScreen title="x" dismiss="close" />);
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeOnTheScreen();
    await view.rerender(<PlaceholderScreen title="x" />);
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeOnTheScreen();

    await act(() => i18n.changeLanguage('en'));
    await view.rerender(<PlaceholderScreen title="x" dismiss="close" />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeOnTheScreen();
    await act(() => i18n.changeLanguage('es'));
    await view.rerender(<PlaceholderScreen title="x" />);
    expect(screen.getByRole('button', { name: 'Volver' })).toBeOnTheScreen();
  });

  it('goes back when it can, and to the home when the route was opened with nothing below', async () => {
    await render(<PlaceholderScreen title="x" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(mockBack).toHaveBeenCalledTimes(1);

    mockCanGoBack = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renders the children below the title', async () => {
    await render(
      <PlaceholderScreen title="x">
        <Text>conteúdo</Text>
      </PlaceholderScreen>,
    );
    expect(screen.getByText('conteúdo')).toBeOnTheScreen();
  });
});
