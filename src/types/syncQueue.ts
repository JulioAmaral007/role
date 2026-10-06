import type { Stamp } from '@/types/stamp';

/** Um carimbo na fila offline, esperando para subir (docs/ARCHITECTURE.md, seção 9.5). */
export interface QueuedStamp {
  stamp: Stamp;
  /** Quantas tentativas de envio já falharam por motivo passageiro (rede, 5xx). */
  attempts: number;
  /**
   * `null` enquanto o item ainda pode ser enviado. Texto quando o servidor recusou de vez (4xx):
   * o item **fica** (o carimbo continua no passaporte, como "não enviado"), mas não é reenviado.
   */
  failure: string | null;
}
