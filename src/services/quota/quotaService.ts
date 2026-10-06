import type { QuotaStatus } from '@/types/quota';

// Contrato da cota de sugestões (docs/ARCHITECTURE.md, seções 8.6, 8.9 e 9.4). A cota é do
// servidor (D12): o app só pergunta e consome. Quem usa recebe esta interface e nunca o client do
// Supabase.

/** Ação que gasta cota: a primeira sugestão ("Me tira da inércia") ou o botão "Outra". */
export type QuotaAction = 'shown' | 'other';

export interface ConsumeInput {
  placeId: string;
  /**
   * UUID gerado **por tentativa lógica** pelo chamador e reenviado no "Tentar de novo": o servidor
   * ignora a repetição e devolve a mesma resposta, então uma resposta perdida não cobra duas vezes.
   */
  requestId: string;
  /** Padrão: `shown`. */
  action?: QuotaAction;
}

/**
 * Resultado de uma chamada de cota. Sem rede **não é erro**: vira `offline`, e nada foi gasto (o
 * pedido nem chegou ao servidor). Os demais erros (limite de requisições, sessão, falha do servidor)
 * saem como `AppError` (`rateLimited`, `unauthorized` ou `unknown`).
 */
export type QuotaResult = { kind: 'ok'; quota: QuotaStatus } | { kind: 'offline' };

export interface QuotaService {
  /** Quanto resta e quando renova, sem consumir. */
  status(): Promise<QuotaResult>;
  /**
   * Gasta 1 sugestão, se houver cota. Sem cota devolve `allowed: false` e nada é gravado. Só chame
   * depois de a recomendação achar um lugar: "nada bateu" nunca consome.
   */
  consume(input: ConsumeInput): Promise<QuotaResult>;
}
