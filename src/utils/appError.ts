// Erro do app (docs/ARCHITECTURE.md, seção 8.9): os services convertem os erros do Supabase nisto,
// para nada acima de `services/` depender do formato do Supabase.
export type AppErrorCode = 'network' | 'rateLimited' | 'unauthorized' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AppError';
    this.code = code;
  }
}
