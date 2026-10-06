import { randomUUID } from 'expo-crypto';

import type { Budget, Mood, TimeSlot } from '@/types/ids';
import type { Stamp, StampFeedback } from '@/types/stamp';

// Criar o carimbo no aparelho (docs/ARCHITECTURE.md, seção 9.5): o `id` (uuid v4) e o `number` são
// gerados aqui, antes de qualquer rede, para o carimbo aparecer na hora e o reenvio da fila ser
// idempotente.

export interface CreateStampInput {
  placeId: string;
  mood: Mood | null;
  timeSlot: TimeSlot | null;
  budget: Budget | null;
  /** A lembrança, texto curto (o banco aceita até 500 caracteres). */
  memory: string | null;
  /** `null` quando a pessoa pulou a avaliação ("Depois"). */
  feedback: StampFeedback | null;
  /** Quantos carimbos já estão confirmados no servidor. */
  confirmedCount: number;
  /** Quantos estão na fila, ainda sem subir. */
  pendingCount: number;
}

interface CreateStampOptions {
  /** Injetáveis para testar; o padrão é o uuid do `expo-crypto` e o relógio do aparelho. */
  generateId?: () => string;
  now?: () => Date;
}

/** A lembrança tem no máximo 500 caracteres no banco (`stamps.memory`). */
export const MEMORY_MAX_LENGTH = 500;

/** O número do próximo carimbo: o total confirmado, mais os pendentes, mais 1 ("Nº 14"). */
export function getNextStampNumber(confirmedCount: number, pendingCount: number): number {
  return Math.max(confirmedCount, 0) + Math.max(pendingCount, 0) + 1;
}

export function createStamp(
  input: CreateStampInput,
  { generateId = randomUUID, now = () => new Date() }: CreateStampOptions = {},
): Stamp {
  // lembrança em branco não é lembrança; acima do limite o banco recusaria o carimbo inteiro
  const memory = input.memory?.trim() ?? '';
  return {
    id: generateId(),
    placeId: input.placeId,
    number: getNextStampNumber(input.confirmedCount, input.pendingCount),
    stampedAt: now().toISOString(),
    mood: input.mood,
    timeSlot: input.timeSlot,
    budget: input.budget,
    memory: memory.length > 0 ? memory.slice(0, MEMORY_MAX_LENGTH) : null,
    feedback: input.feedback,
  };
}
