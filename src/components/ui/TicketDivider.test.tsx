import { render } from '@testing-library/react-native';

import { findNodes } from '@/test/findNodes';
import { colors } from '@/theme/tokens';

import { TicketDivider } from './TicketDivider';

describe('TicketDivider', () => {
  it('is decorative for screen readers', async () => {
    const view = await render(<TicketDivider />);
    const root = (await view.toJSON()) as unknown as { props: Record<string, unknown> };
    expect(root.props.accessible).toBe(false);
    expect(root.props.accessibilityElementsHidden).toBe(true);
    expect(root.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('draws a dashed 2px ink line', async () => {
    const view = await render(<TicketDivider />);
    const [line] = findNodes(await view.toJSON(), 'RNSVGLine');
    expect(line.props.strokeDasharray).toBeTruthy();
    expect(line.props.strokeWidth).toBe(2);
  });

  it('paints the notches with the screen background (yellow by default)', async () => {
    const view = await render(<TicketDivider />);
    expect(JSON.stringify(await view.toJSON())).toContain(`"backgroundColor":"${colors.yellow}"`);
  });

  it('accepts another background for the notches', async () => {
    const view = await render(<TicketDivider notchColor={colors.blue} />);
    expect(JSON.stringify(await view.toJSON())).toContain(`"backgroundColor":"${colors.blue}"`);
  });
});
