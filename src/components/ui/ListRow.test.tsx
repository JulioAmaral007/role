import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { colors } from '@/theme/tokens';

import { ListRow } from './ListRow';

describe('ListRow', () => {
  it('shows the title and the subtitle', async () => {
    await render(<ListRow title="Só lugares acessíveis" subtitle="Sebo · ontem" />);
    expect(screen.getByText('Só lugares acessíveis')).toBeOnTheScreen();
    expect(screen.getByText('Sebo · ontem')).toBeOnTheScreen();
  });

  it('renders the leading and the trailing elements around the text', async () => {
    await render(
      <ListRow
        title="Marina carimbou Sebo"
        leading={<Text>esquerda</Text>}
        trailing={<Text>direita</Text>}
      />,
    );
    expect(screen.getByText('esquerda')).toBeOnTheScreen();
    expect(screen.getByText('direita')).toBeOnTheScreen();
  });

  it('is plain text without onPress, and a button with it', async () => {
    const onPress = jest.fn();
    const view = await render(<ListRow title="Idioma" />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
    await view.rerender(<ListRow title="Idioma" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Idioma' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the radio role and the checked state for single-choice lists', async () => {
    await render(
      <ListRow title="English" onPress={() => {}} accessibilityRole="radio" accessibilityState={{ checked: true }} />,
    );
    expect(screen.getByRole('radio', { name: 'English', checked: true })).toBeOnTheScreen();
  });

  it('keeps the prototype separator, a 1.5 lineSoft line, unless turned off', async () => {
    const view = await render(<ListRow title="Com linha" />);
    expect(JSON.stringify(await view.toJSON())).toContain(`"borderBottomColor":"${colors.lineSoft}"`);
    expect(JSON.stringify(await view.toJSON())).toContain('"borderBottomWidth":1.5');
    await view.rerender(<ListRow title="Sem linha" separator={false} />);
    expect(JSON.stringify(await view.toJSON())).not.toContain('borderBottomColor');
  });

  it('is at least 52 tall and lets a long title use the remaining width', async () => {
    await render(<ListRow title="Um título bem mais comprido do que o original em português" trailing={<Text>x</Text>} />);
    const title = screen.getByText('Um título bem mais comprido do que o original em português');
    expect(title.parent).toHaveStyle({ flex: 1, minWidth: 0 });
    expect(title.parent!.parent).toHaveStyle({ minHeight: 52 });
  });
});
