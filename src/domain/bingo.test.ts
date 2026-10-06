import { makePlace, makeStamp } from '@/test/factories';
import { Constants } from '@/types/database';

import { BINGO_CATEGORIES, getBingo } from './bingo';

const viewpoint = makePlace({ category: 'viewpoint' });
const bookstore = makePlace({ category: 'used_bookstore' });
const lake = makePlace({ category: 'lake' });

describe('getBingo', () => {
  it('has the 16 categories of the glossary, in the order of the grid', () => {
    expect(BINGO_CATEGORIES).toEqual(Constants.public.Enums.category);
    expect(BINGO_CATEGORIES).toHaveLength(16);
    expect(BINGO_CATEGORIES[0]).toBe('viewpoint');
    expect(BINGO_CATEGORIES[15]).toBe('lake');
  });

  it('starts empty for a new user', () => {
    const bingo = getBingo([], [viewpoint, bookstore]);
    expect(bingo.cells.map(({ category }) => category)).toEqual([...BINGO_CATEGORIES]);
    expect(bingo.cells.every(({ stamped }) => !stamped)).toBe(true);
    expect(bingo).toMatchObject({ stampedCount: 0, total: 16, isComplete: false });
  });

  it('marks the category of a stamped place', () => {
    const stamp = makeStamp({ placeId: viewpoint.id });
    const bingo = getBingo([stamp], [viewpoint, bookstore]);
    expect(bingo.cells[0]).toEqual({ category: 'viewpoint', stamped: true, stampCount: 1, stampIds: [stamp.id] });
    expect(bingo.cells[1]).toMatchObject({ category: 'used_bookstore', stamped: false, stampCount: 0, stampIds: [] });
    expect(bingo.stampedCount).toBe(1);
  });

  it('counts the stamps of a category once for the grid, and all of them for the detail', () => {
    const first = makeStamp({ placeId: viewpoint.id });
    const secondPlace = makePlace({ category: 'viewpoint' });
    const second = makeStamp({ placeId: secondPlace.id });
    const again = makeStamp({ placeId: viewpoint.id });
    const bingo = getBingo([first, second, again], [viewpoint, secondPlace]);
    expect(bingo.cells[0]).toMatchObject({ stamped: true, stampCount: 3, stampIds: [first.id, second.id, again.id] });
    expect(bingo.stampedCount).toBe(1);
  });

  it('ignores stamps of places that are not in the catalog list', () => {
    const orphan = makeStamp({ placeId: 'gone' });
    const bingo = getBingo([orphan], [viewpoint]);
    expect(bingo.stampedCount).toBe(0);
  });

  it('still counts a stamp of a place that left the catalog, as long as the place is listed', () => {
    const retired = makePlace({ category: 'garden', active: false });
    const bingo = getBingo([makeStamp({ placeId: retired.id })], [retired]);
    expect(bingo.cells.find(({ category }) => category === 'garden')?.stamped).toBe(true);
  });

  it('is complete when the 16 categories are stamped', () => {
    const places = BINGO_CATEGORIES.map((category) => makePlace({ category }));
    const stamps = places.map((place) => makeStamp({ placeId: place.id }));
    const bingo = getBingo(stamps, places);
    expect(bingo).toMatchObject({ stampedCount: 16, total: 16, isComplete: true });
    expect(getBingo(stamps.slice(1), places).isComplete).toBe(false);
  });

  it('counts the example of the prototype: 7 of 16', () => {
    const places = BINGO_CATEGORIES.slice(0, 7).map((category) => makePlace({ category }));
    const stamps = places.map((place) => makeStamp({ placeId: place.id }));
    expect(getBingo(stamps, [...places, lake]).stampedCount).toBe(7);
  });
});
