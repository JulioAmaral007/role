import { fireEvent, render, screen } from '@testing-library/react-native';

import i18n from '@/i18n';

import { RootErrorBoundary } from './RootErrorBoundary';

const error = new Error('boom');

describe('RootErrorBoundary', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt-BR');
  });

  it('shows a friendly translated message instead of the error', async () => {
    await render(<RootErrorBoundary error={error} retry={jest.fn()} />);
    expect(screen.getByText('Algo deu errado')).toBeOnTheScreen();
    expect(screen.getByText('Não deu pra abrir essa tela. Tenta de novo?')).toBeOnTheScreen();
    expect(screen.queryByText('boom')).not.toBeOnTheScreen();
  });

  it('offers "Tentar de novo" and retries the route', async () => {
    const retry = jest.fn();
    await render(<RootErrorBoundary error={error} retry={retry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['en', 'Something went wrong', 'Try again'],
    ['es', 'Algo salió mal', 'Intentar de nuevo'],
  ])('speaks %s', async (language, title, retryLabel) => {
    await i18n.changeLanguage(language);
    await render(<RootErrorBoundary error={error} retry={jest.fn()} />);
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: retryLabel })).toBeOnTheScreen();
  });
});
