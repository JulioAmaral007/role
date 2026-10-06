// Chaves das consultas do React Query, num lugar só (docs/ARCHITECTURE.md, seção 7.6). Cada chave é
// uma função que devolve uma tupla, então o prefixo (`['places', cityId]`) serve para invalidar ou
// remover um grupo de consultas.
export const queryKeys = {
  cities: () => ['cities'] as const,
  /** O catálogo da cidade num idioma; trocar de idioma cria outra entrada (ADR 9.3). */
  places: (cityId: string, locale: string) => ['places', cityId, locale] as const,
  /** O prefixo de todos os idiomas de um catálogo. */
  placesOfCity: (cityId: string) => ['places', cityId] as const,
};
