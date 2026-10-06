import type { PlaceHours } from '@/types/place';
import { MS_PER_MINUTE, getZonedParts, zonedTimeToUtc } from '@/utils/zonedTime';

// Horário de funcionamento (docs/ARCHITECTURE.md, seções 8.9 e 13.5). As faixas de `PlaceHours`
// ficam no relógio de parede do fuso da cidade; aqui elas viram instantes reais (com horário de
// verão), são emendadas quando uma começa onde a outra termina, e só então se compara com a janela.
// Nenhuma conta de fuso é feita aqui: tudo passa por `utils/zonedTime`.

const MINUTES_PER_DAY = 24 * 60;

/**
 * Faixas que terminam em 23:59 e a que recomeça às 00:00 do dia seguinte (a forma comum de
 * cadastrar "24 horas") têm 1 minuto de folga entre si; até esse intervalo elas contam como uma
 * faixa só.
 */
const MAX_MERGE_GAP_MS = MS_PER_MINUTE;

interface Span {
  start: number;
  end: number;
}

function toMs(instant: Date | number): number {
  return typeof instant === 'number' ? instant : instant.getTime();
}

/** As faixas do dia local `year-month-day` (o dia pode estar fora do mês: `Date.UTC` ajusta) como intervalos de instantes. */
function spansOfDay(
  hours: readonly PlaceHours[],
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Span[] {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const spans: Span[] = [];
  for (const range of hours) {
    if (range.weekday !== weekday) continue;
    // closes <= opens: a faixa vira a meia-noite e termina no dia seguinte
    const wraps = range.closesMinute <= range.opensMinute;
    const start = zonedTimeToUtc(
      { year, month, day, minute: range.opensMinute },
      timeZone,
    ).getTime();
    const end = zonedTimeToUtc(
      { year, month, day: wraps ? day + 1 : day, minute: range.closesMinute },
      timeZone,
    ).getTime();
    spans.push({ start, end });
  }
  return spans;
}

/** Junta faixas que se tocam (ou quase, ver `MAX_MERGE_GAP_MS`). Recebe e devolve em ordem de início. */
function mergeSpans(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start - last.end <= MAX_MERGE_GAP_MS) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ ...span });
    }
  }
  return merged;
}

/**
 * Até quando o lugar segue aberto, contando de `instant`: o fim da faixa contínua que cobre o
 * instante (faixas emendadas, inclusive a que atravessa a meia-noite, valem como uma). `null` se
 * estiver fechado nesse instante. Lugar sem horário cadastrado nunca abre.
 *
 * `horizonMinutes` diz quantos dias à frente examinar (o suficiente para cobrir esse tempo, mais
 * a faixa que atravessa a meia-noite). Para um lugar que não fecha, o resultado é o fim do que foi
 * examinado, não um instante real de fechamento.
 */
export function getOpenUntil(
  hours: readonly PlaceHours[],
  instant: Date | number,
  timeZone: string,
  horizonMinutes: number = MINUTES_PER_DAY,
): Date | null {
  if (hours.length === 0) return null;
  const at = toMs(instant);
  const { year, month, day } = getZonedParts(at, timeZone);

  // um dia antes (faixa que vem da véspera) até o dia em que o horizonte termina, mais um de folga
  const lastDayOffset = Math.ceil(Math.max(horizonMinutes, 0) / MINUTES_PER_DAY) + 1;
  const spans: Span[] = [];
  for (let offset = -1; offset <= lastDayOffset; offset += 1) {
    spans.push(...spansOfDay(hours, year, month, day + offset, timeZone));
  }

  const covering = mergeSpans(spans).find((span) => span.start <= at && at < span.end);
  return covering ? new Date(covering.end) : null;
}

/**
 * O lugar fica aberto durante **toda** a janela que começa em `startsAt` e dura `durationMin`?
 * Fechar exatamente no fim da janela conta como aberto; abrir exatamente no início também.
 */
export function isOpenDuring(
  hours: readonly PlaceHours[],
  startsAt: Date | number,
  durationMin: number,
  timeZone: string,
): boolean {
  const duration = Math.max(durationMin, 0);
  const openUntil = getOpenUntil(hours, startsAt, timeZone, duration);
  if (!openUntil) return false;
  return openUntil.getTime() >= toMs(startsAt) + duration * MS_PER_MINUTE;
}
