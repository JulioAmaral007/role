import type { Budget, FeedbackRating, FeedbackTag, Mood, TimeSlot } from '@/types/ids';

/** A avaliação do "Como foi", que viaja junto com o carimbo (`place_feedback`). */
export interface StampFeedback {
  rating: FeedbackRating;
  tags: FeedbackTag[];
}

/** Carimbo do passaporte (`stamps`). */
export interface Stamp {
  /** UUID gerado no aparelho; é a base da idempotência da fila offline. */
  id: string;
  placeId: string;
  /** Número sequencial do usuário ("Nº 14"). */
  number: number;
  /** Quando a pessoa chegou (ISO 8601). */
  stampedAt: string;
  mood: Mood | null;
  timeSlot: TimeSlot | null;
  budget: Budget | null;
  /** A lembrança, texto curto. */
  memory: string | null;
  /** `null` quando a pessoa pulou a avaliação ("Depois"). */
  feedback: StampFeedback | null;
}
