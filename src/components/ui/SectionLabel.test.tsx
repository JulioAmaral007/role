import { render, screen } from '@testing-library/react-native';

import { colors } from '@/theme/tokens';
import { typography } from '@/theme/typography';

import { SectionLabel } from './SectionLabel';

describe('SectionLabel', () => {
  it('is announced as a heading', async () => {
    await render(<SectionLabel label="01 · Como você tá?" />);
    expect(screen.getByRole('header', { name: '01 · Como você tá?' })).toBeOnTheScreen();
  });

  it('uses the mono uppercase label style', async () => {
    await render(<SectionLabel label="Meta" />);
    expect(screen.getByText('Meta')).toHaveStyle({
      fontFamily: typography.label.fontFamily,
      textTransform: 'uppercase',
    });
  });

  it('colors the text by the surface it sits on', async () => {
    await render(
      <>
        <SectionLabel label="olive" tone="olive" />
        <SectionLabel label="gray" tone="gray" />
        <SectionLabel label="lavender" tone="lavender" />
        <SectionLabel label="yellow" tone="yellow" />
      </>,
    );
    expect(screen.getByText('olive')).toHaveStyle({ color: colors.olive });
    expect(screen.getByText('gray')).toHaveStyle({ color: colors.gray });
    expect(screen.getByText('lavender')).toHaveStyle({ color: colors.lavender });
    expect(screen.getByText('yellow')).toHaveStyle({ color: colors.yellow });
  });
});
