import { fireEvent, render, screen } from '@testing-library/react-native';

import { colors, height } from '@/theme/tokens';

import { Chip } from './Chip';

describe('Chip', () => {
  it('exposes the selected state to accessibility', async () => {
    await render(
      <>
        <Chip label="Curioso" selected onPress={jest.fn()} />
        <Chip label="Social" selected={false} onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Curioso', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Social', selected: false })).toBeOnTheScreen();
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Na paz" selected={false} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Na paz' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('inverts colors when selected', async () => {
    await render(
      <>
        <Chip label="A" selected onPress={jest.fn()} />
        <Chip label="B" selected={false} onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'A' })).toHaveStyle({ backgroundColor: colors.ink });
    expect(screen.getByText('A')).toHaveStyle({ color: colors.yellow });
    expect(screen.getByRole('button', { name: 'B' })).toHaveStyle({ backgroundColor: 'transparent' });
    expect(screen.getByText('B')).toHaveStyle({ color: colors.ink });
  });

  it('is at least as tall as the minimum touch target and grows with long text', async () => {
    await render(<Chip label="Um rótulo bem mais comprido que o original" selected={false} onPress={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveStyle({ minHeight: height.minTouch });
  });
});
