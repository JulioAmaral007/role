import { makeCandidate, TEST_CITY } from '@/test/factories';
import type { Place } from '@/types/place';
import { zonedTimeToUtc } from '@/utils/zonedTime';

import {
  applyRelaxation,
  findRelaxations,
  MAX_PROFILE_DISTANCE_KM,
  TOMORROW_START_MINUTE,
} from './relaxations';
import { recommend, type Candidate, type RecommendationRequest } from './recommend';

/** Sexta-feira 02/10/2026 (`day` = 2) em São Paulo, no horário `HH:mm`. */
const at = (time: string, day = 2) => {
  const [hour, minute] = time.split(':').map(Number);
  return zonedTimeToUtc({ year: 2026, month: 10, day, hour, minute }, TEST_CITY.timeZone);
};

function makeRequest(
  candidates: Candidate[],
  overrides: Partial<RecommendationRequest> = {},
): RecommendationRequest {
  return {
    candidates,
    city: TEST_CITY,
    mood: 'curious',
    timeSlot: '2h',
    budget: 'any',
    now: at('10:00'),
    maxDistanceKm: 5,
    avoidTags: [],
    accessibleOnly: false,
    stampedPlaceIds: new Set(),
    shownPlaceIds: new Set(),
    random: () => 0,
    ...overrides,
  };
}

const candidateOf = (overrides: Partial<Place> = {}, distanceKm = 1, travelMinutes = 0) =>
  makeCandidate(overrides, distanceKm, travelMinutes);

describe('findRelaxations', () => {
  it('has nothing to offer when the request already has a result', () => {
    expect(findRelaxations(makeRequest([candidateOf()]))).toEqual([]);
  });

  it('has nothing to offer when no single change opens a place', () => {
    // humor que ninguém atende: nem mais dinheiro, nem mais distância, nem amanhã resolvem
    expect(findRelaxations(makeRequest([candidateOf({ moods: ['chill'] })]))).toEqual([]);
    expect(findRelaxations(makeRequest([]))).toEqual([]);
  });

  describe('budget', () => {
    it('offers the next budget level when it opens places', () => {
      const pricey = candidateOf({ typicalSpend: 50, category: 'hidden_cafe' });
      const result = findRelaxations(makeRequest([pricey], { budget: 'up_to_30' }));
      expect(result).toEqual([{ kind: 'budget', budget: 'up_to_80', opens: 1, categories: ['hidden_cafe'] }]);
    });

    it('goes up one level only, never straight to "any"', () => {
      const veryPricey = candidateOf({ typicalSpend: 100 });
      expect(findRelaxations(makeRequest([veryPricey], { budget: 'free' }))).toEqual([]);
    });

    it('offers nothing when the budget is already "any"', () => {
      expect(findRelaxations(makeRequest([candidateOf({ moods: ['chill'] })], { budget: 'any' }))).toEqual([]);
    });

    it('goes from free to up to 30', () => {
      const cheap = candidateOf({ typicalSpend: 20 });
      expect(findRelaxations(makeRequest([cheap], { budget: 'free' }))).toMatchObject([
        { kind: 'budget', budget: 'up_to_30' },
      ]);
    });
  });

  describe('distance', () => {
    it('doubles the maximum distance when that opens places', () => {
      const far = candidateOf({ category: 'lake' }, 8);
      expect(findRelaxations(makeRequest([far]))).toEqual([
        { kind: 'distance', maxDistanceKm: 10, opens: 1, categories: ['lake'] },
      ]);
    });

    it('stops at the maximum the profile allows', () => {
      const far = candidateOf({}, 18);
      expect(findRelaxations(makeRequest([far], { maxDistanceKm: 15 }))).toMatchObject([
        { kind: 'distance', maxDistanceKm: MAX_PROFILE_DISTANCE_KM },
      ]);
    });

    it('offers nothing when the maximum is already reached', () => {
      const far = candidateOf({}, 25);
      expect(findRelaxations(makeRequest([far], { maxDistanceKm: MAX_PROFILE_DISTANCE_KM }))).toEqual([]);
    });

    it('does not open places whose trip is too long for the chosen time', () => {
      // 20 km, mas a ida de 60 min não cabe em 2 h junto com a visita
      const unreachable = candidateOf({ durationMin: 60 }, 8, 60);
      expect(findRelaxations(makeRequest([unreachable]))).toEqual([]);
    });
  });

  describe('tomorrow', () => {
    it('offers tomorrow morning when today everything is closed', () => {
      const request = makeRequest([candidateOf({ category: 'bookstore' })], { now: at('22:00') });
      expect(findRelaxations(request)).toEqual([
        { kind: 'tomorrow', now: at('09:00', 3), opens: 1, categories: ['bookstore'] },
      ]);
    });

    it('opens daylight-only places that the night had hidden', () => {
      const trail = candidateOf({ daylightOnly: true, category: 'short_trail' });
      const request = makeRequest([trail], { now: at('19:00') });
      expect(findRelaxations(request)).toMatchObject([{ kind: 'tomorrow', categories: ['short_trail'] }]);
    });

    it('starts the next day at the configured morning hour, in the city time zone', () => {
      expect(TOMORROW_START_MINUTE).toBe(9 * 60);
      const result = findRelaxations(makeRequest([candidateOf()], { now: at('23:30') }));
      expect(result).toMatchObject([{ kind: 'tomorrow', now: at('09:00', 3) }]);
    });

    it('crosses the month boundary', () => {
      const lateOnThirtyFirst = zonedTimeToUtc(
        { year: 2026, month: 10, day: 31, hour: 22 },
        TEST_CITY.timeZone,
      );
      const result = findRelaxations(makeRequest([candidateOf()], { now: lateOnThirtyFirst }));
      expect(result).toMatchObject([
        {
          kind: 'tomorrow',
          now: zonedTimeToUtc({ year: 2026, month: 11, day: 1, hour: 9 }, TEST_CITY.timeZone),
        },
      ]);
    });
  });

  describe('summary and order', () => {
    it('lists the categories of what opens, most numerous first', () => {
      const places = [
        candidateOf({ category: 'bookstore' }, 8),
        candidateOf({ category: 'hidden_cafe' }, 8),
        candidateOf({ category: 'hidden_cafe' }, 8),
        candidateOf({ category: 'garden' }, 8),
      ];
      const [relaxation] = findRelaxations(makeRequest(places));
      expect(relaxation).toMatchObject({ kind: 'distance', opens: 4 });
      // hidden_cafe tem 2; as que têm 1 ficam em ordem alfabética
      expect(relaxation.categories).toEqual(['hidden_cafe', 'bookstore', 'garden']);
    });

    it('puts the change that opens more places first', () => {
      const pricey = candidateOf({ typicalSpend: 50 }, 1);
      const distant = [candidateOf({}, 8), candidateOf({}, 8)];
      const request = makeRequest([pricey, ...distant], { budget: 'up_to_30' });
      expect(findRelaxations(request).map(({ kind, opens }) => [kind, opens])).toEqual([
        ['distance', 2],
        ['budget', 1],
      ]);
    });

    it('keeps budget, distance, tomorrow when they open the same number of places', () => {
      // A é caro demais e B é longe demais; amanhã não muda nenhum dos dois
      const pricey = candidateOf({ typicalSpend: 50 }, 1);
      const distant = candidateOf({ typicalSpend: 0 }, 8);
      const request = makeRequest([pricey, distant], { budget: 'up_to_30' });
      expect(findRelaxations(request).map(({ kind }) => kind)).toEqual(['budget', 'distance']);
    });

    it('can offer all three at once, in that order', () => {
      const closedNow = candidateOf({ hours: [{ weekday: 6, opensMinute: 8 * 60, closesMinute: 20 * 60 }] });
      const pricey = candidateOf({ typicalSpend: 50 });
      const distant = candidateOf({}, 8);
      const request = makeRequest([closedNow, pricey, distant], { budget: 'up_to_30' });
      expect(findRelaxations(request).map(({ kind }) => kind)).toEqual(['budget', 'distance', 'tomorrow']);
    });

    it('does not count places already shown in this session', () => {
      const shown = candidateOf({}, 8);
      const fresh = candidateOf({}, 9);
      const request = makeRequest([shown, fresh], { shownPlaceIds: new Set([shown.place.id]) });
      expect(findRelaxations(request)).toMatchObject([{ kind: 'distance', opens: 1 }]);

      const onlyShown = makeRequest([shown], { shownPlaceIds: new Set([shown.place.id]) });
      expect(findRelaxations(onlyShown)).toEqual([]);
    });

    it('offers a way out when everything that fits was already shown', () => {
      const shown = candidateOf({}, 1);
      const farther = candidateOf({}, 8);
      const request = makeRequest([shown, farther], { shownPlaceIds: new Set([shown.place.id]) });
      expect(recommend(request)).toMatchObject({ kind: 'noMatch', reason: 'exhausted' });
      expect(findRelaxations(request)).toMatchObject([{ kind: 'distance' }]);
    });
  });
});

describe('applyRelaxation', () => {
  it('changes only the filter of the relaxation and leaves the original alone', () => {
    const request = makeRequest([candidateOf({ typicalSpend: 50 })], { budget: 'up_to_30' });
    const [relaxation] = findRelaxations(request);

    const relaxed = applyRelaxation(request, relaxation);

    expect(relaxed).toEqual({ ...request, budget: 'up_to_80' });
    expect(request.budget).toBe('up_to_30');
  });

  it('makes the new request match, whichever the change', () => {
    const closedNow = candidateOf({ hours: [{ weekday: 6, opensMinute: 8 * 60, closesMinute: 20 * 60 }] });
    const pricey = candidateOf({ typicalSpend: 50 });
    const distant = candidateOf({}, 8);
    const request = makeRequest([closedNow, pricey, distant], { budget: 'up_to_30' });
    expect(recommend(request).kind).toBe('noMatch');

    const relaxations = findRelaxations(request);
    expect(relaxations).toHaveLength(3);
    for (const relaxation of relaxations) {
      expect(recommend(applyRelaxation(request, relaxation)).kind).toBe('match');
    }
  });

  it('applies the distance and the day changes to the right fields', () => {
    const request = makeRequest([candidateOf({}, 8)]);
    const [distance] = findRelaxations(request);
    expect(applyRelaxation(request, distance)).toMatchObject({ maxDistanceKm: 10, now: request.now });

    const night = makeRequest([candidateOf()], { now: at('22:00') });
    const [tomorrow] = findRelaxations(night);
    expect(applyRelaxation(night, tomorrow)).toMatchObject({ now: at('09:00', 3), maxDistanceKm: 5 });
  });
});
