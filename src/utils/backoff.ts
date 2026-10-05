/**
 * Espera antes da tentativa `attempt` (0 = a primeira repetição). Passada a última etapa da
 * lista, repete a última, então a espera cresce até um teto e fica ali.
 */
export function getBackoffDelay(attempt: number, delaysMs: readonly number[]): number {
  if (delaysMs.length === 0) return 0;
  const index = Math.min(Math.max(Math.trunc(attempt), 0), delaysMs.length - 1);
  return delaysMs[index];
}
