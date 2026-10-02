import { render, screen } from '@testing-library/react-native';

import { findNodes } from '@/test/findNodes';
import { colors } from '@/theme/tokens';

import { Bolt } from './icons/Bolt';
import { Pill, type PillTone } from './Pill';

const TONES: Record<PillTone, { background: string; text: string }> = {
  ink: { background: colors.ink, text: colors.yellow },
  yellow: { background: colors.yellow, text: colors.ink },
  tag: { background: colors.blue, text: colors.cream },
  tagOutline: { background: 'transparent', text: colors.ink },
};

describe('Pill', () => {
  it.each(Object.entries(TONES))('%s uses the colors from the prototype', async (tone, palette) => {
    const view = await render(<Pill label="Texto" tone={tone as PillTone} />);
    expect(screen.getByText('Texto')).toHaveStyle({ color: palette.text });
    expect(screen.getByText('Texto').parent).toBeTruthy();
    const root = (await view.toJSON()) as unknown as { props: { style: unknown } };
    expect(JSON.stringify(root.props.style)).toContain(palette.background);
  });

  it('draws the outline tag with a thin ink border', async () => {
    const view = await render(<Pill label="Nunca carimbado" tone="tagOutline" />);
    const root = (await view.toJSON()) as unknown as { props: { style: unknown } };
    expect(JSON.stringify(root.props.style)).toContain('"borderWidth":1.5');
  });

  it('shows the icon before the label, in the tone color', async () => {
    const view = await render(<Pill label="3 semanas" icon={Bolt} />);
    const [svg] = findNodes(await view.toJSON(), 'RNSVGSvgView');
    expect(svg.props.color).toBe(colors.yellow);
    expect(screen.getByText('3 semanas')).toBeOnTheScreen();
  });

  it('has no icon unless asked', async () => {
    const view = await render(<Pill label="2 restantes" />);
    expect(findNodes(await view.toJSON(), 'RNSVGSvgView')).toHaveLength(0);
  });

  it('lets a long label shrink inside the pill', async () => {
    await render(<Pill label="Um texto bem mais comprido que o original em português" />);
    expect(screen.getByText('Um texto bem mais comprido que o original em português')).toHaveStyle({ flexShrink: 1 });
  });
});
