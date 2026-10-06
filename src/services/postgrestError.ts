import { AppError } from '@/utils/appError';

// Converte o erro de uma consulta do Supabase (PostgREST) em `AppError` (docs/ARCHITECTURE.md, seção
// 8.9), para nada acima de `services/` depender do formato do Supabase. O `supabase-js` não lança:
// devolve `{ error, status }`, e uma falha de rede (sem resposta do servidor) vem com `status` 0.
export interface PostgrestErrorLike {
  message: string;
  code?: string;
}

export function toPostgrestAppError(error: PostgrestErrorLike, status: number): AppError {
  const options = { cause: error, status };
  if (status === 0) return new AppError('network', error.message, options);
  if (status === 429) return new AppError('rateLimited', error.message, options);
  // 401: sessão ausente ou vencida; 403: a RLS negou (permission denied)
  if (status === 401 || status === 403) return new AppError('unauthorized', error.message, options);
  return new AppError('unknown', error.message, options);
}
