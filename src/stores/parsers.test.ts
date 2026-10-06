import {
  isRecord,
  parseAvoidTags,
  parsePlaceSummary,
  parseQueuedStamps,
  parseSavedSuggestion,
  parseStartPoint,
  parseTrip,
} from './parsers';

const place = { id: 'place-1', name: 'Mirante', address: 'Rua A, 1', latitude: -23.5, longitude: -46.6 };
const trip = {
  place,
  travelMode: 'walk',
  departedAt: '2026-10-02T15:00:00.000Z',
  initialDistanceMeters: 1800,
};
const stamp = {
  id: 'stamp-1',
  placeId: 'place-1',
  number: 3,
  stampedAt: '2026-10-02T15:30:00.000Z',
  mood: 'curious',
  timeSlot: '2h',
  budget: 'free',
  memory: 'oi',
  feedback: { rating: 'spot_on', tags: ['calm'] },
};

describe('isRecord', () => {
  it('accepts plain objects only', () => {
    expect(isRecord({})).toBe(true);
    for (const value of [null, undefined, [], 'text', 1, true]) expect(isRecord(value)).toBe(false);
  });
});

describe('parseStartPoint', () => {
  it('accepts a labelled point', () => {
    expect(parseStartPoint({ label: 'Centro', latitude: -23.5, longitude: -46.6 })).toEqual({
      label: 'Centro',
      latitude: -23.5,
      longitude: -46.6,
    });
  });

  it('refuses a missing label or coordinates out of range', () => {
    expect(parseStartPoint({ label: '  ', latitude: 0, longitude: 0 })).toBeUndefined();
    expect(parseStartPoint({ label: 'x', latitude: 91, longitude: 0 })).toBeUndefined();
    expect(parseStartPoint({ label: 'x', latitude: 0, longitude: -181 })).toBeUndefined();
    expect(parseStartPoint({ label: 'x', latitude: '1', longitude: 0 })).toBeUndefined();
    expect(parseStartPoint({ label: 'x', latitude: Number.NaN, longitude: 0 })).toBeUndefined();
    expect(parseStartPoint(null)).toBeUndefined();
    expect(parseStartPoint('Centro')).toBeUndefined();
  });
});

describe('parseAvoidTags', () => {
  it('keeps the known tags without repeating them', () => {
    expect(parseAvoidTags(['bar', 'mall', 'bar', 'klingon', 3, null])).toEqual(['bar', 'mall']);
  });

  it('is empty for anything that is not a list', () => {
    for (const value of [undefined, null, 'bar', {}, 1]) expect(parseAvoidTags(value)).toEqual([]);
  });
});

describe('parsePlaceSummary', () => {
  it('accepts a summary, with an empty address too', () => {
    expect(parsePlaceSummary(place)).toEqual(place);
    expect(parsePlaceSummary({ ...place, address: '' })).toEqual({ ...place, address: '' });
  });

  it('drops extra fields and refuses a broken one', () => {
    expect(parsePlaceSummary({ ...place, extra: 1 })).toEqual(place);
    expect(parsePlaceSummary({ ...place, id: '' })).toBeUndefined();
    expect(parsePlaceSummary({ ...place, name: undefined })).toBeUndefined();
    expect(parsePlaceSummary({ ...place, address: 3 })).toBeUndefined();
    expect(parsePlaceSummary({ ...place, latitude: 'x' })).toBeUndefined();
    expect(parsePlaceSummary(undefined)).toBeUndefined();
  });
});

describe('parseTrip', () => {
  it('accepts a complete trip', () => {
    expect(parseTrip(trip)).toEqual(trip);
  });

  it('refuses a trip with a broken part, instead of resuming a half-trip', () => {
    expect(parseTrip({ ...trip, travelMode: 'helicopter' })).toBeUndefined();
    expect(parseTrip({ ...trip, departedAt: 'yesterday' })).toBeUndefined();
    expect(parseTrip({ ...trip, initialDistanceMeters: -1 })).toBeUndefined();
    expect(parseTrip({ ...trip, initialDistanceMeters: '1800' })).toBeUndefined();
    expect(parseTrip({ ...trip, place: { id: 'x' } })).toBeUndefined();
    expect(parseTrip(null)).toBeUndefined();
  });

  it('accepts a trip that started exactly at the destination', () => {
    expect(parseTrip({ ...trip, initialDistanceMeters: 0 })).toMatchObject({ initialDistanceMeters: 0 });
  });
});

describe('parseSavedSuggestion', () => {
  const saved = {
    place: { ...place, kindLabel: 'Mirante', photoPath: 'seed/m.jpg' },
    openUntil: '2026-10-02T21:00:00.000Z',
    savedAt: '2026-10-02T15:00:00.000Z',
  };

  it('accepts a complete suggestion', () => {
    expect(parseSavedSuggestion(saved)).toEqual(saved);
  });

  it('turns a missing photo and an unknown closing time into null', () => {
    const result = parseSavedSuggestion({
      ...saved,
      place: { ...saved.place, photoPath: undefined },
      openUntil: undefined,
    });
    expect(result).toMatchObject({ openUntil: null, place: { photoPath: null } });
  });

  it('refuses one without the place text or the save time', () => {
    expect(parseSavedSuggestion({ ...saved, place: { ...place } })).toBeUndefined();
    expect(parseSavedSuggestion({ ...saved, savedAt: 'later' })).toBeUndefined();
    expect(parseSavedSuggestion({ ...saved, place: null })).toBeUndefined();
    expect(parseSavedSuggestion(undefined)).toBeUndefined();
  });
});

describe('parseQueuedStamps', () => {
  const item = { stamp, attempts: 2, failure: null };

  it('keeps a complete item as it was', () => {
    expect(parseQueuedStamps([item])).toEqual([item]);
  });

  it('is empty for anything that is not a list', () => {
    for (const value of [undefined, null, {}, 'x']) expect(parseQueuedStamps(value)).toEqual([]);
  });

  it('never loses a stamp over an invalid optional detail', () => {
    const [result] = parseQueuedStamps([
      {
        stamp: { ...stamp, mood: 'wild', timeSlot: 7, budget: null, memory: 5, feedback: { rating: 'great', tags: ['calm'] } },
        attempts: -3,
        failure: 42,
      },
    ]);
    expect(result).toEqual({
      stamp: { ...stamp, mood: null, timeSlot: null, budget: null, memory: null, feedback: null },
      attempts: 0,
      failure: null,
    });
  });

  it('keeps only the valid tags of the feedback', () => {
    const [result] = parseQueuedStamps([
      { stamp: { ...stamp, feedback: { rating: 'ok', tags: ['calm', 'weird', 5] } }, attempts: 0, failure: null },
    ]);
    expect(result.stamp.feedback).toEqual({ rating: 'ok', tags: ['calm'] });
  });

  it('keeps the failure reason of a stamp the server refused', () => {
    expect(parseQueuedStamps([{ ...item, failure: 'foreign key' }])[0].failure).toBe('foreign key');
  });

  it('drops only the items that lost the essentials', () => {
    const result = parseQueuedStamps([
      item,
      { stamp: { ...stamp, id: '' } },
      { stamp: { ...stamp, id: 'a', placeId: undefined } },
      { stamp: { ...stamp, id: 'b', number: 0 } },
      { stamp: { ...stamp, id: 'c', number: 1.5 } },
      { stamp: { ...stamp, id: 'd', stampedAt: 'whenever' } },
      { stamp: null },
      'garbage',
      { ...item, stamp: { ...stamp, id: 'stamp-2' } },
    ]);
    expect(result.map((queued) => queued.stamp.id)).toEqual(['stamp-1', 'stamp-2']);
  });

  it('keeps the first of two items with the same id', () => {
    const result = parseQueuedStamps([item, { ...item, attempts: 9 }]);
    expect(result).toHaveLength(1);
    expect(result[0].attempts).toBe(2);
  });
});
