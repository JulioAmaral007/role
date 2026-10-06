import { FREE_WEEKLY_QUOTA, type QuotaStatus } from '@/types/quota';

import type { ConsumeInput, QuotaResult, QuotaService } from './quotaService';

export const IN_MEMORY_QUOTA_RESETS_AT = '2026-10-05T03:00:00.000Z';

interface InMemoryQuotaOptions {
  /** Sugestões que restam no começo (padrão: a cota grátis inteira). */
  remaining?: number;
  /** Plus: sem limite, `remaining` sempre `null`. */
  plus?: boolean;
  resetsAt?: string;
}

/**
 * Cota para testes, com as regras do servidor: gasta 1 por pedido, bloqueia ao chegar a zero
 * (sem gravar nada) e repete a resposta de um `requestId` já visto sem gastar de novo. `setOffline`
 * faz as chamadas devolverem `offline`.
 */
export class InMemoryQuotaService implements QuotaService {
  /** Os pedidos de `consume` que gastaram cota, na ordem. */
  readonly charged: ConsumeInput[] = [];
  /** Quantas chamadas de `consume` chegaram (inclusive as repetidas e as bloqueadas). */
  consumeCalls = 0;
  private remaining: number;
  private readonly plus: boolean;
  private readonly resetsAt: string;
  private offline = false;
  private readonly answers = new Map<string, QuotaStatus>();

  constructor(options: InMemoryQuotaOptions = {}) {
    this.remaining = options.remaining ?? FREE_WEEKLY_QUOTA;
    this.plus = options.plus ?? false;
    this.resetsAt = options.resetsAt ?? IN_MEMORY_QUOTA_RESETS_AT;
  }

  setOffline(offline: boolean): void {
    this.offline = offline;
  }

  private current(): QuotaStatus {
    return this.plus
      ? { allowed: true, remaining: null, resetsAt: this.resetsAt }
      : { allowed: this.remaining > 0, remaining: this.remaining, resetsAt: this.resetsAt };
  }

  status(): Promise<QuotaResult> {
    if (this.offline) return Promise.resolve({ kind: 'offline' });
    return Promise.resolve({ kind: 'ok', quota: this.current() });
  }

  consume(input: ConsumeInput): Promise<QuotaResult> {
    this.consumeCalls += 1;
    if (this.offline) return Promise.resolve({ kind: 'offline' });

    const previous = this.answers.get(input.requestId);
    if (previous) return Promise.resolve({ kind: 'ok', quota: previous });

    if (!this.plus && this.remaining <= 0) {
      return Promise.resolve({ kind: 'ok', quota: this.current() });
    }
    if (!this.plus) this.remaining -= 1;
    this.charged.push(input);
    const answer = this.current();
    this.answers.set(input.requestId, answer);
    return Promise.resolve({ kind: 'ok', quota: answer });
  }
}
