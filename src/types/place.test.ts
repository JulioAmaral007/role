import { isTypeEqual, type CamelKeys } from '@/test/typeAssertions';
import type { Tables } from '@/types/database';
import type { City, Place, PriceTier } from '@/types/place';

type PlaceRow = Tables<'places'>;
type CityRow = Tables<'cities'>;

// Colunas que o app não carrega, ou que mudam de nome ou de forma ao virar tipo de domínio
// (latitude/longitude, tradução e horários resolvidos, horário em minutos).
type PlaceRowKeys = Exclude<CamelKeys<PlaceRow>, 'createdAt' | 'updatedAt' | 'lat' | 'lng'>;
type PlaceKeys = Exclude<keyof Place, 'latitude' | 'longitude' | 'text' | 'hours'>;
type CityRowKeys = Exclude<CamelKeys<CityRow>, 'createdAt' | 'updatedAt' | 'timezone' | 'daylightCutoff'>;
type CityKeys = Exclude<keyof City, 'timeZone' | 'daylightCutoffMinute'>;

describe('Place', () => {
  it('has every places column that the app uses', () => {
    expect(isTypeEqual<PlaceKeys, PlaceRowKeys>(true)).toBe(true);
  });

  it('keeps the enum columns typed as the database does', () => {
    expect(isTypeEqual<Place['category'], PlaceRow['category']>(true)).toBe(true);
    expect(isTypeEqual<Place['moods'], PlaceRow['moods']>(true)).toBe(true);
    expect(isTypeEqual<Place['avoidTags'], PlaceRow['avoid_tags']>(true)).toBe(true);
    expect(isTypeEqual<Place['reservationUrl'], PlaceRow['reservation_url']>(true)).toBe(true);
    expect(isTypeEqual<Place['verifiedAt'], PlaceRow['verified_at']>(true)).toBe(true);
  });

  it('narrows the price tier to the 0 to 3 of the check constraint', () => {
    const tiers: PriceTier[] = [0, 1, 2, 3];
    expect(tiers).toHaveLength(4);
  });
});

describe('City', () => {
  it('has every cities column that the app uses', () => {
    expect(isTypeEqual<CityKeys, CityRowKeys>(true)).toBe(true);
  });
});
