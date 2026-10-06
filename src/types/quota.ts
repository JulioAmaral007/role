/** Cota semanal de sugestões, como o servidor responde (`quota_status()` e `consume_suggestion()`). */
export interface QuotaStatus {
  /** `false` quando a cota da semana acabou. */
  allowed: boolean;
  /** Sugestões que ainda restam na semana; `null` no Plus (sem limite). */
  remaining: number | null;
  /** Quando a semana vira e a cota renova (ISO 8601). */
  resetsAt: string;
}

/** Tamanho da cota grátis por semana. Espelha `free_weekly_quota()` do `003_quota.sql` (um teste confere). */
export const FREE_WEEKLY_QUOTA = 3;
