import { TRAVEL_MODES, type TravelMode } from '@/types/ids';

// Tempo estimado de trajeto por modo (D33): distância em linha reta × fator de rota, dividida pela
// velocidade média do modo, mais a espera do ônibus. É uma **estimativa local** para decidir e para
// mostrar no Detalhe do lugar; "Abrir no mapa" dá a rota real, e uma API de rotas só entra no pós-MVP.
//
// **Premissas do loop para o usuário conferir no 👀 do MVP** (todas constantes exportadas): fator de
// rota 1,3, velocidades médias de porta a porta e 8 minutos de espera de ônibus.

/** Quanto o caminho pelas ruas é mais longo que a linha reta, em média numa cidade. */
export const ROUTE_FACTOR = 1.3;

/** Velocidade média de cada modo, em km/h (a pé: passo normal; ônibus: em movimento, com paradas; carro: trânsito urbano). */
export const TRAVEL_SPEED_KMH: Record<TravelMode, number> = {
  walk: 5,
  bus: 18,
  car: 25,
};

/** Espera média pelo ônibus, somada ao tempo dentro dele. */
export const BUS_WAIT_MINUTES = 8;

/** Evita que erro de ponto flutuante (78,00000000000001) arredonde um minuto a mais. */
const EPSILON = 1e-9;

/**
 * Minutos estimados para ir `distanceKm` (em linha reta) no modo dado, arredondados para cima.
 * Distância zero, negativa ou inválida vale 0 (a pessoa já está lá, sem espera de ônibus); qualquer
 * distância positiva leva pelo menos 1 minuto.
 */
export function estimateTravelMinutes(distanceKm: number, mode: TravelMode): number {
  if (!(distanceKm > 0)) return 0;
  const rideMinutes = ((distanceKm * ROUTE_FACTOR) / TRAVEL_SPEED_KMH[mode]) * 60;
  const waitMinutes = mode === 'bus' ? BUS_WAIT_MINUTES : 0;
  return Math.max(1, Math.ceil(rideMinutes + waitMinutes - EPSILON));
}

/** O tempo nos três modos, para o Detalhe do lugar mostrar "A pé / Ônibus / Carro". */
export function estimateTravelMinutesByMode(distanceKm: number): Record<TravelMode, number> {
  const result = {} as Record<TravelMode, number>;
  for (const mode of TRAVEL_MODES) {
    result[mode] = estimateTravelMinutes(distanceKm, mode);
  }
  return result;
}
