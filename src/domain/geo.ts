// Geografia básica: distância em linha reta e progresso do trajeto. Tudo em metros, exceto onde o
// nome diz `Km`. A posição da pessoa só existe no aparelho (regra de privacidade do plano).

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Raio médio da Terra (IUGG), em metros. */
const EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distância em linha reta (círculo máximo, fórmula de haversine) entre dois pontos, em metros. */
export function getDistanceMeters(from: LatLng, to: LatLng): number {
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLat = toLat - fromLat;
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;
  // o min evita que o arredondamento passe de 1 em pontos opostos da Terra (asin de 1,0000000002 é NaN)
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function getDistanceKm(from: LatLng, to: LatLng): number {
  return getDistanceMeters(from, to) / 1000;
}

/**
 * Quanto do caminho já foi andado, de 0 (saiu agora) a 1 (chegou): o anel do "A caminho".
 * Afastar-se do destino não passa de 0, e quem já saiu praticamente no destino (distância inicial
 * zero ou negativa) conta como chegou.
 */
export function getTripProgress(initialDistanceMeters: number, remainingDistanceMeters: number): number {
  if (initialDistanceMeters <= 0) return 1;
  const progress = 1 - remainingDistanceMeters / initialDistanceMeters;
  return Math.min(1, Math.max(0, progress));
}
