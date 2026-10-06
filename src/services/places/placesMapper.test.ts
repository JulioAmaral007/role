import type { CityRow, PlaceHoursRow, PlaceTranslationRow, PlaceWithRelations } from './placesMapper';
import { toCity, toPlace, toPlaces } from './placesMapper';

const NOW = '2026-10-02T12:00:00Z';

const cityRow: CityRow = {
  id: 'city-1',
  name: 'Cidade de Teste',
  timezone: 'America/Sao_Paulo',
  daylight_cutoff: '18:00:00',
  created_at: NOW,
  updated_at: NOW,
};

const translation = (locale: string, overrides: Partial<PlaceTranslationRow> = {}): PlaceTranslationRow => ({
  place_id: 'place-1',
  locale,
  kind_label: `Mirante (${locale})`,
  reason_mood: `humor (${locale})`,
  reason_time: `tempo (${locale})`,
  reason_money: `dinheiro (${locale})`,
  created_at: NOW,
  updated_at: NOW,
  ...overrides,
});

const hoursRow = (id: number, weekday: number, opens: string, closes: string): PlaceHoursRow => ({
  id,
  place_id: 'place-1',
  weekday,
  opens,
  closes,
});

function placeRow(overrides: Partial<PlaceWithRelations> = {}): PlaceWithRelations {
  return {
    id: 'place-1',
    city_id: 'city-1',
    category: 'viewpoint',
    name: 'Mirante do Morro',
    address: 'Alto do Morro, s/n',
    lat: -23.542,
    lng: -46.641,
    price_tier: 1,
    typical_spend: 24.5,
    duration_min: 60,
    moods: ['curious', 'chill'],
    avoid_tags: ['crowded'],
    outdoor: true,
    reservable: true,
    reservation_url: 'https://example.com/reserva',
    photo_paths: ['a.jpg', 'b.jpg'],
    daylight_only: true,
    accessible: false,
    pet_friendly: true,
    active: true,
    verified_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    place_translations: [translation('pt-BR'), translation('en')],
    place_hours: [hoursRow(1, 5, '09:00:00', '18:00:00')],
    ...overrides,
  };
}

describe('toCity', () => {
  it('converts the row and the cutoff time into minutes', () => {
    expect(toCity(cityRow)).toEqual({
      id: 'city-1',
      name: 'Cidade de Teste',
      timeZone: 'America/Sao_Paulo',
      daylightCutoffMinute: 1080,
    });
  });

  it('falls back to a cutoff that never allows daylight-only places when the time is unreadable', () => {
    expect(toCity({ ...cityRow, daylight_cutoff: 'dusk' }).daylightCutoffMinute).toBe(0);
  });
});

describe('toPlace', () => {
  it('converts every column to the domain shape', () => {
    expect(toPlace(placeRow(), 'pt-BR')).toEqual({
      id: 'place-1',
      cityId: 'city-1',
      category: 'viewpoint',
      name: 'Mirante do Morro',
      address: 'Alto do Morro, s/n',
      latitude: -23.542,
      longitude: -46.641,
      priceTier: 1,
      typicalSpend: 24.5,
      durationMin: 60,
      moods: ['curious', 'chill'],
      avoidTags: ['crowded'],
      outdoor: true,
      reservable: true,
      reservationUrl: 'https://example.com/reserva',
      photoPaths: ['a.jpg', 'b.jpg'],
      daylightOnly: true,
      accessible: false,
      petFriendly: true,
      active: true,
      verifiedAt: NOW,
      text: {
        kindLabel: 'Mirante (pt-BR)',
        reasonMood: 'humor (pt-BR)',
        reasonTime: 'tempo (pt-BR)',
        reasonMoney: 'dinheiro (pt-BR)',
      },
      hours: [{ weekday: 5, opensMinute: 540, closesMinute: 1080 }],
    });
  });

  it('picks the translation of the requested language', () => {
    expect(toPlace(placeRow(), 'en')?.text.kindLabel).toBe('Mirante (en)');
  });

  it('falls back to the base language when the place has no translation in the requested one', () => {
    expect(toPlace(placeRow(), 'es')?.text.kindLabel).toBe('Mirante (pt-BR)');
  });

  it('drops a place that has no translation in either language', () => {
    expect(toPlace(placeRow({ place_translations: [translation('es')] }), 'en')).toBeNull();
    expect(toPlace(placeRow({ place_translations: [] }), 'pt-BR')).toBeNull();
  });

  it('keeps the price tier inside 0 to 3', () => {
    expect(toPlace(placeRow({ price_tier: 7 }), 'pt-BR')?.priceTier).toBe(3);
    expect(toPlace(placeRow({ price_tier: -2 }), 'pt-BR')?.priceTier).toBe(0);
    expect(toPlace(placeRow({ price_tier: 2 }), 'pt-BR')?.priceTier).toBe(2);
  });

  it('sorts the hours by weekday and opening time, and turns the times into minutes', () => {
    const place = toPlace(
      placeRow({
        place_hours: [
          hoursRow(1, 5, '19:00:00', '23:00:00'),
          hoursRow(2, 0, '10:00:00', '14:00:00'),
          hoursRow(3, 5, '12:00:00', '15:00:00'),
          hoursRow(4, 6, '18:00:00', '02:00:00'),
        ],
      }),
      'pt-BR',
    );
    expect(place?.hours).toEqual([
      { weekday: 0, opensMinute: 600, closesMinute: 840 },
      { weekday: 5, opensMinute: 720, closesMinute: 900 },
      { weekday: 5, opensMinute: 1140, closesMinute: 1380 },
      { weekday: 6, opensMinute: 1080, closesMinute: 120 },
    ]);
  });

  it('drops hours it cannot read instead of inventing them', () => {
    const place = toPlace(
      placeRow({ place_hours: [hoursRow(1, 5, 'soon', '18:00:00'), hoursRow(2, 5, '09:00:00', '18:00:00')] }),
      'pt-BR',
    );
    expect(place?.hours).toEqual([{ weekday: 5, opensMinute: 540, closesMinute: 1080 }]);
  });

  it('keeps a place without hours (it simply never opens)', () => {
    expect(toPlace(placeRow({ place_hours: [] }), 'pt-BR')?.hours).toEqual([]);
  });

  it('keeps a place that is inactive, so the passport can still show it', () => {
    expect(toPlace(placeRow({ active: false }), 'pt-BR')?.active).toBe(false);
  });
});

describe('toPlaces', () => {
  it('converts the places that have text and skips the rest', () => {
    const withText = placeRow({ id: 'a' });
    const withoutText = placeRow({ id: 'b', place_translations: [] });
    expect(toPlaces([withText, withoutText], 'pt-BR').map(({ id }) => id)).toEqual(['a']);
  });
});
