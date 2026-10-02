import { fireEvent, render, screen } from '@testing-library/react-native';

import { findNodes } from '@/test/findNodes';

import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Compass } from './icons/Compass';
import { WifiOff } from './icons/WifiOff';
import { OfflineBanner } from './OfflineBanner';

describe('EmptyState', () => {
  it('shows the title and the message it was given', async () => {
    await render(<EmptyState title="Nada por aqui ainda" message="Seu primeiro carimbo vai aparecer aqui." />);
    expect(screen.getByText('Nada por aqui ainda')).toBeOnTheScreen();
    expect(screen.getByText('Seu primeiro carimbo vai aparecer aqui.')).toBeOnTheScreen();
  });

  it('shows no button without an action', async () => {
    await render(<EmptyState title="Vazio" />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('shows the action only when both label and handler exist', async () => {
    const onAction = jest.fn();
    await render(<EmptyState title="Vazio" actionLabel="Escolher um rolê" onAction={onAction} />);
    fireEvent.press(screen.getByRole('button', { name: 'Escolher um rolê' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('hides the action when only the label is given', async () => {
    await render(<EmptyState title="Vazio" actionLabel="Sem handler" />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('draws the optional icon', async () => {
    const view = await render(<EmptyState title="Vazio" icon={Compass} />);
    expect(findNodes(await view.toJSON(), 'RNSVGSvgView')).toHaveLength(1);
  });
});

describe('ErrorState', () => {
  it('is announced as an alert and always offers to try again', async () => {
    const onRetry = jest.fn();
    const view = await render(
      <ErrorState title="Não deu pra carregar" message="Confira a conexão." retryLabel="Tentar de novo" onRetry={onRetry} />,
    );
    // o painel é anunciado como alerta, mas não é `accessible`: senão o iOS esconderia o botão
    const alerts = findNodes(await view.toJSON(), 'View').filter((node) => node.props.accessibilityRole === 'alert');
    expect(alerts).toHaveLength(1);
    fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('draws an icon by default', async () => {
    const view = await render(<ErrorState title="Erro" retryLabel="Tentar" onRetry={jest.fn()} />);
    expect(findNodes(await view.toJSON(), 'RNSVGSvgView')).toHaveLength(1);
  });

  it('accepts another icon', async () => {
    const view = await render(<ErrorState title="Erro" retryLabel="Tentar" onRetry={jest.fn()} icon={WifiOff} />);
    expect(findNodes(await view.toJSON(), 'RNSVGPath').length).toBeGreaterThan(5);
  });
});

describe('OfflineBanner', () => {
  it('announces the message politely as an alert', async () => {
    await render(<OfflineBanner label="Sem conexão. Seu passaporte continua aqui." />);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(screen.getByText('Sem conexão. Seu passaporte continua aqui.')).toBeOnTheScreen();
  });

  it('lets the message take the remaining width so long text wraps instead of overflowing', async () => {
    await render(<OfflineBanner label="Um aviso bem mais comprido do que o texto original em português" />);
    expect(screen.getByText('Um aviso bem mais comprido do que o texto original em português')).toHaveStyle({ flex: 1 });
  });
});
