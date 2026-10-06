import type { Tables } from '@/types/database';
import { DEFAULT_LOCALE, type Locale } from '@/types/language';
import type { City, Place, PlaceHours, PriceTier } from '@/types/place';
import { parseTimeOfDay } from '@/utils/timeOfDay';

// Converte as linhas do banco (`snake_case`, `database.ts`) nos tipos de domínio (`camelCase`).
// É a única parte do app que conhece o formato do catálogo no Supabase (ADR 8.9).

export type CityRow = Tables<'cities'>;
export type PlaceRow = Tables<'places'>;
export type PlaceTranslationRow = Tables<'place_translations'>;
export type PlaceHoursRow = Tables<'place_hours'>;

/** O lugar com as linhas relacionadas, como a consulta com embed devolve. */
export type PlaceWithRelations = PlaceRow & {
  place_translations: PlaceTranslationRow[];
  place_hours: PlaceHoursRow[];
};

const MAX_PRICE_TIER = 3;

export function toCity(row: CityRow): City {
  // um corte ilegível vira "nunca": nenhum lugar "só de dia" seria sugerido, o lado seguro
  const cutoff = parseTimeOfDay(row.daylight_cutoff);
  return {
    id: row.id,
    name: row.name,
    timeZone: row.timezone,
    daylightCutoffMinute: cutoff ?? 0,
  };
}

function toPriceTier(value: number): PriceTier {
  return Math.min(MAX_PRICE_TIER, Math.max(0, Math.round(value))) as PriceTier;
}

/** Faixas ilegíveis são descartadas (o lugar fica com menos horários, nunca com horário inventado). */
function toPlaceHours(rows: readonly PlaceHoursRow[]): PlaceHours[] {
  const hours: PlaceHours[] = [];
  for (const row of rows) {
    const opensMinute = parseTimeOfDay(row.opens);
    const closesMinute = parseTimeOfDay(row.closes);
    if (opensMinute === null || closesMinute === null) continue;
    hours.push({ weekday: row.weekday, opensMinute, closesMinute });
  }
  return hours.sort((a, b) => a.weekday - b.weekday || a.opensMinute - b.opensMinute);
}

/** A tradução no idioma pedido, ou no base (pt-BR) se esse não existir. */
function pickTranslation(
  translations: readonly PlaceTranslationRow[],
  locale: Locale,
): PlaceTranslationRow | undefined {
  return (
    translations.find((translation) => translation.locale === locale) ??
    translations.find((translation) => translation.locale === DEFAULT_LOCALE)
  );
}

/** `null` quando o lugar não tem tradução utilizável: sem texto não há o que mostrar. */
export function toPlace(row: PlaceWithRelations, locale: Locale): Place | null {
  const translation = pickTranslation(row.place_translations, locale);
  if (!translation) return null;

  return {
    id: row.id,
    cityId: row.city_id,
    category: row.category,
    name: row.name,
    address: row.address,
    latitude: row.lat,
    longitude: row.lng,
    priceTier: toPriceTier(row.price_tier),
    typicalSpend: row.typical_spend,
    durationMin: row.duration_min,
    moods: row.moods,
    avoidTags: row.avoid_tags,
    outdoor: row.outdoor,
    reservable: row.reservable,
    reservationUrl: row.reservation_url,
    photoPaths: row.photo_paths,
    daylightOnly: row.daylight_only,
    accessible: row.accessible,
    petFriendly: row.pet_friendly,
    active: row.active,
    verifiedAt: row.verified_at,
    text: {
      kindLabel: translation.kind_label,
      reasonMood: translation.reason_mood,
      reasonTime: translation.reason_time,
      reasonMoney: translation.reason_money,
    },
    hours: toPlaceHours(row.place_hours),
  };
}

export function toPlaces(rows: readonly PlaceWithRelations[], locale: Locale): Place[] {
  const places: Place[] = [];
  for (const row of rows) {
    const place = toPlace(row, locale);
    if (place) places.push(place);
  }
  return places;
}
