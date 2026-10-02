import { render, screen } from '@testing-library/react-native';

import { colors } from '@/theme/tokens';
import { typography } from '@/theme/typography';

import { Text } from './Text';

describe('Text', () => {
  it('defaults to the body variant in ink', async () => {
    await render(<Text>oi</Text>);
    expect(screen.getByText('oi')).toHaveStyle({
      fontFamily: typography.body.fontFamily,
      fontSize: typography.body.fontSize,
      color: colors.ink,
    });
  });

  it('applies the variant and the color token', async () => {
    await render(
      <Text variant="display50" color={colors.yellow}>
        Carimbo novo!
      </Text>,
    );
    expect(screen.getByText('Carimbo novo!')).toHaveStyle({
      fontFamily: typography.display[50].fontFamily,
      fontSize: 50,
      letterSpacing: -2,
      color: colors.yellow,
    });
  });

  it('lets the caller extend the style and passes native props through', async () => {
    await render(
      <Text style={{ textAlign: 'center' }} numberOfLines={2} accessibilityRole="header">
        título
      </Text>,
    );
    const text = screen.getByRole('header', { name: 'título' });
    expect(text).toHaveStyle({ textAlign: 'center' });
    expect(text.props.numberOfLines).toBe(2);
  });
});
