import { getDistanceMeters, type LatLng } from './geo';

// Regra do "Cheguei!" (D6): o carimbo só vale no lugar. Confere a posição atual do aparelho contra a
// do lugar, com um raio e a tolerância da precisão que o GPS informa. Roda só no aparelho: a posição
// nunca vai para o servidor, só o resultado.

/** Raio em volta do lugar em que a pessoa conta como "lá" (D6). */
export const CHECK_IN_RADIUS_METERS = 150;

/**
 * Precisão acima da qual a leitura não é confiável (posição por antena de celular ou Wi-Fi, por
 * exemplo): nesse caso a conferência pede para tentar de novo em vez de carimbar. **Premissa do
 * loop, a confirmar no 👀 do MVP.**
 */
export const MAX_USABLE_ACCURACY_METERS = 100;

export interface CheckInPosition extends LatLng {
  /** Raio de incerteza informado pelo GPS, em metros; `null` ou ausente quando o aparelho não diz. */
  accuracyMeters?: number | null;
}

/**
 * - `inside`: dentro do raio, contando a incerteza do GPS (a posição verdadeira pode estar no raio);
 * - `outside`: fora do raio mesmo na melhor das hipóteses;
 * - `uncertain`: pode estar dentro, mas a precisão é ruim demais para confiar; tentar de novo.
 */
export type CheckInStatus = 'inside' | 'outside' | 'uncertain';

export interface CheckInResult {
  status: CheckInStatus;
  /** Distância em linha reta até o lugar, em metros. */
  distanceMeters: number;
}

/** A pessoa está no lugar? Precisão ausente, negativa ou inválida vale como GPS perfeito (0 m). */
export function checkIn(
  position: CheckInPosition,
  place: LatLng,
  radiusMeters: number = CHECK_IN_RADIUS_METERS,
): CheckInResult {
  const distanceMeters = getDistanceMeters(position, place);
  const reported = position.accuracyMeters;
  const accuracyMeters = typeof reported === 'number' && reported > 0 ? reported : 0;

  // a posição verdadeira está em algum ponto a até `accuracyMeters` da informada
  const mayBeInside = distanceMeters - accuracyMeters <= radiusMeters;
  if (!mayBeInside) return { status: 'outside', distanceMeters };
  if (accuracyMeters > MAX_USABLE_ACCURACY_METERS) return { status: 'uncertain', distanceMeters };
  return { status: 'inside', distanceMeters };
}
