import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/lib/queryKeys';
import { removePlacesOfOtherLocales } from '@/lib/queryClient';
import { placesRepository, type PlacesRepository } from '@/services/places';
import type { Locale } from '@/types/language';

// O catálogo muda pouco: vale 6 horas (ADR 9.3) e é persistido para o app abrir offline.
export const PLACES_STALE_TIME_MS = 6 * 60 * 60 * 1000;

/** As cidades do catálogo. O repositório é injetável para testar sem rede. */
export function useCities(repository: PlacesRepository = placesRepository) {
  return useQuery({
    queryKey: queryKeys.cities(),
    queryFn: () => repository.listCities(),
    staleTime: PLACES_STALE_TIME_MS,
    meta: { persist: true },
  });
}

/**
 * O catálogo da cidade (cidade + lugares com tradução e horários) no idioma pedido. Fica parado
 * enquanto não há `cityId`. Trocar de idioma busca outro catálogo e descarta o dos outros idiomas.
 */
export function usePlaces(
  cityId: string | undefined,
  locale: Locale,
  repository: PlacesRepository = placesRepository,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cityId) removePlacesOfOtherLocales(queryClient, cityId, locale);
  }, [queryClient, cityId, locale]);

  return useQuery({
    queryKey: queryKeys.places(cityId ?? '', locale),
    queryFn: cityId ? () => repository.getCatalog(cityId, locale) : skipToken,
    staleTime: PLACES_STALE_TIME_MS,
    meta: { persist: true },
  });
}
