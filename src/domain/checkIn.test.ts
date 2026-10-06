import { checkIn, CHECK_IN_RADIUS_METERS, MAX_USABLE_ACCURACY_METERS } from './checkIn';

const METERS_PER_DEGREE = 111_194.93;
const PLACE = { latitude: -23.55, longitude: -46.63 };

/** Uma posição `meters` metros ao norte do lugar. */
const north = (meters: number, accuracyMeters?: number | null) => ({
  latitude: PLACE.latitude + meters / METERS_PER_DEGREE,
  longitude: PLACE.longitude,
  accuracyMeters,
});

describe('checkIn', () => {
  it('uses the 150 m radius of D6 by default', () => {
    expect(CHECK_IN_RADIUS_METERS).toBe(150);
    expect(MAX_USABLE_ACCURACY_METERS).toBe(100);
  });

  it('is inside at the place itself', () => {
    expect(checkIn({ ...PLACE, accuracyMeters: 5 }, PLACE)).toEqual({ status: 'inside', distanceMeters: 0 });
  });

  it('is inside within the radius and outside beyond it, when the accuracy is unknown', () => {
    expect(checkIn(north(149), PLACE).status).toBe('inside');
    expect(checkIn(north(151), PLACE).status).toBe('outside');
    expect(checkIn(north(149, null), PLACE).status).toBe('inside');
    expect(checkIn(north(151, null), PLACE).status).toBe('outside');
  });

  it('reports the distance to the place', () => {
    expect(checkIn(north(300), PLACE).distanceMeters).toBeCloseTo(300, 1);
  });

  it('adds the GPS accuracy to the radius', () => {
    expect(checkIn(north(179, 30), PLACE).status).toBe('inside'); // 179 - 30 = 149
    expect(checkIn(north(181, 30), PLACE).status).toBe('outside'); // 181 - 30 = 151
  });

  it('trusts a reading at the accuracy limit', () => {
    expect(checkIn(north(249, MAX_USABLE_ACCURACY_METERS), PLACE).status).toBe('inside');
    expect(checkIn(north(251, MAX_USABLE_ACCURACY_METERS), PLACE).status).toBe('outside');
  });

  it('asks to try again when the accuracy is too poor to trust but the place is possibly reached', () => {
    expect(checkIn(north(100, 500), PLACE).status).toBe('uncertain');
    expect(checkIn(north(200, MAX_USABLE_ACCURACY_METERS + 1), PLACE).status).toBe('uncertain');
  });

  it('says outside even with a poor accuracy when the place is out of reach anyway', () => {
    expect(checkIn(north(700, 500), PLACE).status).toBe('outside'); // 700 - 500 = 200 > 150
  });

  it('treats a negative, zero or invalid accuracy as a perfect reading', () => {
    expect(checkIn(north(151, -50), PLACE).status).toBe('outside');
    expect(checkIn(north(151, 0), PLACE).status).toBe('outside');
    expect(checkIn(north(151, Number.NaN), PLACE).status).toBe('outside');
    expect(checkIn(north(149, -50), PLACE).status).toBe('inside');
  });

  it('accepts another radius', () => {
    expect(checkIn(north(60), PLACE, 50).status).toBe('outside');
    expect(checkIn(north(60), PLACE, 80).status).toBe('inside');
  });
});
