import { Constants, type Enums } from '@/types/database';

// IDs de domínio (Glossário, docs/ARCHITECTURE.md seção 14.4). Os que existem no banco vêm dos
// enums de `database.ts`, então o compilador acusa qualquer divergência; o rótulo mostrado ao
// usuário vem sempre do i18n, nunca do ID.

export type Mood = Enums<'mood'>;
export type TimeSlot = Enums<'time_slot'>;
export type Budget = Enums<'budget'>;
/** Categoria do lugar; as 16 são as células do bingo da cidade. */
export type Category = Enums<'category'>;
export type FeedbackRating = Enums<'feedback_rating'>;
export type FeedbackTag = Enums<'feedback_tag'>;
/** Tipo que a pessoa pediu para não receber ("Não quero sugestões de"). */
export type AvoidTag = Enums<'avoid_tag'>;
export type ReportReason = Enums<'report_reason'>;

/** Modo de transporte do rolê. Só existe no app (não há coluna no banco). */
export const TRAVEL_MODES = ['walk', 'bus', 'car'] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

/** Plano da pessoa (`profiles.plan`). O cliente só lê; quem muda é o servidor. */
export const PLANS = ['free', 'plus'] as const;
export type Plan = (typeof PLANS)[number];

// Guardas para valores que vêm de fora (storage, rede): confirmam que o texto é um ID conhecido antes
// de tratá-lo como tal. Os stores persistidos usam para não deixar um valor corrompido virar estado.

const includes = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

const ENUMS = Constants.public.Enums;

export const isMood = (value: unknown): value is Mood => includes(ENUMS.mood, value);
export const isTimeSlot = (value: unknown): value is TimeSlot => includes(ENUMS.time_slot, value);
export const isBudget = (value: unknown): value is Budget => includes(ENUMS.budget, value);
export const isFeedbackRating = (value: unknown): value is FeedbackRating =>
  includes(ENUMS.feedback_rating, value);
export const isFeedbackTag = (value: unknown): value is FeedbackTag =>
  includes(ENUMS.feedback_tag, value);
export const isAvoidTag = (value: unknown): value is AvoidTag => includes(ENUMS.avoid_tag, value);
export const isTravelMode = (value: unknown): value is TravelMode => includes(TRAVEL_MODES, value);
