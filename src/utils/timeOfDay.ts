// Hora do dia como o Postgres entrega as colunas `time` ("18:00:00", às vezes com fração), convertida
// em minutos desde a meia-noite, que é o que o domínio usa (`PlaceHours`, `City`).

const TIME_OF_DAY = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

const MINUTES_PER_DAY = 24 * 60;

/**
 * "HH:mm", "HH:mm:ss" ou "HH:mm:ss.fff" em minutos desde a meia-noite (os segundos são ignorados).
 * "24:00" vale 1440, o fim do dia, como o Postgres aceita. `null` para texto inválido.
 */
export function parseTimeOfDay(value: string): number | null {
  const match = TIME_OF_DAY.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  if (minutes > 59 || seconds > 59) return null;
  const total = hours * 60 + minutes;
  // 24:00 é o único horário válido a partir das 24 h
  if (total > MINUTES_PER_DAY || (total === MINUTES_PER_DAY && seconds > 0)) return null;
  return total;
}
