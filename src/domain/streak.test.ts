import { zonedTimeToUtc } from '@/utils/zonedTime';

import { getStreak, getWeekHistory, HISTORY_WEEKS } from './streak';

const SAO_PAULO = 'America/Sao_Paulo';
const NEW_YORK = 'America/New_York';
const TOKYO = 'Asia/Tokyo';

/** Sexta-feira 02/10/2026, 12:00 em São Paulo (a semana de "agora" começa na segunda 28/09). */
const NOW = zonedTimeToUtc({ year: 2026, month: 10, day: 2, hour: 12 }, SAO_PAULO);

/** Um carimbo `weeksAgo` semanas antes da semana de "agora", na quarta-feira ao meio-dia (SP). */
const stampInWeek = (weeksAgo: number) => ({
  stampedAt: zonedTimeToUtc(
    { year: 2026, month: 9, day: 30 - weeksAgo * 7, hour: 12 },
    SAO_PAULO,
  ).toISOString(),
});

const stampAt = (day: number, hour: number, minute = 0, month = 10) => ({
  stampedAt: zonedTimeToUtc({ year: 2026, month, day, hour, minute }, SAO_PAULO).toISOString(),
});

const states = (stamps: { stampedAt: string }[]) =>
  getWeekHistory(stamps, NOW, SAO_PAULO).map(({ state }) => state);

describe('getWeekHistory', () => {
  it('shows the last 8 weeks, oldest first, ending in the current one', () => {
    const history = getWeekHistory([], NOW, SAO_PAULO);
    expect(HISTORY_WEEKS).toBe(8);
    expect(history).toHaveLength(8);
    expect(history[7].startsAt).toBe('2026-09-28T03:00:00.000Z');
    expect(history[6].startsAt).toBe('2026-09-21T03:00:00.000Z');
    expect(history[0].startsAt).toBe('2026-08-10T03:00:00.000Z');
  });

  it('marks empty past weeks as missed and an empty current week as current, not missed', () => {
    expect(states([])).toEqual([
      'missed', 'missed', 'missed', 'missed', 'missed', 'missed', 'missed', 'current',
    ]);
  });

  it('marks weeks with a stamp as done, and the current one too when it has a stamp', () => {
    expect(states([stampInWeek(0), stampInWeek(2), stampInWeek(3)])).toEqual([
      'missed', 'missed', 'missed', 'missed', 'done', 'done', 'missed', 'done',
    ]);
  });

  it('counts the stamps of each week', () => {
    const stamps = [stampInWeek(1), stampInWeek(1), stampInWeek(1), stampInWeek(0)];
    const history = getWeekHistory(stamps, NOW, SAO_PAULO);
    expect(history[6].stampCount).toBe(3);
    expect(history[7].stampCount).toBe(1);
    expect(history[5].stampCount).toBe(0);
  });

  it('puts Sunday night in the old week and Monday 00:00 in the new one', () => {
    const sundayNight = stampAt(4, 23, 59);
    const mondayStart = stampAt(5, 0);
    const mondayNow = zonedTimeToUtc({ year: 2026, month: 10, day: 5, hour: 9 }, SAO_PAULO);

    const history = getWeekHistory([sundayNight, mondayStart], mondayNow, SAO_PAULO);
    expect(history[6]).toMatchObject({ startsAt: '2026-09-28T03:00:00.000Z', state: 'done', stampCount: 1 });
    expect(history[7]).toMatchObject({ startsAt: '2026-10-05T03:00:00.000Z', state: 'done', stampCount: 1 });
  });

  it('ignores stamps from the future and invalid dates', () => {
    const future = stampAt(1, 0, 0, 12);
    const broken = { stampedAt: 'not a date' };
    expect(states([future, broken])).toEqual(states([]));
  });

  it('does not depend on the order of the stamps', () => {
    const stamps = [stampInWeek(3), stampInWeek(0), stampInWeek(1)];
    expect(states([...stamps].reverse())).toEqual(states(stamps));
  });

  it('accepts a different number of weeks', () => {
    expect(getWeekHistory([], NOW, SAO_PAULO, 3).map(({ state }) => state)).toEqual([
      'missed', 'missed', 'current',
    ]);
    expect(getWeekHistory([], NOW, SAO_PAULO, 0)).toEqual([]);
  });

  it('accepts the current time as a timestamp in milliseconds', () => {
    expect(getWeekHistory([stampInWeek(0)], NOW.getTime(), SAO_PAULO)[7].state).toBe('done');
  });
});

describe('getStreak', () => {
  it('is zero without stamps', () => {
    expect(getStreak([], NOW, SAO_PAULO)).toBe(0);
  });

  it('is one with a stamp this week', () => {
    expect(getStreak([stampInWeek(0)], NOW, SAO_PAULO)).toBe(1);
  });

  it('keeps the streak alive while the current week has no stamp yet', () => {
    expect(getStreak([stampInWeek(1)], NOW, SAO_PAULO)).toBe(1);
    expect(getStreak([1, 2, 3].map(stampInWeek), NOW, SAO_PAULO)).toBe(3);
  });

  it('breaks when a full week passed without a stamp', () => {
    expect(getStreak([2, 3].map(stampInWeek), NOW, SAO_PAULO)).toBe(0);
  });

  it('counts consecutive weeks including the current one', () => {
    expect(getStreak([0, 1, 2].map(stampInWeek), NOW, SAO_PAULO)).toBe(3);
  });

  it('stops at the first gap', () => {
    // semanas 0, 1, 2 e 4: a 3 falhou
    expect(getStreak([0, 1, 2, 4].map(stampInWeek), NOW, SAO_PAULO)).toBe(3);
  });

  it('counts more than one stamp in a week as one week', () => {
    expect(getStreak([0, 0, 0].map(stampInWeek), NOW, SAO_PAULO)).toBe(1);
  });

  it('is not limited to the 8 weeks of the history', () => {
    const twelve = Array.from({ length: 12 }, (_, weeksAgo) => stampInWeek(weeksAgo));
    expect(getStreak(twelve, NOW, SAO_PAULO)).toBe(12);
    expect(states(twelve).every((state) => state === 'done')).toBe(true);
  });

  it('ignores stamps from the future', () => {
    expect(getStreak([stampAt(1, 0, 0, 12)], NOW, SAO_PAULO)).toBe(0);
  });

  it('judges the week in the time zone of the person', () => {
    // domingo 04/10 22:00 em SP é segunda 05/10 10:00 em Tóquio; "agora" é segunda 05/10 14:00 em Tóquio
    const stamp = stampAt(4, 22);
    const now = new Date('2026-10-05T05:00:00Z'); // 02:00 de segunda em SP
    expect(getWeekHistory([stamp], now, SAO_PAULO)[7].state).toBe('current');
    expect(getStreak([stamp], now, SAO_PAULO)).toBe(1); // vem da semana passada, ainda viva
    expect(getWeekHistory([stamp], now, TOKYO)[7].state).toBe('done');
    expect(getStreak([stamp], now, TOKYO)).toBe(1);
  });

  it('keeps counting across a daylight saving time change (New York, 08/03/2026)', () => {
    // 03:59Z de 09/03 ainda é domingo 23:59 (semana de 02/03); 04:00Z já é segunda 00:00 EDT
    const lastWeek = { stampedAt: '2026-03-09T03:59:00Z' };
    const thisWeek = { stampedAt: '2026-03-09T04:00:00Z' };
    const now = new Date('2026-03-11T15:00:00Z');
    expect(getStreak([lastWeek, thisWeek], now, NEW_YORK)).toBe(2);
    expect(getStreak([lastWeek], now, NEW_YORK)).toBe(1);
    const history = getWeekHistory([lastWeek, thisWeek], now, NEW_YORK);
    expect(history.slice(-2).map(({ stampCount }) => stampCount)).toEqual([1, 1]);
  });
});
