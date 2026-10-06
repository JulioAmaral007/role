import { zonedTimeToUtc } from '@/utils/zonedTime';

import { getMonthlyGoal, MONTHLY_GOAL_TARGET } from './monthlyGoal';

const SAO_PAULO = 'America/Sao_Paulo';

/** "Agora": quinta-feira 15/10/2026, 12:00 em São Paulo. */
const NOW = zonedTimeToUtc({ year: 2026, month: 10, day: 15, hour: 12 }, SAO_PAULO);

const stamp = (placeId: string, year: number, month: number, day: number, hour = 12) => ({
  placeId,
  stampedAt: zonedTimeToUtc({ year, month, day, hour }, SAO_PAULO).toISOString(),
});

describe('getMonthlyGoal', () => {
  it('asks for 3 new places in the month', () => {
    expect(MONTHLY_GOAL_TARGET).toBe(3);
  });

  it('starts at zero and names the month of "now"', () => {
    expect(getMonthlyGoal([], NOW, SAO_PAULO)).toEqual({
      year: 2026,
      month: 10,
      target: 3,
      count: 0,
      reached: false,
    });
  });

  it('counts the places stamped for the first time this month', () => {
    const stamps = [stamp('a', 2026, 10, 2), stamp('b', 2026, 10, 9)];
    expect(getMonthlyGoal(stamps, NOW, SAO_PAULO)).toMatchObject({ count: 2, reached: false });
  });

  it('is reached at 3 and can go beyond', () => {
    const three = ['a', 'b', 'c'].map((id) => stamp(id, 2026, 10, 3));
    expect(getMonthlyGoal(three, NOW, SAO_PAULO)).toMatchObject({ count: 3, reached: true });
    const five = ['a', 'b', 'c', 'd', 'e'].map((id) => stamp(id, 2026, 10, 3));
    expect(getMonthlyGoal(five, NOW, SAO_PAULO)).toMatchObject({ count: 5, reached: true });
  });

  it('counts a new place once, however many stamps it has in the month', () => {
    const stamps = [stamp('a', 2026, 10, 2), stamp('a', 2026, 10, 9), stamp('a', 2026, 10, 12)];
    expect(getMonthlyGoal(stamps, NOW, SAO_PAULO).count).toBe(1);
  });

  it('does not count a place the person had already been to in an earlier month', () => {
    const stamps = [stamp('a', 2026, 9, 20), stamp('a', 2026, 10, 5), stamp('b', 2026, 10, 6)];
    expect(getMonthlyGoal(stamps, NOW, SAO_PAULO).count).toBe(1);
  });

  it('does not count places first stamped in earlier or later months', () => {
    const stamps = [stamp('a', 2026, 9, 30), stamp('b', 2025, 10, 15), stamp('c', 2026, 11, 2)];
    expect(getMonthlyGoal(stamps, NOW, SAO_PAULO).count).toBe(0);
  });

  it('finds the first stamp by date, not by the order of the list', () => {
    const stamps = [stamp('a', 2026, 10, 5), stamp('a', 2026, 9, 5)];
    expect(getMonthlyGoal(stamps, NOW, SAO_PAULO).count).toBe(0);
    expect(getMonthlyGoal([...stamps].reverse(), NOW, SAO_PAULO).count).toBe(0);
  });

  it('judges the month in the time zone of the person', () => {
    // 31/10 22:00 em SP já é 01/11 01:00Z; 01/11 00:00 em SP é 03:00Z
    const lateOnThirtyFirst = { placeId: 'a', stampedAt: '2026-11-01T01:00:00Z' };
    const firstMidnight = { placeId: 'b', stampedAt: '2026-11-01T03:00:00Z' };
    const endOfOctober = zonedTimeToUtc({ year: 2026, month: 10, day: 31, hour: 23 }, SAO_PAULO);
    const startOfNovember = zonedTimeToUtc({ year: 2026, month: 11, day: 1, hour: 9 }, SAO_PAULO);

    expect(getMonthlyGoal([lateOnThirtyFirst, firstMidnight], endOfOctober, SAO_PAULO)).toMatchObject({
      month: 10,
      count: 1,
    });
    expect(getMonthlyGoal([lateOnThirtyFirst, firstMidnight], startOfNovember, SAO_PAULO)).toMatchObject({
      month: 11,
      count: 1,
    });
    // a mesma lista, em Tóquio (UTC+9): as duas já são 1º de novembro
    expect(getMonthlyGoal([lateOnThirtyFirst, firstMidnight], startOfNovember, 'Asia/Tokyo').count).toBe(2);
  });

  it('works across the year boundary', () => {
    const january = zonedTimeToUtc({ year: 2027, month: 1, day: 10, hour: 12 }, SAO_PAULO);
    const stamps = [stamp('a', 2026, 12, 28), stamp('b', 2027, 1, 3)];
    expect(getMonthlyGoal(stamps, january, SAO_PAULO)).toMatchObject({ year: 2027, month: 1, count: 1 });
  });

  it('ignores invalid dates', () => {
    expect(getMonthlyGoal([{ placeId: 'a', stampedAt: 'not a date' }], NOW, SAO_PAULO).count).toBe(0);
  });

  it('accepts the current time as a timestamp in milliseconds', () => {
    expect(getMonthlyGoal([stamp('a', 2026, 10, 2)], NOW.getTime(), SAO_PAULO).count).toBe(1);
  });
});
