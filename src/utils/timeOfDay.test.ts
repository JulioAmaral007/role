import { parseTimeOfDay } from './timeOfDay';

describe('parseTimeOfDay', () => {
  it('reads the Postgres time formats', () => {
    expect(parseTimeOfDay('18:00:00')).toBe(1080);
    expect(parseTimeOfDay('09:30')).toBe(570);
    expect(parseTimeOfDay('9:05')).toBe(545);
    expect(parseTimeOfDay('00:00:00')).toBe(0);
    expect(parseTimeOfDay('23:59:59')).toBe(1439);
    expect(parseTimeOfDay('18:00:00.250')).toBe(1080);
  });

  it('ignores the seconds', () => {
    expect(parseTimeOfDay('10:15:45')).toBe(615);
  });

  it('accepts the end of the day as 24:00', () => {
    expect(parseTimeOfDay('24:00:00')).toBe(1440);
    expect(parseTimeOfDay('24:00')).toBe(1440);
  });

  it('ignores surrounding spaces', () => {
    expect(parseTimeOfDay(' 08:00 ')).toBe(480);
  });

  it('returns null for invalid text', () => {
    expect(parseTimeOfDay('')).toBeNull();
    expect(parseTimeOfDay('noon')).toBeNull();
    expect(parseTimeOfDay('18')).toBeNull();
    expect(parseTimeOfDay('18:60')).toBeNull();
    expect(parseTimeOfDay('18:00:60')).toBeNull();
    expect(parseTimeOfDay('25:00')).toBeNull();
    expect(parseTimeOfDay('24:30')).toBeNull();
    expect(parseTimeOfDay('24:00:30')).toBeNull();
    expect(parseTimeOfDay('18:00:00 PM')).toBeNull();
    expect(parseTimeOfDay('-1:00')).toBeNull();
  });
});
