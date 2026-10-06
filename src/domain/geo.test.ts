import { getDistanceKm, getDistanceMeters, getTripProgress } from './geo';

/** Um grau de latitude (ou de longitude, no equador) com o raio médio da Terra de 6.371.008,8 m. */
const METERS_PER_DEGREE = 111_194.93;

describe('getDistanceMeters', () => {
  it('is zero for the same point', () => {
    const point = { latitude: -23.55, longitude: -46.63 };
    expect(getDistanceMeters(point, point)).toBe(0);
  });

  it('measures one degree of latitude and one degree of longitude at the equator', () => {
    const origin = { latitude: 0, longitude: 0 };
    expect(getDistanceMeters(origin, { latitude: 1, longitude: 0 })).toBeCloseTo(METERS_PER_DEGREE, 0);
    expect(getDistanceMeters(origin, { latitude: 0, longitude: 1 })).toBeCloseTo(METERS_PER_DEGREE, 0);
  });

  it('shrinks the longitude degrees away from the equator', () => {
    // a 60° de latitude, o cosseno é 0,5: um grau de longitude vale metade
    const distance = getDistanceMeters({ latitude: 60, longitude: 0 }, { latitude: 60, longitude: 1 });
    expect(distance).toBeGreaterThan(METERS_PER_DEGREE * 0.49);
    expect(distance).toBeLessThan(METERS_PER_DEGREE * 0.51);
  });

  it('is symmetric', () => {
    const sp = { latitude: -23.5505, longitude: -46.6333 };
    const rio = { latitude: -22.9068, longitude: -43.1729 };
    expect(getDistanceMeters(sp, rio)).toBeCloseTo(getDistanceMeters(rio, sp), 6);
  });

  it('gives the known distance between São Paulo and Rio de Janeiro (about 360 km)', () => {
    const sp = { latitude: -23.5505, longitude: -46.6333 };
    const rio = { latitude: -22.9068, longitude: -43.1729 };
    const km = getDistanceMeters(sp, rio) / 1000;
    expect(km).toBeGreaterThan(355);
    expect(km).toBeLessThan(365);
  });

  it('crosses the antimeridian the short way', () => {
    const distance = getDistanceMeters({ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 });
    expect(distance).toBeCloseTo(METERS_PER_DEGREE, 0);
  });

  it('handles opposite points of the Earth without NaN', () => {
    const half = Math.PI * 6_371_008.8;
    expect(getDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 })).toBeCloseTo(half, 0);
    expect(getDistanceMeters({ latitude: 90, longitude: 0 }, { latitude: -90, longitude: 0 })).toBeCloseTo(half, 0);
    expect(getDistanceMeters({ latitude: 10, longitude: 20 }, { latitude: -10, longitude: -160 })).toBeCloseTo(half, 0);
  });

  it('is accurate for short distances (a few hundred meters)', () => {
    const from = { latitude: -23.55, longitude: -46.63 };
    const to = { latitude: -23.55 + 300 / METERS_PER_DEGREE, longitude: -46.63 };
    expect(getDistanceMeters(from, to)).toBeCloseTo(300, 1);
  });
});

describe('getDistanceKm', () => {
  it('is the distance in meters divided by 1000', () => {
    const from = { latitude: 0, longitude: 0 };
    const to = { latitude: 1, longitude: 0 };
    expect(getDistanceKm(from, to)).toBeCloseTo(getDistanceMeters(from, to) / 1000, 9);
    expect(getDistanceKm(from, to)).toBeCloseTo(111.19, 1);
  });
});

describe('getTripProgress', () => {
  it('goes from 0 at the start to 1 on arrival', () => {
    expect(getTripProgress(1000, 1000)).toBe(0);
    expect(getTripProgress(1000, 750)).toBe(0.25);
    expect(getTripProgress(1000, 500)).toBe(0.5);
    expect(getTripProgress(1000, 0)).toBe(1);
  });

  it('never goes below 0 when the person walks away from the destination', () => {
    expect(getTripProgress(1000, 1200)).toBe(0);
  });

  it('never goes above 1', () => {
    expect(getTripProgress(1000, -5)).toBe(1);
  });

  it('counts as arrived when the trip started at the destination', () => {
    expect(getTripProgress(0, 0)).toBe(1);
    expect(getTripProgress(0, 30)).toBe(1);
    expect(getTripProgress(-1, 30)).toBe(1);
  });
});
