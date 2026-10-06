import { isTypeEqual, type CamelKeys } from '@/test/typeAssertions';
import type { Tables } from '@/types/database';
import type { Stamp, StampFeedback } from '@/types/stamp';

type StampRow = Tables<'stamps'>;
type FeedbackRow = Tables<'place_feedback'>;

describe('Stamp', () => {
  it('has every stamps column that the app uses, plus the feedback', () => {
    type RowKeys = Exclude<CamelKeys<StampRow>, 'userId' | 'createdAt'>;
    expect(isTypeEqual<Exclude<keyof Stamp, 'feedback'>, RowKeys>(true)).toBe(true);
  });

  it('keeps the optional columns typed as the database does', () => {
    expect(isTypeEqual<Stamp['mood'], StampRow['mood']>(true)).toBe(true);
    expect(isTypeEqual<Stamp['timeSlot'], StampRow['time_slot']>(true)).toBe(true);
    expect(isTypeEqual<Stamp['budget'], StampRow['budget']>(true)).toBe(true);
    expect(isTypeEqual<Stamp['memory'], StampRow['memory']>(true)).toBe(true);
  });

  it('has the rating and tags of place_feedback', () => {
    expect(isTypeEqual<StampFeedback['rating'], FeedbackRow['rating']>(true)).toBe(true);
    expect(isTypeEqual<StampFeedback['tags'], FeedbackRow['tags']>(true)).toBe(true);
  });
});
