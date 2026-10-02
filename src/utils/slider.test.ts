import { positionToValue, snapToStep, valueToFraction } from './slider';

describe('snapToStep', () => {
  it('snaps to the nearest step', () => {
    expect(snapToStep(5.4, 1, 20, 1)).toBe(5);
    expect(snapToStep(5.6, 1, 20, 1)).toBe(6);
  });

  it('counts the steps from the minimum, not from zero', () => {
    expect(snapToStep(7, 1, 20, 2)).toBe(7); // 1, 3, 5, 7
    expect(snapToStep(8, 1, 20, 2)).toBe(9);
  });

  it('clamps to the range', () => {
    expect(snapToStep(-3, 1, 20, 1)).toBe(1);
    expect(snapToStep(99, 1, 20, 1)).toBe(20);
  });

  it('does not leave floating-point noise', () => {
    expect(snapToStep(0.3, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(0.7000000001, 0, 1, 0.1)).toBe(0.7);
  });

  it('survives a degenerate range or step', () => {
    expect(snapToStep(5, 3, 3, 1)).toBe(3);
    expect(snapToStep(5, 1, 20, 0)).toBe(5);
    expect(snapToStep(50, 1, 20, 0)).toBe(20);
  });
});

describe('valueToFraction', () => {
  it('maps the range onto 0..1', () => {
    expect(valueToFraction(1, 1, 20)).toBe(0);
    expect(valueToFraction(20, 1, 20)).toBe(1);
    expect(valueToFraction(10.5, 1, 20)).toBeCloseTo(0.5, 5);
  });

  it('clamps and handles an empty range', () => {
    expect(valueToFraction(0, 1, 20)).toBe(0);
    expect(valueToFraction(30, 1, 20)).toBe(1);
    expect(valueToFraction(5, 5, 5)).toBe(0);
  });
});

describe('positionToValue', () => {
  // trilho de 190 pontos para 1..20 km, passo 1: cada passo vale 10 pontos
  it('turns a touch position into a stepped value', () => {
    expect(positionToValue(0, 190, 1, 20, 1)).toBe(1);
    expect(positionToValue(190, 190, 1, 20, 1)).toBe(20);
    expect(positionToValue(40, 190, 1, 20, 1)).toBe(5);
    expect(positionToValue(44, 190, 1, 20, 1)).toBe(5);
    expect(positionToValue(46, 190, 1, 20, 1)).toBe(6);
  });

  it('treats a touch outside the track as the nearest end', () => {
    expect(positionToValue(-30, 190, 1, 20, 1)).toBe(1);
    expect(positionToValue(400, 190, 1, 20, 1)).toBe(20);
  });

  it('returns the minimum while the track has no width yet', () => {
    expect(positionToValue(50, 0, 1, 20, 1)).toBe(1);
  });

  it('is the inverse of valueToFraction on each step', () => {
    for (let value = 1; value <= 20; value++) {
      const position = valueToFraction(value, 1, 20) * 190;
      expect(positionToValue(position, 190, 1, 20, 1)).toBe(value);
    }
  });
});
