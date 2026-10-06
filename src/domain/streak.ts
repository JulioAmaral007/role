import type { Stamp } from '@/types/stamp';
import type { WeekStatus } from '@/types/streak';
import { startOfZonedWeek } from '@/utils/zonedTime';

// Ofensiva semanal: quantas semanas seguidas (segunda a domingo, no fuso da pessoa) têm pelo menos
// 1 carimbo, e o histórico das últimas semanas para o Passaporte. A semana de hoje ainda sem
// carimbo não quebra a ofensiva: ainda dá tempo (`current`); ela só vira `missed` quando termina.
// Aceita qualquer lista de carimbos com `stampedAt`, então vale tanto para os do servidor quanto
// para os pendentes na fila offline.

/** Quantas semanas o Passaporte mostra ("1 saída por semana basta"). */
export const HISTORY_WEEKS = 8;

type StampTime = Pick<Stamp, 'stampedAt'>;

/** Quantos carimbos caíram em cada semana, pelo instante da segunda-feira 00:00 dela. */
function countStampsByWeek(
  stamps: readonly StampTime[],
  now: Date | number,
  timeZone: string,
): Map<number, number> {
  const currentWeekStart = startOfZonedWeek(now, timeZone).getTime();
  const counts = new Map<number, number>();
  for (const { stampedAt } of stamps) {
    const time = Date.parse(stampedAt);
    if (Number.isNaN(time)) continue;
    const weekStart = startOfZonedWeek(time, timeZone).getTime();
    // carimbo de semana que ainda não chegou (relógio errado): ignorado
    if (weekStart > currentWeekStart) continue;
    counts.set(weekStart, (counts.get(weekStart) ?? 0) + 1);
  }
  return counts;
}

/** O começo da semana anterior à que começa em `weekStart` (a semana pode ter 167 ou 169 h). */
function previousWeekStart(weekStart: number, timeZone: string): number {
  return startOfZonedWeek(weekStart - 1, timeZone).getTime();
}

/** As últimas `weeks` semanas, da mais antiga para a de hoje (a última). */
export function getWeekHistory(
  stamps: readonly StampTime[],
  now: Date | number,
  timeZone: string,
  weeks: number = HISTORY_WEEKS,
): WeekStatus[] {
  const counts = countStampsByWeek(stamps, now, timeZone);
  const history: WeekStatus[] = [];
  let weekStart = startOfZonedWeek(now, timeZone).getTime();
  for (let index = 0; index < weeks; index += 1) {
    const stampCount = counts.get(weekStart) ?? 0;
    history.push({
      startsAt: new Date(weekStart).toISOString(),
      state: stampCount > 0 ? 'done' : index === 0 ? 'current' : 'missed',
      stampCount,
    });
    weekStart = previousWeekStart(weekStart, timeZone);
  }
  return history.reverse();
}

/**
 * Semanas seguidas com carimbo, contando de hoje para trás. Se a semana de hoje ainda não tem
 * carimbo, a conta começa na semana passada (a ofensiva segue viva até a semana acabar).
 */
export function getStreak(
  stamps: readonly StampTime[],
  now: Date | number,
  timeZone: string,
): number {
  const counts = countStampsByWeek(stamps, now, timeZone);
  let weekStart = startOfZonedWeek(now, timeZone).getTime();
  if (!counts.has(weekStart)) weekStart = previousWeekStart(weekStart, timeZone);

  let streak = 0;
  while (counts.has(weekStart)) {
    streak += 1;
    weekStart = previousWeekStart(weekStart, timeZone);
  }
  return streak;
}
