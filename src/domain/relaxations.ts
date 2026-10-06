import type { Budget, Category } from '@/types/ids';
import { getZonedParts, zonedTimeToUtc } from '@/utils/zonedTime';

import { findEligibleCandidates, type RecommendationRequest } from './recommend';

// "Muda uma coisa só": para um pedido que não deu resultado, testa cada mudança de **um** filtro e
// devolve só as que abrem lugares, com um resumo do que abrem (a tela monta o texto, ex.: "cafés e
// livrarias cobertos"). Cada saída traz o necessário para refazer o pedido (`applyRelaxation`).
//
// Premissas do loop para o usuário conferir no 👀 do MVP: o raio dobra, com teto de 20 km (o máximo
// do Perfil), e "amanhã" é às 09:00 no fuso da cidade.

/** Do mais barato ao mais caro; a mudança de orçamento sobe **um** degrau. */
const BUDGET_LEVELS: readonly Budget[] = ['free', 'up_to_30', 'up_to_80', 'any'];

/** Maior distância que o Perfil permite (1 a 20 km). */
export const MAX_PROFILE_DISTANCE_KM = 20;

/** Hora (minutos desde a meia-noite, no fuso da cidade) em que começa o "amanhã". */
export const TOMORROW_START_MINUTE = 9 * 60;

interface RelaxationSummary {
  /** Quantos lugares (ainda não mostrados nesta sessão) a mudança abre. */
  opens: number;
  /** Categorias dos lugares que abre, da mais numerosa para a menos (empate pelo id). */
  categories: Category[];
}

export type Relaxation =
  | (RelaxationSummary & { kind: 'budget'; budget: Budget })
  | (RelaxationSummary & { kind: 'distance'; maxDistanceKm: number })
  | (RelaxationSummary & { kind: 'tomorrow'; now: Date });

/** O pedido com a mudança aplicada; o resto fica como estava (o original não é alterado). */
export function applyRelaxation(
  request: RecommendationRequest,
  relaxation: Relaxation,
): RecommendationRequest {
  switch (relaxation.kind) {
    case 'budget':
      return { ...request, budget: relaxation.budget };
    case 'distance':
      return { ...request, maxDistanceKm: relaxation.maxDistanceKm };
    case 'tomorrow':
      return { ...request, now: relaxation.now };
  }
}

function summarize(request: RecommendationRequest): RelaxationSummary {
  const unseen = findEligibleCandidates(request).eligible.filter(
    ({ place }) => !request.shownPlaceIds.has(place.id),
  );
  const counts = new Map<Category, number>();
  for (const { place } of unseen) {
    counts.set(place.category, (counts.get(place.category) ?? 0) + 1);
  }
  const categories = [...counts.keys()].sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b),
  );
  return { opens: unseen.length, categories };
}

function getTomorrowStart(request: RecommendationRequest): Date {
  const { year, month, day } = getZonedParts(request.now, request.city.timeZone);
  return zonedTimeToUtc(
    { year, month, day: day + 1, minute: TOMORROW_START_MINUTE },
    request.city.timeZone,
  );
}

/**
 * As mudanças de um filtro só que abrem pelo menos um lugar, as que abrem mais primeiro (empate:
 * orçamento, distância, amanhã). Vazio se o pedido já tem resultado ou se nada ajuda.
 */
export function findRelaxations(request: RecommendationRequest): Relaxation[] {
  if (summarize(request).opens > 0) return [];

  const options: Relaxation[] = [];

  const nextBudget = BUDGET_LEVELS[BUDGET_LEVELS.indexOf(request.budget) + 1];
  if (nextBudget) {
    const summary = summarize({ ...request, budget: nextBudget });
    if (summary.opens > 0) options.push({ kind: 'budget', budget: nextBudget, ...summary });
  }

  const widerDistance = Math.min(request.maxDistanceKm * 2, MAX_PROFILE_DISTANCE_KM);
  if (widerDistance > request.maxDistanceKm) {
    const summary = summarize({ ...request, maxDistanceKm: widerDistance });
    if (summary.opens > 0) {
      options.push({ kind: 'distance', maxDistanceKm: widerDistance, ...summary });
    }
  }

  const tomorrow = getTomorrowStart(request);
  const tomorrowSummary = summarize({ ...request, now: tomorrow });
  if (tomorrowSummary.opens > 0) {
    options.push({ kind: 'tomorrow', now: tomorrow, ...tomorrowSummary });
  }

  // o sort do JavaScript é estável: no empate, vale a ordem acima
  return options.sort((a, b) => b.opens - a.opens);
}
