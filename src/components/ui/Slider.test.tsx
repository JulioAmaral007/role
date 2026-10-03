import { fireEvent, render, screen } from '@testing-library/react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';
import type { ComponentProps } from 'react';

import { colors, height } from '@/theme/tokens';

import { Slider } from './Slider';

// Trilho de 218: 28 do círculo e 190 úteis. Para 1 a 20 km de 1 em 1, cada passo vale 10 pontos.
const WIDTH = 218;
const THUMB = 28;

function layoutEvent(width: number) {
  return { nativeEvent: { layout: { x: 0, y: 0, width, height: 44 } } };
}

type SliderProps = ComponentProps<typeof Slider>;

async function renderSlider(props: Partial<SliderProps> = {}) {
  const onValueChange = jest.fn();
  const view = await render(
    <Slider
      value={5}
      onValueChange={onValueChange}
      min={1}
      max={20}
      step={1}
      accessibilityLabel="Distância máxima"
      valueText="5 km"
      {...props}
    />,
  );
  await fireEvent(screen.getByTestId('slider'), 'layout', layoutEvent(WIDTH));
  return { onValueChange, view };
}

/** Chamadas sem repetição seguida: o pai troca o valor a cada passo, e `setState` ignora o igual. */
function distinct(values: number[]) {
  return values.filter((value, index) => index === 0 || value !== values[index - 1]);
}

function translateXOf(testID: string) {
  const style = JSON.stringify(screen.getByTestId(testID).props.style);
  const match = /"translateX":(-?[\d.]+)/.exec(style);
  return match ? Number(match[1]) : NaN;
}

describe('Slider', () => {
  describe('accessibility', () => {
    it('is announced as adjustable, with its label, range and spoken value', async () => {
      await renderSlider();
      const slider = screen.getByRole('adjustable', { name: 'Distância máxima' });
      expect(slider).toHaveProp('accessibilityValue', { min: 1, max: 20, now: 5, text: '5 km' });
    });

    it('goes up and down with the screen reader actions', async () => {
      const { onValueChange } = await renderSlider();
      const slider = screen.getByRole('adjustable');
      await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
      expect(onValueChange).toHaveBeenLastCalledWith(6);
      await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
      expect(onValueChange).toHaveBeenLastCalledWith(4);
    });

    it('does not go past either end with the actions', async () => {
      const { onValueChange } = await renderSlider({ value: 20 });
      await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does not go below the minimum with the actions', async () => {
      const { onValueChange } = await renderSlider({ value: 1 });
      await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('has a touch area of at least 44', async () => {
      await renderSlider();
      expect(screen.getByRole('adjustable')).toHaveStyle({ height: height.minTouch });
    });
  });

  describe('drawing', () => {
    it('places the thumb where the value is: 4/19 of the usable track for 5 of 1 to 20', async () => {
      await renderSlider({ value: 5 });
      expect(translateXOf('slider-thumb')).toBeCloseTo((4 / 19) * (WIDTH - THUMB), 3);
    });

    it('puts the thumb at each end for the minimum and the maximum', async () => {
      const { view } = await renderSlider({ value: 1 });
      expect(translateXOf('slider-thumb')).toBe(0);
      await view.rerender(
        <Slider value={20} onValueChange={jest.fn()} min={1} max={20} step={1} accessibilityLabel="D" />,
      );
      expect(translateXOf('slider-thumb')).toBe(WIDTH - THUMB);
    });

    it('fills the track up to the center of the thumb, with a transform only', async () => {
      await renderSlider({ value: 5 });
      const travel = (4 / 19) * (WIDTH - THUMB);
      expect(translateXOf('slider-fill')).toBeCloseTo(travel + THUMB / 2 - WIDTH, 3);
      expect(JSON.stringify(screen.getByTestId('slider-fill').props.style)).toContain(colors.ink);
    });

    it('draws the track in the line color and the thumb in ink', async () => {
      await renderSlider();
      expect(JSON.stringify(screen.getByTestId('slider-thumb').props.style)).toContain(colors.ink);
      expect(JSON.stringify(screen.getByTestId('slider').children)).toContain(colors.line);
    });

    it('keeps the thumb at the start until the track has been measured', async () => {
      const onValueChange = jest.fn();
      await render(
        <Slider value={10} onValueChange={onValueChange} min={1} max={20} step={1} accessibilityLabel="D" />,
      );
      expect(translateXOf('slider-thumb')).toBe(0);
    });
  });

  describe('dragging', () => {
    const pan = () => getByGestureTestId('slider-pan');
    // o toque mede o centro do círculo: x = posição útil + 14
    const x = (position: number) => position + THUMB / 2;

    it('jumps to the touched step on the first touch', async () => {
      const { onValueChange } = await renderSlider({ value: 5 });
      fireGestureHandler(pan(), [{ state: State.BEGAN, x: x(100) }, { state: State.END, x: x(100) }]);
      expect(onValueChange).toHaveBeenCalledWith(11);
    });

    it('follows the finger while dragging, one call per new step', async () => {
      const { onValueChange } = await renderSlider({ value: 5 });
      fireGestureHandler(pan(), [
        { state: State.BEGAN, x: x(40) },
        { state: State.ACTIVE, x: x(40) },
        { x: x(52) },
        { x: x(54) },
        { x: x(120) },
        { state: State.END, x: x(120) },
      ]);
      const values = distinct(onValueChange.mock.calls.map(([value]) => value));
      // o 1º toque cai no passo 5, que já é o valor de agora; depois 6 (duas vezes, mesmo passo) e 13
      expect(values).toEqual([6, 13]);
    });

    it('stops at the ends when the finger leaves the track', async () => {
      const { onValueChange } = await renderSlider({ value: 5 });
      fireGestureHandler(pan(), [
        { state: State.BEGAN, x: x(100) },
        { state: State.ACTIVE, x: x(100) },
        { x: x(900) },
        { x: x(-300) },
        { state: State.END, x: x(-300) },
      ]);
      const values = distinct(onValueChange.mock.calls.map(([value]) => value));
      expect(values).toEqual([11, 20, 1]);
    });

    it('does not react to touches when disabled', async () => {
      const { onValueChange } = await renderSlider({ disabled: true });
      fireGestureHandler(pan(), [{ state: State.BEGAN, x: x(100) }, { state: State.END, x: x(100) }]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does not repeat a value that did not change', async () => {
      const { onValueChange } = await renderSlider({ value: 11 });
      fireGestureHandler(pan(), [{ state: State.BEGAN, x: x(100) }, { x: x(101) }, { state: State.END, x: x(101) }]);
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});
