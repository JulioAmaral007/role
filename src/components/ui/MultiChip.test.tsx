import { fireEvent, render, screen } from '@testing-library/react-native';

import { colors, height } from '@/theme/tokens';

import { MultiChip } from './MultiChip';

describe('MultiChip', () => {
  it('is a checkbox that exposes its checked state to accessibility', async () => {
    await render(
      <>
        <MultiChip label="Bar" checked onPress={jest.fn()} />
        <MultiChip label="Balada" checked={false} onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Bar', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Balada', checked: false })).toBeOnTheScreen();
  });

  it('lets several chips be checked at once', async () => {
    await render(
      <>
        <MultiChip label="Bar" checked onPress={jest.fn()} />
        <MultiChip label="Shopping" checked onPress={jest.fn()} />
        <MultiChip label="Balada" checked={false} onPress={jest.fn()} />
      </>,
    );
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(2);
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<MultiChip label="Trilha longa" checked={false} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Trilha longa' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('inverts colors when checked', async () => {
    await render(
      <>
        <MultiChip label="A" checked onPress={jest.fn()} />
        <MultiChip label="B" checked={false} onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'A' })).toHaveStyle({ backgroundColor: colors.ink });
    expect(screen.getByText('A')).toHaveStyle({ color: colors.yellow });
    expect(screen.getByRole('checkbox', { name: 'B' })).toHaveStyle({ backgroundColor: 'transparent' });
    expect(screen.getByText('B')).toHaveStyle({ color: colors.ink });
  });

  it('is 44 tall in the regular size and 40 tall in the compact one, with a 44 touch area', async () => {
    await render(
      <>
        <MultiChip label="Regular" checked={false} onPress={jest.fn()} />
        <MultiChip label="Compacto" checked={false} onPress={jest.fn()} size="compact" />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Regular' })).toHaveStyle({ height: 44, paddingHorizontal: 16 });
    const compact = screen.getByRole('checkbox', { name: 'Compacto' });
    expect(compact).toHaveStyle({ height: 40, paddingHorizontal: 14 });
    const slop = (compact.props.hitSlop ?? {}) as { top: number; bottom: number };
    expect(40 + slop.top + slop.bottom).toBeGreaterThanOrEqual(height.minTouch);
  });
});
