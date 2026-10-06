import type { Candidate } from '@/domain/recommend';
import type { City, Place, PlaceHours } from '@/types/place';
import type { Stamp } from '@/types/stamp';

// Fábricas de dados para os testes: o objeto completo e válido, e cada teste muda só o que importa.

export const TEST_CITY: City = {
  id: 'city-1',
  name: 'Cidade de Teste',
  timeZone: 'America/Sao_Paulo',
  daylightCutoffMinute: 18 * 60,
};

/** Aberto todos os dias, das 08:00 às 20:00. */
export const ALL_WEEK_HOURS: PlaceHours[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  opensMinute: 8 * 60,
  closesMinute: 20 * 60,
}));

let placeCounter = 0;

export function makePlace(overrides: Partial<Place> = {}): Place {
  placeCounter += 1;
  return {
    id: `place-${placeCounter}`,
    cityId: TEST_CITY.id,
    category: 'viewpoint',
    name: `Lugar ${placeCounter}`,
    address: 'Rua Exemplo, 100',
    latitude: -23.55,
    longitude: -46.63,
    priceTier: 0,
    typicalSpend: 0,
    durationMin: 60,
    moods: ['curious'],
    avoidTags: [],
    outdoor: false,
    reservable: false,
    reservationUrl: null,
    photoPaths: [],
    daylightOnly: false,
    accessible: true,
    petFriendly: false,
    active: true,
    verifiedAt: null,
    text: {
      kindLabel: 'Mirante',
      reasonMood: 'Combina com o seu humor',
      reasonTime: 'Cabe no seu tempo',
      reasonMoney: 'Cabe no seu bolso',
    },
    hours: ALL_WEEK_HOURS,
    ...overrides,
  };
}

export function makeCandidate(
  placeOverrides: Partial<Place> = {},
  distanceKm = 1,
  travelMinutes = 0,
): Candidate {
  return { place: makePlace(placeOverrides), distanceKm, travelMinutes };
}

let stampCounter = 0;

export function makeStamp(overrides: Partial<Stamp> = {}): Stamp {
  stampCounter += 1;
  return {
    id: `stamp-${stampCounter}`,
    placeId: `place-${stampCounter}`,
    number: stampCounter,
    stampedAt: '2026-10-02T15:00:00.000Z',
    mood: null,
    timeSlot: null,
    budget: null,
    memory: null,
    feedback: null,
    ...overrides,
  };
}
