import type { Tables, TablesInsert } from '@/types/database';
import type { Stamp } from '@/types/stamp';

// Converte entre as linhas do banco (`snake_case`, `database.ts`) e o `Stamp` do domínio (ADR 8.9).

export type StampRow = Tables<'stamps'>;
export type PlaceFeedbackRow = Tables<'place_feedback'>;

/** O carimbo com a avaliação, como a consulta com embed devolve (`place_feedback` é 1 para 1). */
export type StampWithFeedback = StampRow & { place_feedback: PlaceFeedbackRow | null };

export function toStamp(row: StampWithFeedback): Stamp {
  return {
    id: row.id,
    placeId: row.place_id,
    number: row.number,
    stampedAt: row.stamped_at,
    mood: row.mood,
    timeSlot: row.time_slot,
    budget: row.budget,
    memory: row.memory,
    feedback: row.place_feedback
      ? { rating: row.place_feedback.rating, tags: row.place_feedback.tags }
      : null,
  };
}

/** O dono (`user_id`) fica de fora de propósito: o banco o preenche com `auth.uid()`. */
export function toStampInsert(stamp: Stamp): TablesInsert<'stamps'> {
  return {
    id: stamp.id,
    place_id: stamp.placeId,
    number: stamp.number,
    stamped_at: stamp.stampedAt,
    mood: stamp.mood,
    time_slot: stamp.timeSlot,
    budget: stamp.budget,
    memory: stamp.memory,
  };
}

/** Só existe linha de avaliação para o carimbo que tem avaliação. */
export function toFeedbackInserts(stamps: readonly Stamp[]): TablesInsert<'place_feedback'>[] {
  const rows: TablesInsert<'place_feedback'>[] = [];
  for (const stamp of stamps) {
    if (!stamp.feedback) continue;
    rows.push({
      stamp_id: stamp.id,
      rating: stamp.feedback.rating,
      tags: stamp.feedback.tags,
    });
  }
  return rows;
}
