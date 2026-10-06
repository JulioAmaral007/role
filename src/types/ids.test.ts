import { isTypeEqual } from '@/test/typeAssertions';
import { Constants } from '@/types/database';
import { PLANS, TRAVEL_MODES, type AvoidTag, type Budget, type Category, type FeedbackRating, type FeedbackTag, type Mood, type ReportReason, type TimeSlot } from '@/types/ids';

const enums = Constants.public.Enums;

describe('domain ids', () => {
  it('match the database enums', () => {
    expect(isTypeEqual<Mood, (typeof enums.mood)[number]>(true)).toBe(true);
    expect(isTypeEqual<TimeSlot, (typeof enums.time_slot)[number]>(true)).toBe(true);
    expect(isTypeEqual<Budget, (typeof enums.budget)[number]>(true)).toBe(true);
    expect(isTypeEqual<Category, (typeof enums.category)[number]>(true)).toBe(true);
    expect(isTypeEqual<FeedbackRating, (typeof enums.feedback_rating)[number]>(true)).toBe(true);
    expect(isTypeEqual<FeedbackTag, (typeof enums.feedback_tag)[number]>(true)).toBe(true);
    expect(isTypeEqual<AvoidTag, (typeof enums.avoid_tag)[number]>(true)).toBe(true);
    expect(isTypeEqual<ReportReason, (typeof enums.report_reason)[number]>(true)).toBe(true);
  });

  it('keeps the 16 bingo categories of the glossary', () => {
    expect([...enums.category].sort()).toEqual(
      [
        'viewpoint', 'used_bookstore', 'short_trail', 'hidden_cafe', 'street_market', 'small_museum',
        'street_cinema', 'garden', 'open_studio', 'free_show', 'new_square', 'bookstore',
        'neighborhood_bar', 'rooftop', 'library', 'lake',
      ].sort(),
    );
  });

  it('lists the travel modes and plans of the glossary', () => {
    expect([...TRAVEL_MODES]).toEqual(['walk', 'bus', 'car']);
    expect([...PLANS]).toEqual(['free', 'plus']);
  });
});
