import type { PlaceHours } from '@/types/place';
import { zonedTimeToUtc } from '@/utils/zonedTime';

import { getOpenUntil, isOpenDuring } from './openingHours';

const SAO_PAULO = 'America/Sao_Paulo';
const NEW_YORK = 'America/New_York';
const TOKYO = 'Asia/Tokyo';

const FRIDAY = 5;
const SATURDAY = 6;
const SUNDAY = 0;

/** "HH:mm" em minutos desde a meia-noite. */
const toMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};
const range = (weekday: number, opens: string, closes: string): PlaceHours => ({
  weekday,
  opensMinute: toMinutes(opens),
  closesMinute: toMinutes(closes),
});

/** Outubro de 2026 em São Paulo: sexta = 2, sábado = 3, domingo = 4. */
const spAt = (day: number, time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return zonedTimeToUtc({ year: 2026, month: 10, day, hour, minute }, SAO_PAULO);
};
const iso = (date: Date | null) => date?.toISOString() ?? null;

describe('isOpenDuring', () => {
  const dayShift = [range(FRIDAY, '09:00', '18:00')];

  it('is open when the whole window fits inside the opening hours', () => {
    expect(isOpenDuring(dayShift, spAt(2, '12:00'), 120, SAO_PAULO)).toBe(true);
  });

  it('is closed when the window runs past closing time', () => {
    expect(isOpenDuring(dayShift, spAt(2, '12:00'), 7 * 60, SAO_PAULO)).toBe(false);
    expect(isOpenDuring(dayShift, spAt(2, '16:01'), 120, SAO_PAULO)).toBe(false);
  });

  it('counts closing exactly at the end of the window as open', () => {
    expect(isOpenDuring(dayShift, spAt(2, '16:00'), 120, SAO_PAULO)).toBe(true);
  });

  it('counts opening exactly at the start of the window as open, and one minute before as closed', () => {
    expect(isOpenDuring(dayShift, spAt(2, '09:00'), 60, SAO_PAULO)).toBe(true);
    expect(isOpenDuring(dayShift, spAt(2, '08:59'), 60, SAO_PAULO)).toBe(false);
  });

  it('is closed at the closing instant itself', () => {
    expect(isOpenDuring(dayShift, spAt(2, '18:00'), 0, SAO_PAULO)).toBe(false);
  });

  it('is closed on a weekday without hours', () => {
    expect(isOpenDuring(dayShift, spAt(3, '12:00'), 60, SAO_PAULO)).toBe(false);
  });

  it('is closed when the place has no hours at all', () => {
    expect(isOpenDuring([], spAt(2, '12:00'), 0, SAO_PAULO)).toBe(false);
  });

  it('accepts a zero-length window as a simple "open now" check', () => {
    expect(isOpenDuring(dayShift, spAt(2, '12:00'), 0, SAO_PAULO)).toBe(true);
    expect(isOpenDuring(dayShift, spAt(2, '19:00'), 0, SAO_PAULO)).toBe(false);
  });

  it('treats a negative duration as zero', () => {
    expect(isOpenDuring(dayShift, spAt(2, '12:00'), -30, SAO_PAULO)).toBe(true);
  });

  it('accepts a timestamp in milliseconds', () => {
    expect(isOpenDuring(dayShift, spAt(2, '12:00').getTime(), 120, SAO_PAULO)).toBe(true);
  });

  it('reads the hours in the city time zone, not in the device or UTC', () => {
    const instant = spAt(2, '12:00'); // 15:00Z: meio-dia em SP, 00:00 de sábado em Tóquio
    expect(isOpenDuring(dayShift, instant, 60, SAO_PAULO)).toBe(true);
    expect(isOpenDuring(dayShift, instant, 60, TOKYO)).toBe(false);
    expect(isOpenDuring(dayShift, instant, 60, 'UTC')).toBe(true); // 15:00 em UTC
    expect(isOpenDuring(dayShift, spAt(2, '17:00'), 60, 'UTC')).toBe(false); // 20:00 em UTC
  });

  describe('hours that cross midnight', () => {
    const bar = [range(FRIDAY, '18:00', '02:00')];

    it('is open on the evening side', () => {
      expect(isOpenDuring(bar, spAt(2, '23:00'), 120, SAO_PAULO)).toBe(true);
    });

    it('is open after midnight, on the next day, until closing', () => {
      expect(isOpenDuring(bar, spAt(3, '01:00'), 60, SAO_PAULO)).toBe(true);
      expect(isOpenDuring(bar, spAt(3, '01:00'), 61, SAO_PAULO)).toBe(false);
    });

    it('is closed after the late closing time', () => {
      expect(isOpenDuring(bar, spAt(3, '02:00'), 0, SAO_PAULO)).toBe(false);
      expect(isOpenDuring(bar, spAt(3, '03:00'), 30, SAO_PAULO)).toBe(false);
    });

    it('lets a window start in the evening and end after midnight', () => {
      expect(isOpenDuring(bar, spAt(2, '20:00'), 6 * 60, SAO_PAULO)).toBe(true);
      expect(isOpenDuring(bar, spAt(2, '20:00'), 6 * 60 + 1, SAO_PAULO)).toBe(false);
    });

    it('crosses the week boundary (Saturday night into Sunday)', () => {
      const late = [range(SATURDAY, '22:00', '03:00')];
      expect(isOpenDuring(late, spAt(4, '01:00'), 120, SAO_PAULO)).toBe(true);
      expect(isOpenDuring(late, spAt(4, '01:00'), 121, SAO_PAULO)).toBe(false);
    });

    it('does not take Sunday hours for the tail of Saturday night', () => {
      const hours = [range(SATURDAY, '22:00', '03:00'), range(SUNDAY, '10:00', '14:00')];
      expect(isOpenDuring(hours, spAt(4, '02:00'), 120, SAO_PAULO)).toBe(false);
      expect(isOpenDuring(hours, spAt(4, '10:00'), 240, SAO_PAULO)).toBe(true);
    });
  });

  describe('more than one range per day', () => {
    const restaurant = [range(FRIDAY, '12:00', '15:00'), range(FRIDAY, '19:00', '23:00')];

    it('is open inside either range', () => {
      expect(isOpenDuring(restaurant, spAt(2, '13:00'), 60, SAO_PAULO)).toBe(true);
      expect(isOpenDuring(restaurant, spAt(2, '19:30'), 120, SAO_PAULO)).toBe(true);
    });

    it('is closed when the window spans the gap between ranges', () => {
      expect(isOpenDuring(restaurant, spAt(2, '14:00'), 120, SAO_PAULO)).toBe(false);
      expect(isOpenDuring(restaurant, spAt(2, '16:00'), 30, SAO_PAULO)).toBe(false);
    });

    it('joins ranges that touch each other', () => {
      const touching = [range(FRIDAY, '10:00', '14:00'), range(FRIDAY, '14:00', '20:00')];
      expect(isOpenDuring(touching, spAt(2, '12:00'), 6 * 60, SAO_PAULO)).toBe(true);
    });

    it('joins a night range with the one that starts at midnight', () => {
      const split = [range(FRIDAY, '18:00', '00:00'), range(SATURDAY, '00:00', '02:00')];
      expect(isOpenDuring(split, spAt(2, '22:00'), 4 * 60, SAO_PAULO)).toBe(true);
      expect(isOpenDuring(split, spAt(2, '22:00'), 4 * 60 + 1, SAO_PAULO)).toBe(false);
    });
  });

  describe('places open all day', () => {
    // a forma comum de cadastrar "24 horas": 00:00 até 23:59 em todos os dias
    const allDay = Array.from({ length: 7 }, (_, weekday) => range(weekday, '00:00', '23:59'));

    it('is open across midnight despite the one-minute gap between the ranges', () => {
      expect(isOpenDuring(allDay, spAt(2, '20:00'), 8 * 60, SAO_PAULO)).toBe(true);
    });

    it('is open for a window longer than a day', () => {
      expect(isOpenDuring(allDay, spAt(2, '08:00'), 30 * 60, SAO_PAULO)).toBe(true);
    });

    it('is closed if a day in the middle of the window has no hours', () => {
      const withoutSaturday = allDay.filter((hours) => hours.weekday !== SATURDAY);
      expect(isOpenDuring(withoutSaturday, spAt(2, '20:00'), 8 * 60, SAO_PAULO)).toBe(false);
      expect(isOpenDuring(withoutSaturday, spAt(2, '20:00'), 3 * 60, SAO_PAULO)).toBe(true);
    });
  });

  describe('daylight saving time', () => {
    it('uses the real clock when the clock springs forward (New York, 08/03/2026)', () => {
      const overnight = [range(SUNDAY, '01:00', '05:00')];
      // 01:30 EST é 06:30Z; às 02:00 o relógio pula para 03:00, então 05:00 EDT é 09:00Z (2 h 30 reais)
      const start = new Date('2026-03-08T06:30:00Z');
      expect(isOpenDuring(overnight, start, 150, NEW_YORK)).toBe(true);
      expect(isOpenDuring(overnight, start, 151, NEW_YORK)).toBe(false);
    });

    it('uses the real clock when the clock falls back (New York, 01/11/2026)', () => {
      const overnight = [range(SUNDAY, '01:00', '05:00')];
      // 01:00 EDT é 05:00Z; a hora de 01:00 se repete e 05:00 EST é 10:00Z (5 h reais)
      const start = new Date('2026-11-01T05:00:00Z');
      expect(isOpenDuring(overnight, start, 300, NEW_YORK)).toBe(true);
      expect(isOpenDuring(overnight, start, 301, NEW_YORK)).toBe(false);
    });
  });
});

describe('getOpenUntil', () => {
  const hours = [range(FRIDAY, '09:00', '18:00')];

  it('returns the closing instant while open', () => {
    expect(iso(getOpenUntil(hours, spAt(2, '12:00'), SAO_PAULO))).toBe(spAt(2, '18:00').toISOString());
  });

  it('returns null while closed', () => {
    expect(getOpenUntil(hours, spAt(2, '08:00'), SAO_PAULO)).toBeNull();
    expect(getOpenUntil(hours, spAt(2, '18:00'), SAO_PAULO)).toBeNull();
    expect(getOpenUntil(hours, spAt(3, '12:00'), SAO_PAULO)).toBeNull();
    expect(getOpenUntil([], spAt(2, '12:00'), SAO_PAULO)).toBeNull();
  });

  it('follows ranges across midnight', () => {
    const bar = [range(FRIDAY, '18:00', '02:00')];
    expect(iso(getOpenUntil(bar, spAt(2, '23:00'), SAO_PAULO))).toBe(spAt(3, '02:00').toISOString());
    expect(iso(getOpenUntil(bar, spAt(3, '01:00'), SAO_PAULO))).toBe(spAt(3, '02:00').toISOString());
  });

  it('joins touching ranges into one end time', () => {
    const split = [range(FRIDAY, '18:00', '00:00'), range(SATURDAY, '00:00', '02:00')];
    expect(iso(getOpenUntil(split, spAt(2, '19:00'), SAO_PAULO))).toBe(spAt(3, '02:00').toISOString());
  });

  it('stops at the gap between two ranges of the same day', () => {
    const restaurant = [range(FRIDAY, '12:00', '15:00'), range(FRIDAY, '19:00', '23:00')];
    expect(iso(getOpenUntil(restaurant, spAt(2, '13:00'), SAO_PAULO))).toBe(spAt(2, '15:00').toISOString());
  });

  it('returns the real instant when the clock springs forward', () => {
    const overnight = [range(SUNDAY, '01:00', '05:00')];
    expect(iso(getOpenUntil(overnight, new Date('2026-03-08T06:30:00Z'), NEW_YORK))).toBe(
      '2026-03-08T09:00:00.000Z',
    );
  });
});
