import { render, screen } from '@testing-library/react-native';

import { colors } from '@/theme/tokens';

import { ProgressSegments } from './ProgressSegments';

async function segmentColors(filled: number, total = 3) {
  const view = await render(<ProgressSegments total={total} filled={filled} />);
  const root = (await view.toJSON()) as unknown as { children: { props: { style: unknown } }[] };
  return root.children.map((child) => JSON.stringify(child.props.style).match(/"backgroundColor":"(#[0-9A-F]+)"/)?.[1]);
}

describe('ProgressSegments', () => {
  it('fills as many segments as reached, in order', async () => {
    expect(await segmentColors(2)).toEqual([colors.yellow, colors.yellow, colors.blue]);
  });

  it('shows every segment filled when the goal is reached', async () => {
    expect(await segmentColors(3)).toEqual([colors.yellow, colors.yellow, colors.yellow]);
  });

  it('shows an empty track at zero', async () => {
    expect(await segmentColors(0)).toEqual([colors.blue, colors.blue, colors.blue]);
  });

  it('clamps values outside the range', async () => {
    expect(await segmentColors(9)).toEqual([colors.yellow, colors.yellow, colors.yellow]);
    expect(await segmentColors(-2)).toEqual([colors.blue, colors.blue, colors.blue]);
  });

  it('reports progress to accessibility', async () => {
    await render(<ProgressSegments total={3} filled={2} accessibilityLabel="Meta de outubro" />);
    const bar = screen.getByRole('progressbar', { name: 'Meta de outubro' });
    expect(bar).toHaveProp('accessibilityValue', { min: 0, max: 3, now: 2 });
  });

  it('accepts other colors', async () => {
    const view = await render(<ProgressSegments total={2} filled={1} color={colors.ink} trackColor={colors.sand} />);
    const root = (await view.toJSON()) as unknown as { children: { props: { style: unknown } }[] };
    expect(JSON.stringify(root.children[0].props.style)).toContain(colors.ink);
    expect(JSON.stringify(root.children[1].props.style)).toContain(colors.sand);
  });
});
