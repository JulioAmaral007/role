import {
  isAvoidTag,
  isBudget,
  isFeedbackRating,
  isFeedbackTag,
  isMood,
  isTimeSlot,
  isTravelMode,
  type AvoidTag,
} from '@/types/ids';
import type { StartPoint } from '@/types/preferences';
import type { Stamp, StampFeedback } from '@/types/stamp';
import type { QueuedStamp } from '@/types/syncQueue';
import type { PlaceSummary, SavedSuggestion, Trip } from '@/types/trip';

// Validação do que volta do disco ao hidratar um store (docs/ARCHITECTURE.md, seção 7.4). O que foi
// salvo pode estar corrompido ou ser de uma versão antiga: cada função recebe `unknown` e devolve o
// valor tipado, ou `undefined` (`[]` nas listas) quando não dá para confiar. Um valor ruim nunca
// derruba o app nem vira estado; no máximo se perde aquele campo. A fila de carimbos é a exceção
// que merece cuidado: só descarta o item sem o essencial (id, lugar, número e data), nunca por um
// detalhe opcional inválido, porque cada item é um carimbo que a pessoa ainda não viu chegar ao servidor.

type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/** Texto de data que o `Date` entende (ISO 8601). */
const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isLatitude = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= -90 && value <= 90;

const isLongitude = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= -180 && value <= 180;

export function parseStartPoint(value: unknown): StartPoint | undefined {
  if (!isRecord(value)) return undefined;
  const { label, latitude, longitude } = value;
  if (!isNonEmptyString(label) || !isLatitude(latitude) || !isLongitude(longitude)) return undefined;
  return { label, latitude, longitude };
}

/** Só os tipos conhecidos, sem repetir, na ordem em que vieram. */
export function parseAvoidTags(value: unknown): AvoidTag[] {
  if (!Array.isArray(value)) return [];
  const tags: AvoidTag[] = [];
  for (const item of value) {
    if (isAvoidTag(item) && !tags.includes(item)) tags.push(item);
  }
  return tags;
}

export function parsePlaceSummary(value: unknown): PlaceSummary | undefined {
  if (!isRecord(value)) return undefined;
  const { id, name, address, latitude, longitude } = value;
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(name) ||
    typeof address !== 'string' ||
    !isLatitude(latitude) ||
    !isLongitude(longitude)
  ) {
    return undefined;
  }
  return { id, name, address, latitude, longitude };
}

export function parseTrip(value: unknown): Trip | undefined {
  if (!isRecord(value)) return undefined;
  const place = parsePlaceSummary(value.place);
  const { travelMode, departedAt, initialDistanceMeters } = value;
  if (
    !place ||
    !isTravelMode(travelMode) ||
    !isDateString(departedAt) ||
    !isFiniteNumber(initialDistanceMeters) ||
    initialDistanceMeters < 0
  ) {
    return undefined;
  }
  return { place, travelMode, departedAt, initialDistanceMeters };
}

export function parseSavedSuggestion(value: unknown): SavedSuggestion | undefined {
  if (!isRecord(value) || !isRecord(value.place)) return undefined;
  const place = parsePlaceSummary(value.place);
  const { kindLabel, photoPath } = value.place;
  const { openUntil, savedAt } = value;
  if (!place || typeof kindLabel !== 'string' || !isDateString(savedAt)) return undefined;
  return {
    place: { ...place, kindLabel, photoPath: typeof photoPath === 'string' ? photoPath : null },
    openUntil: isDateString(openUntil) ? openUntil : null,
    savedAt,
  };
}

function parseFeedback(value: unknown): StampFeedback | null {
  if (!isRecord(value) || !isFeedbackRating(value.rating)) return null;
  const tags = Array.isArray(value.tags) ? value.tags.filter(isFeedbackTag) : [];
  return { rating: value.rating, tags };
}

function parseStamp(value: unknown): Stamp | undefined {
  if (!isRecord(value)) return undefined;
  const { id, placeId, number, stampedAt, mood, timeSlot, budget, memory, feedback } = value;
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(placeId) ||
    !isFiniteNumber(number) ||
    !Number.isInteger(number) ||
    number < 1 ||
    !isDateString(stampedAt)
  ) {
    return undefined;
  }
  return {
    id,
    placeId,
    number,
    stampedAt,
    mood: isMood(mood) ? mood : null,
    timeSlot: isTimeSlot(timeSlot) ? timeSlot : null,
    budget: isBudget(budget) ? budget : null,
    memory: typeof memory === 'string' ? memory : null,
    feedback: parseFeedback(feedback),
  };
}

/** Os itens da fila que ainda têm o essencial; repetido (mesmo `id`) vale o primeiro. */
export function parseQueuedStamps(value: unknown): QueuedStamp[] {
  if (!Array.isArray(value)) return [];
  const queue: QueuedStamp[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) continue;
    const stamp = parseStamp(item.stamp);
    if (!stamp || seen.has(stamp.id)) continue;
    seen.add(stamp.id);
    const { attempts, failure } = item;
    queue.push({
      stamp,
      attempts: typeof attempts === 'number' && Number.isInteger(attempts) && attempts > 0 ? attempts : 0,
      failure: typeof failure === 'string' ? failure : null,
    });
  }
  return queue;
}
