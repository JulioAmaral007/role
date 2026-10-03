// Matemática do controle deslizante (Perfil: "Distância máxima", de 1 a 20 km). Funções puras, sem
// React: o `Slider` só converte o toque em posição e usa estas contas.

/** Remove o ruído de ponto flutuante (0.1 + 0.2) sem alterar valores de passo normais. */
function tidy(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** Valor mais próximo de `value` que cai num passo (`min + n × step`) e dentro de `[min, max]`. */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  if (max <= min) return min;
  if (step <= 0) return Math.min(Math.max(value, min), max);
  const steps = Math.round((value - min) / step);
  const snapped = tidy(min + steps * step);
  return Math.min(Math.max(snapped, min), max);
}

/** Posição do valor no trilho, de 0 a 1. */
export function valueToFraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

/**
 * Valor de um toque a `position` pontos do início do trilho útil (o que sobra depois de descontar
 * o círculo), já ajustado ao passo. Fora do trilho, vale a ponta.
 */
export function positionToValue(
  position: number,
  trackWidth: number,
  min: number,
  max: number,
  step: number,
): number {
  if (trackWidth <= 0) return min;
  const fraction = Math.min(Math.max(position / trackWidth, 0), 1);
  return snapToStep(min + fraction * (max - min), min, max, step);
}
