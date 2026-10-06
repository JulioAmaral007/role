/** O ponto de partida digitado pela pessoa, no lugar da localização do aparelho (D35). */
export interface StartPoint {
  label: string;
  latitude: number;
  longitude: number;
}

/** A distância máxima do Perfil vai de 1 a 20 km, de 1 em 1. */
export const MIN_MAX_DISTANCE_KM = 1;
export const MAX_MAX_DISTANCE_KM = 20;

/** Tamanho máximo do nome opcional do Perfil (D37). Premissa do loop, a confirmar na Fase 11. */
export const MAX_PROFILE_NAME_LENGTH = 30;
