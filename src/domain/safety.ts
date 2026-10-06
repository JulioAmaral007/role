import type { City, Place } from '@/types/place';
import { MS_PER_MINUTE, getZonedParts, zonedTimeToUtc } from '@/utils/zonedTime';

// Regra "só de dia" (D19): lugares com `daylightOnly` só podem ser sugeridos enquanto há luz do dia,
// ou seja, depois do amanhecer e até o `daylightCutoffMinute` da cidade (um horário fixo por cidade;
// o pôr do sol real por data fica para a Fase 16). O horário de funcionamento do lugar continua
// valendo por cima, em `openingHours`.

/**
 * Começo do "dia" para a regra. O banco só tem o fim (`daylight_cutoff`), mas sem um começo um
 * lugar "só de dia" aberto 24 horas seria sugerido às 2 da manhã. **Premissa do loop, a confirmar
 * com o usuário:** 06:00, igual para todas as cidades.
 */
export const DAYLIGHT_START_MINUTE = 6 * 60;

/**
 * Este lugar pode ser sugerido para uma janela que começa em `startsAt` e dura `durationMin`?
 *
 * Lugar comum: sempre. Lugar `daylightOnly`: o início tem que ser a partir de `DAYLIGHT_START_MINUTE`
 * e **toda** a janela tem que terminar até o horário de corte da cidade (terminar exatamente no
 * corte vale; começar nele, não). Quem chama decide se passa a janela inteira (mais cauteloso, a
 * pessoa não fica no lugar depois de escurecer) ou `0` (só olha o momento da saída).
 */
export function isDaylightSafe(
  place: Pick<Place, 'daylightOnly'>,
  city: Pick<City, 'timeZone' | 'daylightCutoffMinute'>,
  startsAt: Date | number,
  durationMin: number = 0,
): boolean {
  if (!place.daylightOnly) return true;

  const start = typeof startsAt === 'number' ? startsAt : startsAt.getTime();
  const end = start + Math.max(durationMin, 0) * MS_PER_MINUTE;
  const { year, month, day } = getZonedParts(start, city.timeZone);
  const dawn = zonedTimeToUtc({ year, month, day, minute: DAYLIGHT_START_MINUTE }, city.timeZone).getTime();
  const cutoff = zonedTimeToUtc({ year, month, day, minute: city.daylightCutoffMinute }, city.timeZone).getTime();

  return start >= dawn && start < cutoff && end <= cutoff;
}
