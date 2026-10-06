import { TRAVEL_MODES } from '@/types/ids';

import {
  BUS_WAIT_MINUTES,
  ROUTE_FACTOR,
  TRAVEL_SPEED_KMH,
  estimateTravelMinutes,
  estimateTravelMinutesByMode,
} from './travelTime';

describe('estimateTravelMinutes', () => {
  it('applies the route factor and the average speed of each mode, rounding up', () => {
    // 1 km em linha reta = 1,3 km pelas ruas
    expect(estimateTravelMinutes(1, 'walk')).toBe(16); // 1,3 / 5 h = 15,6 min
    expect(estimateTravelMinutes(1, 'car')).toBe(4); // 1,3 / 25 h = 3,12 min
    expect(estimateTravelMinutes(1, 'bus')).toBe(13); // 1,3 / 18 h = 4,33 min + 8 de espera
  });

  it('does not add a minute because of floating point error', () => {
    // 5 km a pé = 6,5 km / 5 km/h = 78 min exatos
    expect(estimateTravelMinutes(5, 'walk')).toBe(78);
  });

  it('exposes the constants of D33', () => {
    expect(ROUTE_FACTOR).toBe(1.3);
    expect(TRAVEL_SPEED_KMH).toEqual({ walk: 5, bus: 18, car: 25 });
    expect(BUS_WAIT_MINUTES).toBe(8);
  });

  it('takes at least one minute for any distance above zero', () => {
    expect(estimateTravelMinutes(0.01, 'walk')).toBe(1);
    expect(estimateTravelMinutes(0.001, 'car')).toBe(1);
  });

  it('is zero when the person is already there, with no bus wait either', () => {
    for (const mode of TRAVEL_MODES) {
      expect(estimateTravelMinutes(0, mode)).toBe(0);
    }
  });

  it('is zero for a negative or invalid distance', () => {
    expect(estimateTravelMinutes(-3, 'walk')).toBe(0);
    expect(estimateTravelMinutes(Number.NaN, 'bus')).toBe(0);
  });

  it('never decreases as the distance grows', () => {
    for (const mode of TRAVEL_MODES) {
      let previous = 0;
      for (let km = 0; km <= 20; km += 0.25) {
        const minutes = estimateTravelMinutes(km, mode);
        expect(minutes).toBeGreaterThanOrEqual(previous);
        previous = minutes;
      }
    }
  });

  it('makes the car faster than the bus and the bus faster than walking on a long trip', () => {
    const minutes = estimateTravelMinutesByMode(8);
    expect(minutes.car).toBeLessThan(minutes.bus);
    expect(minutes.bus).toBeLessThan(minutes.walk);
  });

  it('makes walking beat the bus on a short trip, because of the wait', () => {
    const minutes = estimateTravelMinutesByMode(0.3);
    expect(minutes.walk).toBeLessThan(minutes.bus);
  });
});

describe('estimateTravelMinutesByMode', () => {
  it('returns the three modes of the glossary', () => {
    expect(estimateTravelMinutesByMode(1.8)).toEqual({
      walk: estimateTravelMinutes(1.8, 'walk'),
      bus: estimateTravelMinutes(1.8, 'bus'),
      car: estimateTravelMinutes(1.8, 'car'),
    });
    expect(Object.keys(estimateTravelMinutesByMode(1.8))).toEqual(['walk', 'bus', 'car']);
  });
});
