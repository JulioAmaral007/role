import { AppError } from '@/utils/appError';

import type { AuthService } from './authService';

export const IN_MEMORY_USER_ID = '00000000-0000-4000-8000-0000000000aa';

/** Service para testes: falha as primeiras `failures` tentativas e depois entrega uma sessão. */
export class InMemoryAuthService implements AuthService {
  calls = 0;
  private remainingFailures: number;

  constructor(options: { failures?: number; userId?: string } = {}) {
    this.remainingFailures = options.failures ?? 0;
    this.userId = options.userId ?? IN_MEMORY_USER_ID;
  }

  private readonly userId: string;

  ensureSession(): Promise<string> {
    this.calls += 1;
    if (this.remainingFailures > 0) {
      this.remainingFailures -= 1;
      return Promise.reject(new AppError('network', 'offline'));
    }
    return Promise.resolve(this.userId);
  }
}
