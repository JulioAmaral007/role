import type { City } from '@/types/place';
import { zonedTimeToUtc } from '@/utils/zonedTime';

import { DAYLIGHT_START_MINUTE, isDaylightSafe } from './safety';

const NIGHT_ALLOWED = { daylightOnly: false };
const DAYLIGHT_ONLY = { daylightOnly: true };

const SAO_PAULO: Pick<City, 'timeZone' | 'daylightCutoffMinute'> = {
  timeZone: 'America/Sao_Paulo',
  daylightCutoffMinute: 18 * 60,
};

/** 02/10/2026 (sexta) em São Paulo, no horário `HH:mm`; `day` permite chegar ao dia seguinte. */
const spAt = (time: string, day = 2) => {
  const [hour, minute] = time.split(':').map(Number);
  return zonedTimeToUtc({ year: 2026, month: 10, day, hour, minute }, SAO_PAULO.timeZone);
};

describe('isDaylightSafe', () => {
  it('always allows a place that is not daylight only', () => {
    expect(isDaylightSafe(NIGHT_ALLOWED, SAO_PAULO, spAt('23:00'), 120)).toBe(true);
    expect(isDaylightSafe(NIGHT_ALLOWED, SAO_PAULO, spAt('03:00'), 0)).toBe(true);
  });

  it('allows a daylight-only place during the day', () => {
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('10:00'), 120)).toBe(true);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('17:59'))).toBe(true);
  });

  it('hides a daylight-only place at and after the cutoff', () => {
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('18:00'))).toBe(false);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('21:30'), 60)).toBe(false);
  });

  it('requires the whole window to end by the cutoff', () => {
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('16:00'), 120)).toBe(true); // termina às 18:00
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('16:01'), 120)).toBe(false);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('15:00'), 6 * 60)).toBe(false);
  });

  it('only looks at the departure moment when the duration is zero', () => {
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('17:30'))).toBe(true);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('17:30'), -45)).toBe(true);
  });

  it('hides a daylight-only place before the day starts', () => {
    expect(DAYLIGHT_START_MINUTE).toBe(6 * 60);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('02:00'), 60)).toBe(false);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('05:59'), 60)).toBe(false);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('06:00'), 60)).toBe(true);
  });

  it('rejects a window that crosses midnight', () => {
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('17:00'), 10 * 60)).toBe(false);
  });

  it('judges each day by its own cutoff', () => {
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('10:00', 3), 60)).toBe(true);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('19:00', 3), 60)).toBe(false);
  });

  it('uses the cutoff and the time zone of the city', () => {
    const instant = spAt('16:00'); // 19:00Z
    const earlyCity = { ...SAO_PAULO, daylightCutoffMinute: 16 * 60 + 30 };
    expect(isDaylightSafe(DAYLIGHT_ONLY, earlyCity, instant, 60)).toBe(false);
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, instant, 60)).toBe(true);

    // o mesmo instante é 04:00 do dia seguinte em Tóquio: ainda escuro
    const tokyo = { timeZone: 'Asia/Tokyo', daylightCutoffMinute: 18 * 60 };
    expect(isDaylightSafe(DAYLIGHT_ONLY, tokyo, instant, 60)).toBe(false);
  });

  it('follows daylight saving time when computing the cutoff', () => {
    const newYork = { timeZone: 'America/New_York', daylightCutoffMinute: 18 * 60 };
    // 08/03/2026: o relógio pulou às 02:00, então 18:00 EDT é 22:00Z; 16:00 EDT é 20:00Z
    const start = new Date('2026-03-08T20:00:00Z');
    expect(isDaylightSafe(DAYLIGHT_ONLY, newYork, start, 120)).toBe(true);
    expect(isDaylightSafe(DAYLIGHT_ONLY, newYork, start, 121)).toBe(false);
  });

  it('never allows a daylight-only place when the cutoff is not after the day start', () => {
    const misconfigured = { ...SAO_PAULO, daylightCutoffMinute: 5 * 60 };
    expect(isDaylightSafe(DAYLIGHT_ONLY, misconfigured, spAt('06:00'))).toBe(false);
    expect(isDaylightSafe(DAYLIGHT_ONLY, misconfigured, spAt('12:00'))).toBe(false);
  });

  it('accepts a timestamp in milliseconds', () => {
    expect(isDaylightSafe(DAYLIGHT_ONLY, SAO_PAULO, spAt('10:00').getTime(), 60)).toBe(true);
  });
});
