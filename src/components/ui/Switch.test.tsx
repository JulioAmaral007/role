import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getAnimatedStyle } from 'react-native-reanimated';

import { colors, height } from '@/theme/tokens';

import { Switch } from './Switch';

const hidden = { includeHiddenElements: true };
type Styled = Parameters<typeof getAnimatedStyle>[0];

function translateXOf(element: Styled) {
  const style = getAnimatedStyle(element) as unknown as { transform: { translateX: number }[] };
  return style.transform[0].translateX;
}

describe('Switch', () => {
  it('is announced as a switch with its checked state and its label', async () => {
    await render(
      <>
        <Switch value accessibilityLabel="Lembrete semanal da ofensiva" onValueChange={jest.fn()} />
        <Switch value={false} accessibilityLabel="Só lugares acessíveis" onValueChange={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('switch', { name: 'Lembrete semanal da ofensiva', checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Só lugares acessíveis', checked: false })).toBeOnTheScreen();
  });

  it('asks for the opposite value when pressed', async () => {
    const onValueChange = jest.fn();
    const view = await render(<Switch value={false} accessibilityLabel="A" onValueChange={onValueChange} />);
    await fireEvent.press(screen.getByRole('switch', { name: 'A' }));
    expect(onValueChange).toHaveBeenLastCalledWith(true);
    await view.rerender(<Switch value accessibilityLabel="A" onValueChange={onValueChange} />);
    await fireEvent.press(screen.getByRole('switch', { name: 'A' }));
    expect(onValueChange).toHaveBeenLastCalledWith(false);
  });

  it('does nothing when disabled, and says so', async () => {
    const onValueChange = jest.fn();
    await render(<Switch value={false} disabled accessibilityLabel="A" onValueChange={onValueChange} />);
    const control = screen.getByRole('switch', { name: 'A' });
    expect(control).toBeDisabled();
    await fireEvent.press(control);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('has a 44-tall touch area and the 52×32 track of the prototype', async () => {
    const view = await render(<Switch value accessibilityLabel="A" onValueChange={jest.fn()} />);
    expect(screen.getByRole('switch')).toHaveStyle({ width: 56, height: height.minTouch });
    const json = JSON.stringify(await view.toJSON());
    expect(json).toContain('"width":52');
    expect(json).toContain('"height":32');
    expect(json).toContain(`"backgroundColor":"${colors.line}"`);
    expect(json).toContain(`"backgroundColor":"${colors.ink}"`);
    expect(json).toContain(`"backgroundColor":"${colors.cream}"`);
    expect(json).toContain(`"backgroundColor":"${colors.yellow}"`);
  });

  describe('animation', () => {
    async function settle() {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    it('starts at the resting position of its value, without animating on mount', async () => {
      await render(
        <>
          <Switch value accessibilityLabel="ligado" onValueChange={jest.fn()} />
        </>,
      );
      expect(translateXOf(screen.getByTestId('switch-knob', hidden))).toBe(20);
      expect(getAnimatedStyle(screen.getByTestId('switch-track-on', hidden)).opacity).toBe(1);
    });

    it('slides the knob by 20 with transform and fades the ink track with opacity, nothing else', async () => {
      jest.useFakeTimers();
      try {
        const view = await render(<Switch value={false} accessibilityLabel="A" onValueChange={jest.fn()} />);
        await settle();
        const knob = screen.getByTestId('switch-knob', hidden);
        const track = screen.getByTestId('switch-track-on', hidden);
        const knobBefore = { ...getAnimatedStyle(knob) };
        const trackBefore = { ...getAnimatedStyle(track) };
        expect(translateXOf(knob)).toBe(0);
        expect(trackBefore.opacity).toBe(0);

        await view.rerender(<Switch value accessibilityLabel="A" onValueChange={jest.fn()} />);
        await settle();

        const knobAfter = getAnimatedStyle(knob) as unknown as Record<string, unknown>;
        const trackAfter = getAnimatedStyle(track) as unknown as Record<string, unknown>;
        expect(translateXOf(knob)).toBeCloseTo(20, 1);
        expect(trackAfter.opacity).toBeCloseTo(1, 1);
        const changed = (a: Record<string, unknown>, b: Record<string, unknown>) =>
          Object.keys({ ...a, ...b }).filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]));
        expect(changed(knobBefore as Record<string, unknown>, knobAfter)).toEqual(['transform']);
        expect(changed(trackBefore as Record<string, unknown>, trackAfter)).toEqual(['opacity']);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
