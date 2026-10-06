import { makeStamp } from '@/test/factories';

import {
  toFeedbackInserts,
  toStamp,
  toStampInsert,
  type PlaceFeedbackRow,
  type StampWithFeedback,
} from './stampsMapper';

const NOW = '2026-10-02T12:00:00Z';

const feedbackRow: PlaceFeedbackRow = {
  id: 'feedback-1',
  user_id: 'user-1',
  stamp_id: 'stamp-1',
  rating: 'ok',
  tags: ['calm', 'too_far'],
  created_at: NOW,
};

const row: StampWithFeedback = {
  id: 'stamp-1',
  user_id: 'user-1',
  place_id: 'place-1',
  number: 7,
  stamped_at: '2026-10-02T15:30:00+00:00',
  mood: 'chill',
  time_slot: 'half_day',
  budget: 'free',
  memory: 'Valeu a pena',
  created_at: NOW,
  place_feedback: feedbackRow,
};

describe('toStamp', () => {
  it('converts the row and its feedback to the domain shape', () => {
    expect(toStamp(row)).toEqual({
      id: 'stamp-1',
      placeId: 'place-1',
      number: 7,
      stampedAt: '2026-10-02T15:30:00+00:00',
      mood: 'chill',
      timeSlot: 'half_day',
      budget: 'free',
      memory: 'Valeu a pena',
      feedback: { rating: 'ok', tags: ['calm', 'too_far'] },
    });
  });

  it('has no feedback when the person skipped the rating', () => {
    expect(toStamp({ ...row, place_feedback: null }).feedback).toBeNull();
  });

  it('keeps the optional columns as null', () => {
    const stamp = toStamp({ ...row, mood: null, time_slot: null, budget: null, memory: null });
    expect(stamp).toMatchObject({ mood: null, timeSlot: null, budget: null, memory: null });
  });
});

describe('toStampInsert', () => {
  it('maps the stamp to the table columns, leaving the owner to the database', () => {
    const stamp = makeStamp({ id: 's1', placeId: 'p1', number: 3, mood: 'lazy', memory: 'oi' });
    expect(toStampInsert(stamp)).toEqual({
      id: 's1',
      place_id: 'p1',
      number: 3,
      stamped_at: stamp.stampedAt,
      mood: 'lazy',
      time_slot: null,
      budget: null,
      memory: 'oi',
    });
    expect(toStampInsert(stamp)).not.toHaveProperty('user_id');
  });
});

describe('toFeedbackInserts', () => {
  it('has one row for each stamp that has feedback, and none for the others', () => {
    const rated = makeStamp({ id: 'a', feedback: { rating: 'miss', tags: ['too_crowded'] } });
    const skipped = makeStamp({ id: 'b', feedback: null });
    expect(toFeedbackInserts([rated, skipped])).toEqual([
      { stamp_id: 'a', rating: 'miss', tags: ['too_crowded'] },
    ]);
    expect(toFeedbackInserts([skipped])).toEqual([]);
    expect(toFeedbackInserts([])).toEqual([]);
  });
});
