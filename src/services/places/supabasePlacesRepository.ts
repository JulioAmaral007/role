import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import { DEFAULT_LOCALE, type Locale } from '@/types/language';
import type { Catalog, City } from '@/types/place';
import { AppError } from '@/utils/appError';

import { toPostgrestAppError } from '../postgrestError';
import { toCity, toPlaces } from './placesMapper';
import type { PlacesRepository } from './placesRepository';

// O client entra pelo construtor (a composição está em `index.ts`): este arquivo não importa o
// `lib/supabase`, então roda em qualquer ambiente, inclusive nos testes de integração do banco.
type PlacesClient = Pick<SupabaseClient<Database>, 'from'>;

/**
 * O PostgREST devolve no máximo 1000 linhas por consulta (o padrão do Supabase). O catálogo do MVP
 * tem poucas centenas; passar disso pede paginação ou a RPC com PostGIS (D16).
 */
const MAX_PLACES = 1000;

export class SupabasePlacesRepository implements PlacesRepository {
  private readonly client: PlacesClient;

  constructor(client: PlacesClient) {
    this.client = client;
  }

  async listCities(): Promise<City[]> {
    const { data, error, status } = await this.client.from('cities').select('*').order('name');
    if (error) throw toPostgrestAppError(error, status);
    return data.map(toCity);
  }

  async getCatalog(cityId: string, locale: Locale): Promise<Catalog> {
    const [cityResult, placesResult] = await Promise.all([
      this.client.from('cities').select('*').eq('id', cityId).maybeSingle(),
      // Uma consulta só, com as traduções e os horários embutidos (as chaves estrangeiras estão em
      // `database.ts`). O filtro em `place_translations.locale` vale só para as linhas embutidas:
      // traz o idioma pedido e o base (a reserva); lugar sem nenhuma das duas fica sem texto e o
      // mapper o descarta.
      this.client
        .from('places')
        .select('*, place_translations(*), place_hours(*)')
        .eq('city_id', cityId)
        .in('place_translations.locale', [...new Set([locale, DEFAULT_LOCALE])])
        .order('id')
        .range(0, MAX_PLACES - 1),
    ]);

    if (cityResult.error) throw toPostgrestAppError(cityResult.error, cityResult.status);
    if (placesResult.error) throw toPostgrestAppError(placesResult.error, placesResult.status);
    if (!cityResult.data) throw new AppError('unknown', `City ${cityId} not found`);

    return { city: toCity(cityResult.data), places: toPlaces(placesResult.data, locale) };
  }
}
