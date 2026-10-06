import {
  getZonedDateKey,
  getZonedMinutesOfDay,
  getZonedParts,
  getZoneOffsetMs,
  isSameZonedDay,
  isValidTimeZone,
  MS_PER_HOUR,
  startOfNextZonedDay,
  startOfNextZonedWeek,
  startOfZonedDay,
  startOfZonedWeek,
  zonedTimeToUtc,
} from './zonedTime';

const SAO_PAULO = 'America/Sao_Paulo';
const NEW_YORK = 'America/New_York';
const TOKYO = 'Asia/Tokyo';
const KOLKATA = 'Asia/Kolkata';

const iso = (date: Date) => date.toISOString();

describe('getZonedParts', () => {
  it('reads the wall clock of the zone, not the device', () => {
    // sexta-feira 02/10/2026, 23:30 em São Paulo (UTC-3)
    expect(getZonedParts(new Date('2026-10-03T02:30:15Z'), SAO_PAULO)).toEqual({
      year: 2026,
      month: 10,
      day: 2,
      hour: 23,
      minute: 30,
      second: 15,
      weekday: 5,
    });
  });

  it('crosses the day boundary in zones ahead of UTC', () => {
    // sábado 03/10/2026, 05:00 em Tóquio (UTC+9)
    expect(getZonedParts(new Date('2026-10-02T20:00:00Z'), TOKYO)).toMatchObject({
      year: 2026,
      month: 10,
      day: 3,
      hour: 5,
      weekday: 6,
    });
  });

  it('never returns hour 24 at midnight', () => {
    expect(getZonedParts(new Date('2026-10-03T03:00:00Z'), SAO_PAULO)).toMatchObject({
      day: 3,
      hour: 0,
      minute: 0,
    });
  });

  it('accepts a timestamp in milliseconds', () => {
    expect(getZonedParts(Date.parse('2026-10-03T02:30:00Z'), SAO_PAULO).hour).toBe(23);
  });

  it('computes the weekday from the calendar (leap day included)', () => {
    // 29/02/2028 é uma terça-feira
    expect(getZonedParts(new Date('2028-02-29T12:00:00Z'), SAO_PAULO).weekday).toBe(2);
  });

  it('throws RangeError for an unknown zone', () => {
    expect(() => getZonedParts(new Date(), 'Not/AZone')).toThrow(RangeError);
  });
});

describe('isValidTimeZone', () => {
  it('tells known and unknown IANA names apart', () => {
    expect(isValidTimeZone(SAO_PAULO)).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('getZoneOffsetMs', () => {
  it('returns the offset of the zone at that instant', () => {
    expect(getZoneOffsetMs(new Date('2026-10-02T15:00:00Z'), SAO_PAULO)).toBe(-3 * MS_PER_HOUR);
    expect(getZoneOffsetMs(new Date('2026-10-02T15:00:00Z'), KOLKATA)).toBe(5.5 * MS_PER_HOUR);
  });

  it('ignores the milliseconds of the instant', () => {
    expect(getZoneOffsetMs(new Date('2026-10-02T15:00:00.999Z'), SAO_PAULO)).toBe(-3 * MS_PER_HOUR);
  });

  it('follows daylight saving time', () => {
    expect(getZoneOffsetMs(new Date('2026-03-08T06:59:59Z'), NEW_YORK)).toBe(-5 * MS_PER_HOUR);
    expect(getZoneOffsetMs(new Date('2026-03-08T07:00:00Z'), NEW_YORK)).toBe(-4 * MS_PER_HOUR);
  });
});

describe('zonedTimeToUtc', () => {
  it('converts a wall clock time to the instant', () => {
    expect(iso(zonedTimeToUtc({ year: 2026, month: 10, day: 2, hour: 23, minute: 30 }, SAO_PAULO))).toBe(
      '2026-10-03T02:30:00.000Z',
    );
    expect(iso(zonedTimeToUtc({ year: 2026, month: 10, day: 3, hour: 5 }, TOKYO))).toBe(
      '2026-10-02T20:00:00.000Z',
    );
  });

  it('rolls out-of-range fields over to the neighbouring day', () => {
    expect(iso(zonedTimeToUtc({ year: 2026, month: 10, day: 32 }, SAO_PAULO))).toBe(
      '2026-11-01T03:00:00.000Z',
    );
    expect(iso(zonedTimeToUtc({ year: 2026, month: 10, day: 2, hour: 24 }, SAO_PAULO))).toBe(
      '2026-10-03T03:00:00.000Z',
    );
  });

  it('picks the first occurrence of a repeated hour (fall back)', () => {
    // 01/11/2026 em Nova York: 01:30 acontece duas vezes (05:30Z em EDT e 06:30Z em EST)
    expect(iso(zonedTimeToUtc({ year: 2026, month: 11, day: 1, hour: 1, minute: 30 }, NEW_YORK))).toBe(
      '2026-11-01T05:30:00.000Z',
    );
  });

  it('moves a skipped hour forward (spring forward)', () => {
    // 08/03/2026 em Nova York: 02:30 não existe; vale 03:30 EDT
    expect(iso(zonedTimeToUtc({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, NEW_YORK))).toBe(
      '2026-03-08T07:30:00.000Z',
    );
  });

  it('round-trips with getZonedParts', () => {
    const zones = [SAO_PAULO, NEW_YORK, TOKYO, KOLKATA, 'Europe/Lisbon'];
    const instants = [
      '2026-01-01T00:00:00Z',
      '2026-03-29T00:59:59Z',
      '2026-06-15T12:34:56Z',
      '2026-10-02T15:00:00Z',
      '2026-12-31T23:59:59Z',
      '2028-02-29T03:00:00Z',
    ];
    for (const zone of zones) {
      for (const instant of instants) {
        const parts = getZonedParts(new Date(instant), zone);
        expect(zonedTimeToUtc(parts, zone).getTime()).toBe(Date.parse(instant));
      }
    }
  });
});

describe('getZonedDateKey, getZonedMinutesOfDay and isSameZonedDay', () => {
  it('builds a zero-padded date key in the zone', () => {
    expect(getZonedDateKey(new Date('2026-01-05T02:00:00Z'), SAO_PAULO)).toBe('2026-01-04');
    expect(getZonedDateKey(new Date('2026-01-05T02:00:00Z'), TOKYO)).toBe('2026-01-05');
  });

  it('counts the minutes since local midnight', () => {
    expect(getZonedMinutesOfDay(new Date('2026-10-03T02:30:00Z'), SAO_PAULO)).toBe(23 * 60 + 30);
    expect(getZonedMinutesOfDay(new Date('2026-10-03T03:00:00Z'), SAO_PAULO)).toBe(0);
    expect(getZonedMinutesOfDay(new Date('2026-10-03T02:59:59Z'), SAO_PAULO)).toBe(23 * 60 + 59);
  });

  it('compares days in the zone, not in UTC', () => {
    const lateNight = new Date('2026-10-03T02:30:00Z'); // 23:30 de 02/10 em SP, 03/10 em UTC
    const earlyMorning = new Date('2026-10-02T15:00:00Z'); // 12:00 de 02/10 em SP
    expect(isSameZonedDay(lateNight, earlyMorning, SAO_PAULO)).toBe(true);
    expect(isSameZonedDay(lateNight, earlyMorning, 'UTC')).toBe(false);
  });
});

describe('startOfZonedDay and startOfNextZonedDay', () => {
  it('turns the day at local midnight', () => {
    expect(iso(startOfZonedDay(new Date('2026-10-03T02:59:59Z'), SAO_PAULO))).toBe('2026-10-02T03:00:00.000Z');
    expect(iso(startOfZonedDay(new Date('2026-10-03T03:00:00Z'), SAO_PAULO))).toBe('2026-10-03T03:00:00.000Z');
    expect(iso(startOfNextZonedDay(new Date('2026-10-03T02:59:59Z'), SAO_PAULO))).toBe(
      '2026-10-03T03:00:00.000Z',
    );
  });

  it('has a 23-hour day when the clock springs forward', () => {
    const noon = new Date('2026-03-08T17:00:00Z');
    const start = startOfZonedDay(noon, NEW_YORK);
    const next = startOfNextZonedDay(noon, NEW_YORK);
    expect(iso(start)).toBe('2026-03-08T05:00:00.000Z');
    expect(iso(next)).toBe('2026-03-09T04:00:00.000Z');
    expect((next.getTime() - start.getTime()) / MS_PER_HOUR).toBe(23);
  });

  it('has a 25-hour day when the clock falls back', () => {
    const noon = new Date('2026-11-01T17:00:00Z');
    const start = startOfZonedDay(noon, NEW_YORK);
    const next = startOfNextZonedDay(noon, NEW_YORK);
    expect(iso(start)).toBe('2026-11-01T04:00:00.000Z');
    expect(iso(next)).toBe('2026-11-02T05:00:00.000Z');
    expect((next.getTime() - start.getTime()) / MS_PER_HOUR).toBe(25);
  });

  it('starts the day at 01:00 when DST skips midnight (São Paulo, 04/11/2018)', () => {
    expect(iso(startOfZonedDay(new Date('2018-11-04T12:00:00Z'), SAO_PAULO))).toBe('2018-11-04T03:00:00.000Z');
    expect(getZonedParts(startOfZonedDay(new Date('2018-11-04T12:00:00Z'), SAO_PAULO), SAO_PAULO)).toMatchObject({
      day: 4,
      hour: 1,
    });
  });
});

describe('startOfZonedWeek and startOfNextZonedWeek', () => {
  it('starts the week on Monday at local midnight', () => {
    // sexta 02/10/2026 -> segunda 28/09/2026 00:00 em SP
    expect(iso(startOfZonedWeek(new Date('2026-10-02T15:00:00Z'), SAO_PAULO))).toBe('2026-09-28T03:00:00.000Z');
    expect(iso(startOfNextZonedWeek(new Date('2026-10-02T15:00:00Z'), SAO_PAULO))).toBe(
      '2026-10-05T03:00:00.000Z',
    );
  });

  it('keeps Sunday night in the old week and Monday 00:00 in the new one', () => {
    // domingo 04/10/2026 23:59:59 em SP = 05/10 02:59:59Z
    expect(iso(startOfZonedWeek(new Date('2026-10-05T02:59:59Z'), SAO_PAULO))).toBe('2026-09-28T03:00:00.000Z');
    // segunda 05/10/2026 00:00 em SP = 05/10 03:00Z
    expect(iso(startOfZonedWeek(new Date('2026-10-05T03:00:00Z'), SAO_PAULO))).toBe('2026-10-05T03:00:00.000Z');
  });

  it('is the same instant for every moment of the week', () => {
    const weekStart = '2026-09-28T03:00:00.000Z';
    for (const instant of ['2026-09-28T03:00:00Z', '2026-09-30T18:00:00Z', '2026-10-05T02:59:59Z']) {
      expect(iso(startOfZonedWeek(new Date(instant), SAO_PAULO))).toBe(weekStart);
    }
  });

  it('depends on the zone: the same instant is in different weeks', () => {
    // domingo 04/10/2026 23:00 em SP = segunda 05/10 11:00 em Tóquio
    const instant = new Date('2026-10-05T02:00:00Z');
    expect(iso(startOfZonedWeek(instant, SAO_PAULO))).toBe('2026-09-28T03:00:00.000Z');
    expect(iso(startOfZonedWeek(instant, TOKYO))).toBe('2026-10-04T15:00:00.000Z');
  });

  it('crosses the year boundary', () => {
    // sexta 01/01/2027 -> segunda 28/12/2026
    expect(iso(startOfZonedWeek(new Date('2027-01-01T15:00:00Z'), SAO_PAULO))).toBe('2026-12-28T03:00:00.000Z');
    expect(iso(startOfNextZonedWeek(new Date('2027-01-01T15:00:00Z'), SAO_PAULO))).toBe(
      '2027-01-04T03:00:00.000Z',
    );
  });

  it('follows DST inside the week (spring forward in New York)', () => {
    // domingo 08/03/2026 (dia da mudança): a semana começou na segunda 02/03 em EST
    const sunday = new Date('2026-03-08T17:00:00Z');
    expect(iso(startOfZonedWeek(sunday, NEW_YORK))).toBe('2026-03-02T05:00:00.000Z');
    // a seguinte começa na segunda 09/03 em EDT
    expect(iso(startOfNextZonedWeek(sunday, NEW_YORK))).toBe('2026-03-09T04:00:00.000Z');
  });

  it('has a week of 167 hours when the clock springs forward and 169 when it falls back', () => {
    const springWeek = new Date('2026-03-04T17:00:00Z');
    const fallWeek = new Date('2026-10-28T17:00:00Z');
    const length = (instant: Date) =>
      (startOfNextZonedWeek(instant, NEW_YORK).getTime() - startOfZonedWeek(instant, NEW_YORK).getTime()) /
      MS_PER_HOUR;
    expect(length(springWeek)).toBe(167);
    // a volta do horário de verão em 2026 é no domingo 01/11, na semana de segunda 26/10
    expect(length(fallWeek)).toBe(169);
  });
});
