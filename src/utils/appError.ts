// Erro do app (docs/ARCHITECTURE.md, seção 8.9): os services convertem os erros do Supabase nisto,
// para nada acima de `services/` depender do formato do Supabase.
export type AppErrorCode = 'network' | 'rateLimited' | 'unauthorized' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  /** Status HTTP da resposta, quando houve uma (0 = sem resposta). Separa falha permanente (4xx) de passageira (5xx). */
  readonly status: number | undefined;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown; status?: number }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = options?.status;
  }
}
