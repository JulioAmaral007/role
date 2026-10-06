/**
 * Contas de data e hora por fuso IANA (docs/ARCHITECTURE.md, seção 13.5, D21).
 *
 * Decisão: opção (a), `Intl.DateTimeFormat` com `timeZone` e *parse* da string. Não usa
 * `formatToParts` (a doc do Hermes não o confirma no iOS) nem nome de dia ou de mês (que mudam
 * com a versão do Android): só `format()` com opções numéricas, que sai com o mesmo formato
 * `MM/DD/YYYY, HH:mm:ss` em `en-US`, e o parse pega as seis sequências de dígitos. O dia da semana
 * sai do calendário (`Date.UTC`), nunca do texto.
 *
 * Todas as funções de data com fuso do app passam por aqui; nada em `domain/` faz conta de fuso.
 * A semana começa na **segunda-feira**, igual a `date_trunc('week', ...)` do Postgres usado pela cota.
 */

export type ZonedParts = {
  year: number;
  /** 1 a 12. */
  month: number;
  day: number;
  /** 0 a 23. */
  hour: number;
  minute: number;
  second: number;
  /** 0 = domingo ... 6 = sábado. */
  weekday: number;
};

/** Data e hora de parede (sem fuso). Dia, hora, minuto e segundo fora da faixa "rolam" para o vizinho. */
export type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
};

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

const WEEKDAYS_PER_WEEK = 7;
const DIGIT_GROUPS = /\d+/g;

// Criar `Intl.DateTimeFormat` é caro (regra `js-hoist-intl`): um por fuso, guardado no módulo.
const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** `true` se o nome IANA é conhecido pelo motor (ex.: `America/Sao_Paulo`). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    getFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

function toMs(instant: Date | number): number {
  return typeof instant === 'number' ? instant : instant.getTime();
}

/** Dia da semana (0 = domingo) de uma data de calendário. */
function getWeekday(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** O instante visto no relógio de parede do fuso. Lança `RangeError` se o fuso não existe. */
export function getZonedParts(instant: Date | number, timeZone: string): ZonedParts {
  const text = getFormatter(timeZone).format(instant);
  const numbers = text.match(DIGIT_GROUPS);
  if (!numbers || numbers.length < 6) {
    throw new Error(`Unexpected date format from Intl: "${text}"`);
  }
  const [month, day, year, hour, minute, second] = numbers.map(Number);
  return {
    year,
    month,
    day,
    // alguns motores antigos devolvem 24 à meia-noite mesmo com h23
    hour: hour === 24 ? 0 : hour,
    minute,
    second,
    weekday: getWeekday(year, month, day),
  };
}

/** Diferença, em ms, entre o relógio de parede do fuso e o UTC naquele instante (BRT = -3 h). */
export function getZoneOffsetMs(instant: Date | number, timeZone: string): number {
  const ms = toMs(instant);
  const parts = getZonedParts(ms, timeZone);
  const wallAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  // as partes não têm milissegundos: compara com o instante truncado ao segundo
  return wallAsUtc - Math.floor(ms / 1000) * 1000;
}

/**
 * O instante em que o relógio de parede do fuso marca `local`.
 *
 * Nos horários de verão: se a hora **não existe** (pulo para frente), vale a hora logo depois do
 * pulo (ex.: meia-noite que vira 01:00); se a hora **se repete** (volta para trás), vale a primeira.
 */
export function zonedTimeToUtc(local: LocalDateTime, timeZone: string): Date {
  const wallAsUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour ?? 0,
    local.minute ?? 0,
    local.second ?? 0,
  );
  // Os deslocamentos de um dia antes e de um dia depois cercam qualquer virada de horário de verão.
  const offsetBefore = getZoneOffsetMs(wallAsUtc - MS_PER_DAY, timeZone);
  const offsetAfter = getZoneOffsetMs(wallAsUtc + MS_PER_DAY, timeZone);

  const candidates = [offsetBefore, offsetAfter]
    .filter((offset, index, all) => all.indexOf(offset) === index)
    .map((offset) => wallAsUtc - offset)
    .filter((utc) => getZoneOffsetMs(utc, timeZone) === wallAsUtc - utc);

  // sem candidato válido = a hora caiu no pulo do verão: usa o deslocamento de antes do pulo
  return new Date(candidates.length > 0 ? Math.min(...candidates) : wallAsUtc - offsetBefore);
}

/** Chave `AAAA-MM-DD` do dia do instante no fuso (serve de chave de agrupamento e de comparação). */
export function getZonedDateKey(instant: Date | number, timeZone: string): string {
  const { year, month, day } = getZonedParts(instant, timeZone);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Minutos desde a meia-noite do relógio de parede do fuso (0 a 1439). */
export function getZonedMinutesOfDay(instant: Date | number, timeZone: string): number {
  const { hour, minute } = getZonedParts(instant, timeZone);
  return hour * 60 + minute;
}

export function isSameZonedDay(a: Date | number, b: Date | number, timeZone: string): boolean {
  return getZonedDateKey(a, timeZone) === getZonedDateKey(b, timeZone);
}

/** O primeiro instante do dia do `instant` no fuso. */
export function startOfZonedDay(instant: Date | number, timeZone: string): Date {
  const { year, month, day } = getZonedParts(instant, timeZone);
  return zonedTimeToUtc({ year, month, day }, timeZone);
}

/** O primeiro instante do dia seguinte ao do `instant` no fuso (o dia pode ter 23, 24 ou 25 h). */
export function startOfNextZonedDay(instant: Date | number, timeZone: string): Date {
  const { year, month, day } = getZonedParts(instant, timeZone);
  return zonedTimeToUtc({ year, month, day: day + 1 }, timeZone);
}

/** O primeiro instante da semana (segunda-feira 00:00) do `instant` no fuso. */
export function startOfZonedWeek(instant: Date | number, timeZone: string): Date {
  const { year, month, day, weekday } = getZonedParts(instant, timeZone);
  const daysSinceMonday = (weekday + WEEKDAYS_PER_WEEK - 1) % WEEKDAYS_PER_WEEK;
  return zonedTimeToUtc({ year, month, day: day - daysSinceMonday }, timeZone);
}

/** O início da semana seguinte, que é também o instante em que a semana do `instant` vira. */
export function startOfNextZonedWeek(instant: Date | number, timeZone: string): Date {
  const { year, month, day, weekday } = getZonedParts(instant, timeZone);
  const daysSinceMonday = (weekday + WEEKDAYS_PER_WEEK - 1) % WEEKDAYS_PER_WEEK;
  return zonedTimeToUtc(
    { year, month, day: day - daysSinceMonday + WEEKDAYS_PER_WEEK },
    timeZone,
  );
}
