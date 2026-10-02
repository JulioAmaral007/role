import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { colors } from '@/theme/tokens';

import { Card, type CardTone } from './Card';

function rootStyle(view: { toJSON: () => unknown }) {
  return JSON.stringify((view.toJSON() as unknown as { props: { style: unknown } }).props.style);
}

describe('Card', () => {
  it('renders its children', async () => {
    await render(
      <Card>
        <Text>dentro</Text>
      </Card>,
    );
    expect(screen.getByText('dentro')).toBeOnTheScreen();
  });

  it.each<[CardTone, string, number]>([
    ['ticket', colors.cream, 24],
    ['blue', colors.blue, 20],
    ['blueDark', colors.blueDark, 20],
  ])('%s has the prototype background and radius', async (tone, background, expectedRadius) => {
    const view = await render(<Card tone={tone} />);
    const style = rootStyle(view);
    expect(style).toContain(`"backgroundColor":"${background}"`);
    expect(style).toContain(`"borderRadius":${expectedRadius}`);
  });

  it('draws the outline tone with a 2px ink border and no fill', async () => {
    const view = await render(<Card tone="outline" />);
    const style = rootStyle(view);
    expect(style).toContain('"borderWidth":2');
    expect(style).toContain(`"borderColor":"${colors.ink}"`);
    expect(style).not.toContain('backgroundColor');
  });

  it('clips the ticket so the divider notches look like holes', async () => {
    const view = await render(<Card tone="ticket" />);
    expect(rootStyle(view)).toContain('"overflow":"hidden"');
  });

  it('uses continuous corners', async () => {
    const view = await render(<Card />);
    expect(rootStyle(view)).toContain('"borderCurve":"continuous"');
  });
});
