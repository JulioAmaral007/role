import type { AvoidTag, Budget, Mood, TimeSlot } from '@/types/ids';
import type { City, Place } from '@/types/place';
import { MS_PER_MINUTE } from '@/utils/zonedTime';

import { getOpenUntil, isOpenDuring } from './openingHours';
import { isDaylightSafe } from './safety';

// Recomendação (D16: roda no cliente, com o catálogo da cidade em cache). Função pura: tudo que
// depende do aparelho (posição, hora, sorteio, carimbos, sessão) entra pelo `RecommendationRequest`.
//
// Premissas do loop para o usuário conferir no 👀 do MVP (cada uma é uma constante ou uma linha):
// - "Tempo": o lugar cabe no tempo escolhido se a visita (`durationMin`) mais a ida e a volta
//   (`travelMinutes`, já calculado por quem chama, com o `travelTime` da D33) não passam dele.
// - "Orçamento": vale o `typicalSpend` do lugar (em reais), não a faixa `priceTier`.
// - A janela de funcionamento e de luz do dia é a da **visita**: da chegada (agora + ida) até o fim
//   da visita.
// - Entre os candidatos, vem primeiro quem nunca foi carimbado, depois os mais perto, e o sorteio
//   é só entre os `DRAW_POOL_SIZE` primeiros, para a sugestão não ser sempre a mesma.

export const DEFAULT_MAX_DISTANCE_KM = 5;

/** Minutos de cada tempo disponível ("Quanto tempo você tem?"). */
export const TIME_SLOT_MINUTES: Record<TimeSlot, number> = {
  '1h': 60,
  '2h': 120,
  half_day: 240,
  full_day: 480,
};

/** Gasto máximo (em reais) de cada orçamento; "De graça" é gasto zero, "Tanto faz" não limita. */
export const BUDGET_MAX_SPEND: Record<Budget, number> = {
  free: 0,
  up_to_30: 30,
  up_to_80: 80,
  any: Number.POSITIVE_INFINITY,
};

/** Quantos candidatos (os mais perto, entre os que nunca foram carimbados) entram no sorteio. */
export const DRAW_POOL_SIZE = 3;

/** Um lugar do catálogo com a distância e o tempo de ida até ele, já calculados para esta pessoa. */
export interface Candidate {
  place: Place;
  /** Distância em linha reta do ponto de partida, em quilômetros. */
  distanceKm: number;
  /** Tempo de ida (só de ida) em minutos, estimado por `travelTime`. */
  travelMinutes: number;
}

export interface RecommendationRequest {
  candidates: readonly Candidate[];
  city: Pick<City, 'timeZone' | 'daylightCutoffMinute'>;
  mood: Mood;
  timeSlot: TimeSlot;
  budget: Budget;
  /** O "agora" da pessoa (quando ela sai). */
  now: Date | number;
  /** Preferências do Perfil. */
  maxDistanceKm: number;
  avoidTags: readonly AvoidTag[];
  accessibleOnly: boolean;
  /** Lugares que a pessoa já carimbou. */
  stampedPlaceIds: ReadonlySet<string>;
  /** Lugares já mostrados nesta sessão ("sortear sem repetir"). */
  shownPlaceIds: ReadonlySet<string>;
  /** Sorteio em [0, 1); injetável para testar. */
  random?: () => number;
}

/**
 * Por que nada bateu, pelo primeiro filtro que zerou a lista, nesta ordem: orçamento (`expensive`),
 * distância e tempo (`far`), só de dia (`outdoor`: lugares ao ar livre que já passaram do horário de
 * luz), funcionamento (`closed`). `exhausted`: tudo que servia já foi mostrado nesta sessão.
 * `other`: zerou antes disso (humor, preferências ou catálogo vazio).
 */
export type NoMatchReason = 'expensive' | 'far' | 'outdoor' | 'closed' | 'exhausted' | 'other';

export interface Eligible {
  eligible: Candidate[];
  /** Só tem valor quando `eligible` está vazio. */
  noMatchReason: NoMatchReason | undefined;
}

export type Recommendation =
  | {
      kind: 'match';
      candidate: Candidate;
      /** Até quando o lugar segue aberto a partir da chegada. */
      openUntil: Date;
      neverStamped: boolean;
    }
  | { kind: 'noMatch'; reason: NoMatchReason };

function toMs(instant: Date | number): number {
  return typeof instant === 'number' ? instant : instant.getTime();
}

/**
 * Os candidatos que passam em todos os filtros (sem olhar o que já foi mostrado na sessão). Quando
 * não sobra nenhum, diz qual filtro zerou a lista. A `relaxations` usa isto para saber o que uma
 * mudança abriria.
 */
export function findEligibleCandidates(request: RecommendationRequest): Eligible {
  const { city, mood, timeSlot, budget, avoidTags, accessibleOnly, maxDistanceKm } = request;
  const now = toMs(request.now);
  const slotMinutes = TIME_SLOT_MINUTES[timeSlot];
  const maxSpend = BUDGET_MAX_SPEND[budget];

  const arrivalOf = (candidate: Candidate) => now + candidate.travelMinutes * MS_PER_MINUTE;

  // cada etapa filtra a lista da anterior; a que deixa a lista vazia dá o motivo
  const stages: [NoMatchReason, (candidate: Candidate) => boolean][] = [
    [
      'other',
      ({ place }) =>
        place.active &&
        (!accessibleOnly || place.accessible) &&
        !place.avoidTags.some((tag) => avoidTags.includes(tag)) &&
        place.moods.includes(mood),
    ],
    ['expensive', ({ place }) => place.typicalSpend <= maxSpend],
    [
      'far',
      (candidate) =>
        candidate.distanceKm <= maxDistanceKm &&
        candidate.place.durationMin + 2 * candidate.travelMinutes <= slotMinutes,
    ],
    [
      'outdoor',
      (candidate) =>
        isDaylightSafe(candidate.place, city, arrivalOf(candidate), candidate.place.durationMin),
    ],
    [
      'closed',
      (candidate) =>
        isOpenDuring(
          candidate.place.hours,
          arrivalOf(candidate),
          candidate.place.durationMin,
          city.timeZone,
        ),
    ],
  ];

  let remaining = [...request.candidates];
  let noMatchReason: NoMatchReason | undefined;
  for (const [reason, passes] of stages) {
    remaining = remaining.filter(passes);
    if (remaining.length === 0) {
      noMatchReason = reason;
      break;
    }
  }
  return { eligible: remaining, noMatchReason };
}

/** Ordem de preferência: mais perto primeiro; empate resolvido pelo id, para ser determinístico. */
function byProximity(a: Candidate, b: Candidate): number {
  return a.distanceKm - b.distanceKm || a.place.id.localeCompare(b.place.id);
}

/**
 * Escolhe um lugar para a pessoa. Sem resultado, devolve o motivo, **sem consumir cota** (quem
 * consome é o service, só depois de um `match`).
 */
export function recommend(request: RecommendationRequest): Recommendation {
  const { eligible, noMatchReason } = findEligibleCandidates(request);
  if (eligible.length === 0) {
    return { kind: 'noMatch', reason: noMatchReason ?? 'other' };
  }

  const unseen = eligible.filter(({ place }) => !request.shownPlaceIds.has(place.id));
  if (unseen.length === 0) return { kind: 'noMatch', reason: 'exhausted' };

  // quem nunca foi carimbado tem prioridade; só se não houver, entram os já visitados
  const neverStamped = unseen.filter(({ place }) => !request.stampedPlaceIds.has(place.id));
  const pool = (neverStamped.length > 0 ? neverStamped : unseen)
    .sort(byProximity)
    .slice(0, DRAW_POOL_SIZE);

  const random = request.random ?? Math.random;
  // o min protege o caso de um `random` que devolva exatamente 1
  const candidate = pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)];
  const arrival = toMs(request.now) + candidate.travelMinutes * MS_PER_MINUTE;
  const openUntil = getOpenUntil(candidate.place.hours, arrival, request.city.timeZone);

  return {
    kind: 'match',
    candidate,
    // um lugar que passou no filtro de funcionamento está aberto na chegada
    openUntil: openUntil ?? new Date(arrival),
    neverStamped: neverStamped.length > 0,
  };
}
