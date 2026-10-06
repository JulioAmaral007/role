import type { Stamp } from '@/types/stamp';
import type { AppError } from '@/utils/appError';

import type { StampsService } from './stampsService';

/**
 * Carimbos para testes, com as regras do servidor: o envio é idempotente por `id` (reenviar não
 * duplica nem altera) e a lista vem do mais recente para o mais antigo. `failWith` faz as próximas
 * chamadas falharem, para testar a fila offline.
 */
export class InMemoryStampsService implements StampsService {
  /** Quantas vezes `upload` foi chamado (inclusive as que falharam). */
  uploadCalls = 0;
  private readonly stored = new Map<string, Stamp>();
  private failure: AppError | null = null;

  constructor(initial: readonly Stamp[] = []) {
    for (const stamp of initial) this.stored.set(stamp.id, stamp);
  }

  /** As chamadas seguintes lançam este erro até `failWith(null)`. */
  failWith(error: AppError | null): void {
    this.failure = error;
  }

  list(): Promise<Stamp[]> {
    if (this.failure) return Promise.reject(this.failure);
    const stamps = [...this.stored.values()].sort(
      (a, b) => Date.parse(b.stampedAt) - Date.parse(a.stampedAt) || b.number - a.number,
    );
    return Promise.resolve(stamps);
  }

  upload(stamps: readonly Stamp[]): Promise<void> {
    this.uploadCalls += 1;
    if (this.failure) return Promise.reject(this.failure);
    for (const stamp of stamps) {
      if (!this.stored.has(stamp.id)) this.stored.set(stamp.id, stamp);
    }
    return Promise.resolve();
  }
}
