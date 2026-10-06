/**
 * Situação de uma semana na ofensiva (Passaporte e pílula do Rolê):
 * - `done`: teve pelo menos 1 carimbo;
 * - `missed`: já terminou sem nenhum carimbo (borda tracejada no Passaporte);
 * - `current`: a semana de hoje, ainda sem carimbo; não conta como perdida porque ainda dá tempo.
 */
export type WeekState = 'done' | 'missed' | 'current';

/** Uma semana (segunda a domingo, no fuso da pessoa) no histórico da ofensiva. */
export interface WeekStatus {
  /** Segunda-feira 00:00 no fuso da pessoa (ISO 8601). */
  startsAt: string;
  state: WeekState;
  /** Quantos carimbos caíram na semana. */
  stampCount: number;
}
