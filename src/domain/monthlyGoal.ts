import type { Stamp } from '@/types/stamp';
import { getZonedParts } from '@/utils/zonedTime';

// Meta do mês: conhecer **3 lugares onde a pessoa nunca foi**. Um lugar conta no mês em que ganhou o
// **primeiro** carimbo da vida dela; voltar a um lugar já visitado não conta, e vários carimbos no
// mesmo lugar novo valem uma vez. O mês é o do calendário no fuso da pessoa. Serve para os carimbos
// do servidor e para os pendentes na fila offline.

export const MONTHLY_GOAL_TARGET = 3;

export interface MonthlyGoal {
  year: number;
  /** 1 a 12; o nome do mês vem do i18n (`Intl`), no idioma ativo. */
  month: number;
  target: number;
  /** Lugares novos descobertos no mês (pode passar da meta). */
  count: number;
  reached: boolean;
}

export function getMonthlyGoal(
  stamps: readonly Pick<Stamp, 'placeId' | 'stampedAt'>[],
  now: Date | number,
  timeZone: string,
): MonthlyGoal {
  const { year, month } = getZonedParts(now, timeZone);

  // o primeiro carimbo de cada lugar, de todos os tempos
  const firstStampByPlace = new Map<string, number>();
  for (const { placeId, stampedAt } of stamps) {
    const time = Date.parse(stampedAt);
    if (Number.isNaN(time)) continue;
    const first = firstStampByPlace.get(placeId);
    if (first === undefined || time < first) firstStampByPlace.set(placeId, time);
  }

  let count = 0;
  for (const time of firstStampByPlace.values()) {
    const first = getZonedParts(time, timeZone);
    if (first.year === year && first.month === month) count += 1;
  }

  return { year, month, target: MONTHLY_GOAL_TARGET, count, reached: count >= MONTHLY_GOAL_TARGET };
}
