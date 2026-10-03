import { render, screen } from '@testing-library/react-native';

import { colors } from '@/theme/tokens';

import { Avatar, type AvatarSize, type AvatarTone } from './Avatar';

describe('Avatar', () => {
  it.each<AvatarSize>([34, 40, 60])('draws a %s-point circle with a 2px ink border', async (size) => {
    await render(<Avatar initials="VC" size={size} accessibilityLabel="Você" />);
    expect(screen.getByLabelText('Você')).toHaveStyle({
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: colors.ink,
    });
  });

  it.each<[AvatarTone, string, string]>([
    ['yellow', colors.yellow, colors.ink],
    ['blue', colors.blue, colors.cream],
    ['cream', colors.cream, colors.ink],
    ['sand', colors.sand, colors.ink],
  ])('%s has the prototype colors', async (tone, background, foreground) => {
    await render(<Avatar initials="MA" tone={tone} accessibilityLabel="Marina" />);
    expect(screen.getByLabelText('Marina')).toHaveStyle({ backgroundColor: background });
    expect(screen.getByText('MA', { includeHiddenElements: true })).toHaveStyle({ color: foreground });
  });

  it('is decorative without a label, since the name is already in the text next to it', async () => {
    await render(<Avatar initials="LU" />);
    expect(screen.queryByText('LU')).not.toBeOnTheScreen();
    expect(screen.getByText('LU', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('is announced as an image when it has a label', async () => {
    await render(<Avatar initials="VC" accessibilityLabel="Você" />);
    expect(screen.getByRole('image', { name: 'Você' })).toBeOnTheScreen();
  });

  it('uses the larger Bricolage initials only on the 60-point avatar', async () => {
    await render(
      <>
        <Avatar initials="BG" size={60} accessibilityLabel="grande" />
        <Avatar initials="SM" size={40} accessibilityLabel="pequeno" />
      </>,
    );
    const big = screen.getByText('BG').props.style;
    const small = screen.getByText('SM').props.style;
    expect(JSON.stringify(big)).toContain('BricolageGrotesque_800ExtraBold');
    expect(JSON.stringify(small)).toContain('InstrumentSans_700Bold');
  });
});
