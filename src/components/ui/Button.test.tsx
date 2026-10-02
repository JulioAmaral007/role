import { fireEvent, render, screen } from '@testing-library/react-native';

import { colors, height } from '@/theme/tokens';
import { findNodes } from '@/test/findNodes';

import { Button, ButtonIcon, ButtonText, type ButtonSize, type ButtonVariant } from './Button';
import { Arrow } from './icons/Arrow';

const VARIANT_COLORS: Record<ButtonVariant, { background: string; text: string }> = {
  primary: { background: colors.ink, text: colors.yellow },
  accent: { background: colors.yellow, text: colors.ink },
  outline: { background: 'transparent', text: colors.ink },
  outlineInverse: { background: 'transparent', text: colors.cream },
  cream: { background: colors.cream, text: colors.ink },
};

const SIZE_HEIGHTS: Record<ButtonSize, number> = {
  compact: 50,
  medium: 52,
  cta: 58,
  large: 62,
};

describe('Button', () => {
  it('is announced as a button named after its text, and calls onPress', async () => {
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress}>
        <ButtonText label="Bora, tô indo" />
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Bora, tô indo' });
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress and reports the disabled state when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button disabled onPress={onPress}>
        <ButtonText label="Outra" />
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Outra' });
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(Object.entries(VARIANT_COLORS))('%s paints the background and the text', async (variant, palette) => {
    await render(
      <Button variant={variant as ButtonVariant}>
        <ButtonText label="Texto" />
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: palette.background });
    expect(screen.getByText('Texto')).toHaveStyle({ color: palette.text });
  });

  it('draws a 2px border only on the outline and cream variants', async () => {
    await render(
      <>
        <Button variant="outline">
          <ButtonText label="a" />
        </Button>
        <Button variant="primary">
          <ButtonText label="b" />
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'a' })).toHaveStyle({ borderWidth: 2, borderColor: colors.ink });
    expect(screen.getByRole('button', { name: 'b' })).not.toHaveStyle({ borderWidth: 2 });
  });

  it.each(Object.entries(SIZE_HEIGHTS))('%s has the height from the prototype', async (size, expected) => {
    await render(
      <Button size={size as ButtonSize}>
        <ButtonText label="x" />
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ height: expected });
    expect(expected).toBeGreaterThanOrEqual(height.minTouch);
  });

  it('keeps the text on one line and shrinks it instead of overflowing', async () => {
    await render(
      <Button>
        <ButtonText label="Um texto bem mais comprido que o original em português" />
      </Button>,
    );
    const text = screen.getByText('Um texto bem mais comprido que o original em português');
    expect(text.props.numberOfLines).toBe(1);
    expect(text.props.adjustsFontSizeToFit).toBe(true);
  });

  it('paints the icon with the variant text color', async () => {
    const view = await render(
      <Button variant="primary" justify="space-between">
        <ButtonText label="Me tira da inércia" />
        <ButtonIcon icon={Arrow} />
      </Button>,
    );
    const [svg] = findNodes(await view.toJSON(), 'RNSVGSvgView');
    expect(svg.props.color).toBe(colors.yellow);
  });

  it('pushes the icon to the far end with space-between', async () => {
    await render(
      <Button justify="space-between">
        <ButtonText label="x" />
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveStyle({ justifyContent: 'space-between' });
  });
});
