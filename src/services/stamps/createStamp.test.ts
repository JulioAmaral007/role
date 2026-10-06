import { createStamp, getNextStampNumber, MEMORY_MAX_LENGTH, type CreateStampInput } from './createStamp';

const input: CreateStampInput = {
  placeId: 'place-1',
  mood: 'curious',
  timeSlot: '2h',
  budget: 'up_to_30',
  memory: 'Pôr do sol lindo',
  feedback: { rating: 'spot_on', tags: ['calm', 'good_food'] },
  confirmedCount: 13,
  pendingCount: 0,
};

const fixedNow = () => new Date('2026-10-02T15:30:00.000Z');

describe('getNextStampNumber', () => {
  it('is the confirmed total plus the pending ones plus one', () => {
    expect(getNextStampNumber(0, 0)).toBe(1);
    expect(getNextStampNumber(13, 0)).toBe(14);
    expect(getNextStampNumber(13, 2)).toBe(16);
  });

  it('ignores negative counts', () => {
    expect(getNextStampNumber(-5, -1)).toBe(1);
  });
});

describe('createStamp', () => {
  it('builds the stamp with a new id, the next number and the time of now', () => {
    expect(createStamp(input, { generateId: () => 'uuid-1', now: fixedNow })).toEqual({
      id: 'uuid-1',
      placeId: 'place-1',
      number: 14,
      stampedAt: '2026-10-02T15:30:00.000Z',
      mood: 'curious',
      timeSlot: '2h',
      budget: 'up_to_30',
      memory: 'Pôr do sol lindo',
      feedback: { rating: 'spot_on', tags: ['calm', 'good_food'] },
    });
  });

  it('counts the pending stamps in the number ("Nº 16" with 13 confirmed and 2 waiting)', () => {
    expect(createStamp({ ...input, pendingCount: 2 }, { now: fixedNow }).number).toBe(16);
  });

  it('keeps the optional parts empty when the person skipped them', () => {
    const stamp = createStamp(
      { ...input, mood: null, timeSlot: null, budget: null, memory: null, feedback: null },
      { now: fixedNow },
    );
    expect(stamp).toMatchObject({ mood: null, timeSlot: null, budget: null, memory: null, feedback: null });
  });

  it('turns a blank memory into null and trims the rest', () => {
    expect(createStamp({ ...input, memory: '   ' }, { now: fixedNow }).memory).toBeNull();
    expect(createStamp({ ...input, memory: '' }, { now: fixedNow }).memory).toBeNull();
    expect(createStamp({ ...input, memory: '  oi  ' }, { now: fixedNow }).memory).toBe('oi');
  });

  it('cuts a memory that is longer than the database accepts, instead of losing the whole stamp', () => {
    expect(MEMORY_MAX_LENGTH).toBe(500);
    const long = 'a'.repeat(MEMORY_MAX_LENGTH + 50);
    expect(createStamp({ ...input, memory: long }, { now: fixedNow }).memory).toHaveLength(MEMORY_MAX_LENGTH);
  });

  it('generates a different uuid for each stamp by default', () => {
    const first = createStamp(input);
    const second = createStamp(input);
    expect(first.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(second.id).not.toBe(first.id);
  });

  it('uses the device clock by default', () => {
    const before = Date.now();
    const stamp = createStamp(input);
    const stampedAt = Date.parse(stamp.stampedAt);
    expect(stampedAt).toBeGreaterThanOrEqual(before);
    expect(stampedAt).toBeLessThanOrEqual(Date.now());
  });
});
