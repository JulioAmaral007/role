import type { Stamp } from '@/types/stamp';

// Contrato dos carimbos no servidor (docs/ARCHITECTURE.md, seções 8.9 e 9.5). O carimbo nasce no
// aparelho (`createStamp`), vai para a fila offline e só depois sobe por aqui. Quem usa recebe esta
// interface e nunca o client do Supabase. Todos os erros saem como `AppError`; o `status` dele
// separa a falha passageira (rede, 5xx: o item fica na fila) da permanente (4xx: não reenviar).
export interface StampsService {
  /**
   * Os carimbos da pessoa, com a avaliação, do mais recente para o mais antigo. Só os dela: a RLS
   * esconde o resto.
   */
  list(): Promise<Stamp[]>;

  /**
   * Envia carimbos (e a avaliação de cada um) **de forma idempotente**: reenviar o mesmo `id` não
   * duplica nem altera o que já está no servidor. Pode ser chamado de novo com o mesmo lote depois
   * de uma falha no meio.
   */
  upload(stamps: readonly Stamp[]): Promise<void>;
}
