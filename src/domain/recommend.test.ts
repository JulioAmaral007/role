import { makeCandidate, TEST_CITY } from '@/test/factories';
import type { Place } from '@/types/place';
import { zonedTimeToUtc } from '@/utils/zonedTime';

import {
  BUDGET_MAX_SPEND,
  DEFAULT_MAX_DISTANCE_KM,
  DRAW_POOL_SIZE,
  findEligibleCandidates,
  recommend,
  TIME_SLOT_MINUTES,
  type Candidate,
  type RecommendationRequest,
} from './recommend';

/** Sexta-feira 02/10/2026 em São Paulo, no horário `HH:mm`. */
const at = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return zonedTimeToUtc({ year: 2026, month: 10, day: 2, hour, minute }, TEST_CITY.timeZone);
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
    maxDistanceKm: DEFAULT_MAX_DISTANCE_KM,
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

const eligibleIds = (request: RecommendationRequest) =>
  findEligibleCandidates(request).eligible.map(({ place }) => place.id);

describe('constants', () => {
  it('maps every time slot to minutes and every budget to a spending limit', () => {
    expect(TIME_SLOT_MINUTES).toEqual({ '1h': 60, '2h': 120, half_day: 240, full_day: 480 });
    expect(BUDGET_MAX_SPEND.free).toBe(0);
    expect(BUDGET_MAX_SPEND.up_to_30).toBe(30);
    expect(BUDGET_MAX_SPEND.up_to_80).toBe(80);
    expect(BUDGET_MAX_SPEND.any).toBe(Number.POSITIVE_INFINITY);
    expect(DEFAULT_MAX_DISTANCE_KM).toBe(5);
  });
});

describe('recommend', () => {
  it('suggests an eligible place and says how long it stays open', () => {
    const candidate = candidateOf();
    const result = recommend(makeRequest([candidate]));
    expect(result).toEqual({
      kind: 'match',
      candidate,
      openUntil: at('20:00'),
      neverStamped: true,
    });
  });

  it('counts the trip: a place that opens before the person arrives is suggested', () => {
    const hours = [{ weekday: 5, opensMinute: 10 * 60 + 20, closesMinute: 12 * 60 }];
    const candidate = candidateOf({ durationMin: 30, hours }, 1, 30);
    // sai às 10:00, chega às 10:30 (o lugar abriu às 10:20) e ele segue aberto até 12:00
    expect(recommend(makeRequest([candidate]))).toMatchObject({ kind: 'match', openUntil: at('12:00') });
  });

  describe('filters', () => {
    it('keeps only places that match the mood', () => {
      const calm = candidateOf({ moods: ['chill', 'lazy'] });
      const curious = candidateOf({ moods: ['curious', 'social'] });
      expect(eligibleIds(makeRequest([calm, curious]))).toEqual([curious.place.id]);
      expect(eligibleIds(makeRequest([calm, curious], { mood: 'lazy' }))).toEqual([calm.place.id]);
    });

    it('drops inactive places', () => {
      expect(eligibleIds(makeRequest([candidateOf({ active: false })]))).toEqual([]);
    });

    it('applies the spending limit of the budget', () => {
      const free = candidateOf({ typicalSpend: 0 });
      const thirty = candidateOf({ typicalSpend: 30 });
      const thirtyOne = candidateOf({ typicalSpend: 30.01 });
      const eighty = candidateOf({ typicalSpend: 80 });
      const pricey = candidateOf({ typicalSpend: 300 });
      const all = [free, thirty, thirtyOne, eighty, pricey];
      const ids = (budget: RecommendationRequest['budget']) => eligibleIds(makeRequest(all, { budget }));

      expect(ids('free')).toEqual([free.place.id]);
      expect(ids('up_to_30')).toEqual([free.place.id, thirty.place.id]);
      expect(ids('up_to_80')).toEqual([free.place.id, thirty.place.id, thirtyOne.place.id, eighty.place.id]);
      expect(ids('any')).toHaveLength(5);
    });

    it('applies the maximum distance of the profile, inclusive', () => {
      const near = candidateOf({}, 5);
      const far = candidateOf({}, 5.1);
      expect(eligibleIds(makeRequest([near, far]))).toEqual([near.place.id]);
      expect(eligibleIds(makeRequest([near, far], { maxDistanceKm: 10 }))).toEqual([near.place.id, far.place.id]);
    });

    it('requires the visit plus the round trip to fit in the chosen time', () => {
      const fits = candidateOf({ durationMin: 40 }, 1, 10); // 40 + 20 = 60
      const tooLong = candidateOf({ durationMin: 45 }, 1, 10); // 45 + 20 = 65
      const tooFarAway = candidateOf({ durationMin: 20 }, 1, 25); // 20 + 50 = 70
      const request = makeRequest([fits, tooLong, tooFarAway], { timeSlot: '1h' });
      expect(eligibleIds(request)).toEqual([fits.place.id]);
      expect(eligibleIds({ ...request, timeSlot: '2h' })).toHaveLength(3);
    });

    it('drops the tags the person does not want to see', () => {
      const bar = candidateOf({ avoidTags: ['bar'] });
      const barAndCrowd = candidateOf({ avoidTags: ['crowded', 'bar'] });
      const mall = candidateOf({ avoidTags: ['mall'] });
      const plain = candidateOf();
      const request = makeRequest([bar, barAndCrowd, mall, plain], { avoidTags: ['bar', 'crowded'] });
      expect(eligibleIds(request)).toEqual([mall.place.id, plain.place.id]);
    });

    it('keeps only accessible places when asked', () => {
      const accessible = candidateOf({ accessible: true });
      const steps = candidateOf({ accessible: false });
      expect(eligibleIds(makeRequest([accessible, steps]))).toHaveLength(2);
      expect(eligibleIds(makeRequest([accessible, steps], { accessibleOnly: true }))).toEqual([accessible.place.id]);
    });

    it('drops places that are closed when the person arrives', () => {
      const opensLate = candidateOf({ hours: [{ weekday: 5, opensMinute: 10 * 60 + 30, closesMinute: 20 * 60 }] }, 1, 10);
      const opensInTime = candidateOf({ hours: [{ weekday: 5, opensMinute: 10 * 60 + 30, closesMinute: 20 * 60 }] }, 1, 30);
      expect(eligibleIds(makeRequest([opensLate, opensInTime]))).toEqual([opensInTime.place.id]);
    });

    it('drops places that close before the visit ends', () => {
      const closesSoon = candidateOf({ durationMin: 90, hours: [{ weekday: 5, opensMinute: 8 * 60, closesMinute: 11 * 60 }] });
      expect(eligibleIds(makeRequest([closesSoon]))).toEqual([]);
    });

    it('drops daylight-only places that would run past the cutoff', () => {
      const trail = candidateOf({ daylightOnly: true, durationMin: 60 });
      expect(eligibleIds(makeRequest([trail], { now: at('17:00') }))).toEqual([trail.place.id]); // termina às 18:00
      expect(eligibleIds(makeRequest([trail], { now: at('17:01') }))).toEqual([]);
      // a ida também conta: sai às 17:10, chega às 17:40 e a visita de 30 min vai até 18:10
      const farTrail = candidateOf({ daylightOnly: true, durationMin: 30 }, 1, 30);
      const nearTrail = { ...farTrail, travelMinutes: 0 };
      expect(eligibleIds(makeRequest([nearTrail], { now: at('17:10') }))).toEqual([nearTrail.place.id]);
      expect(eligibleIds(makeRequest([farTrail], { now: at('17:10') }))).toEqual([]);
    });
  });

  describe('why nothing matched', () => {
    it('says "other" for an empty catalog and for no mood match', () => {
      expect(recommend(makeRequest([]))).toEqual({ kind: 'noMatch', reason: 'other' });
      expect(recommend(makeRequest([candidateOf({ moods: ['chill'] })]))).toEqual({ kind: 'noMatch', reason: 'other' });
    });

    it('says "expensive" when only the budget rules everything out', () => {
      const request = makeRequest([candidateOf({ typicalSpend: 50 })], { budget: 'up_to_30' });
      expect(recommend(request)).toEqual({ kind: 'noMatch', reason: 'expensive' });
    });

    it('says "far" for distance and for the time that does not fit', () => {
      expect(recommend(makeRequest([candidateOf({}, 9)]))).toEqual({ kind: 'noMatch', reason: 'far' });
      expect(recommend(makeRequest([candidateOf({ durationMin: 90 })], { timeSlot: '1h' }))).toEqual({
        kind: 'noMatch',
        reason: 'far',
      });
    });

    it('says "outdoor" when daylight-only places are what ran out', () => {
      const request = makeRequest([candidateOf({ daylightOnly: true })], { now: at('19:00') });
      expect(recommend(request)).toEqual({ kind: 'noMatch', reason: 'outdoor' });
    });

    it('says "closed" when everything left is closed', () => {
      const request = makeRequest([candidateOf()], { now: at('22:00') });
      expect(recommend(request)).toEqual({ kind: 'noMatch', reason: 'closed' });
    });

    it('blames the first filter that empties the list', () => {
      // um caro demais e um longe demais: o orçamento tira o primeiro, a distância zera a lista
      const pricey = candidateOf({ typicalSpend: 100 }, 1);
      const distant = candidateOf({ typicalSpend: 0 }, 20);
      const request = makeRequest([pricey, distant], { budget: 'up_to_30' });
      expect(recommend(request)).toEqual({ kind: 'noMatch', reason: 'far' });
    });

    it('explains the reason through findEligibleCandidates too, and has none when something matches', () => {
      expect(findEligibleCandidates(makeRequest([candidateOf({}, 9)]))).toEqual({ eligible: [], noMatchReason: 'far' });
      expect(findEligibleCandidates(makeRequest([candidateOf()])).noMatchReason).toBeUndefined();
    });
  });

  describe('choosing among the eligible places', () => {
    it('prefers places the person never stamped', () => {
      const visited = candidateOf({}, 0.5);
      const fresh = candidateOf({}, 3);
      const request = makeRequest([visited, fresh], { stampedPlaceIds: new Set([visited.place.id]) });
      expect(recommend(request)).toMatchObject({ kind: 'match', candidate: fresh, neverStamped: true });
    });

    it('falls back to stamped places when every eligible place was stamped', () => {
      const a = candidateOf({}, 1);
      const b = candidateOf({}, 2);
      const request = makeRequest([a, b], { stampedPlaceIds: new Set([a.place.id, b.place.id]) });
      expect(recommend(request)).toMatchObject({ kind: 'match', candidate: a, neverStamped: false });
    });

    it('does not repeat places already shown in this session', () => {
      const a = candidateOf({}, 1);
      const b = candidateOf({}, 2);
      const request = makeRequest([a, b], { shownPlaceIds: new Set([a.place.id]) });
      expect(recommend(request)).toMatchObject({ kind: 'match', candidate: b });
    });

    it('reports "exhausted" when everything that fits was already shown', () => {
      const a = candidateOf({}, 1);
      const request = makeRequest([a], { shownPlaceIds: new Set([a.place.id]) });
      expect(recommend(request)).toEqual({ kind: 'noMatch', reason: 'exhausted' });
    });

    it('draws only among the nearest places of the best group', () => {
      const places = [4, 1, 5, 2, 3].map((km) => candidateOf({}, km));
      const draw = (random: number) => {
        const result = recommend(makeRequest(places, { random: () => random }));
        return result.kind === 'match' ? result.candidate.distanceKm : undefined;
      };

      expect(DRAW_POOL_SIZE).toBe(3);
      expect(draw(0)).toBe(1);
      expect(draw(0.4)).toBe(2);
      expect(draw(0.99)).toBe(3);
      expect(draw(1)).toBe(3); // sorteio no limite não passa do fim da lista
    });

    it('draws among fewer places when fewer are left', () => {
      const a = candidateOf({}, 1);
      const b = candidateOf({}, 2);
      expect(recommend(makeRequest([a, b], { random: () => 0.99 }))).toMatchObject({ candidate: b });
    });

    it('breaks distance ties by id, so the order never depends on the input order', () => {
      const first = candidateOf({ id: 'a-place' }, 2);
      const second = candidateOf({ id: 'b-place' }, 2);
      expect(recommend(makeRequest([second, first]))).toMatchObject({ candidate: first });
    });

    it('uses Math.random when no random function is given', () => {
      const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
      try {
        const a = candidateOf({}, 1);
        const b = candidateOf({}, 2);
        const request = { ...makeRequest([a, b]), random: undefined };
        expect(recommend(request)).toMatchObject({ candidate: b });
        expect(spy).toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    });
  });

  it('does not change the candidate list it receives', () => {
    const candidates = [candidateOf({}, 3), candidateOf({}, 1), candidateOf({}, 2)];
    const snapshot = candidates.map(({ place }) => place.id);
    recommend(makeRequest(candidates));
    expect(candidates.map(({ place }) => place.id)).toEqual(snapshot);
  });

  it('accepts the current time as a timestamp in milliseconds', () => {
    expect(recommend(makeRequest([candidateOf()], { now: at('10:00').getTime() })).kind).toBe('match');
  });
});
