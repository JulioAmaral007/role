import type { Locale } from '@/types/language';
import type { Catalog, City } from '@/types/place';
import { AppError } from '@/utils/appError';

import type { PlacesRepository } from './placesRepository';

/**
 * Repositório para testes: devolve catálogos prontos, sem rede. O idioma é ignorado (os lugares já
 * vêm com o texto). `failWith` faz as próximas chamadas falharem, para testar offline e erro.
 */
export class InMemoryPlacesRepository implements PlacesRepository {
  /** Quantas vezes `getCatalog` foi chamado (para conferir cache e pedidos repetidos). */
  catalogCalls = 0;
  private readonly catalogs: readonly Catalog[];
  private failure: AppError | null = null;

  constructor(catalogs: readonly Catalog[] = []) {
    this.catalogs = catalogs;
  }

  /** As chamadas seguintes lançam este erro até `failWith(null)`. */
  failWith(error: AppError | null): void {
    this.failure = error;
  }

  listCities(): Promise<City[]> {
    if (this.failure) return Promise.reject(this.failure);
    return Promise.resolve(this.catalogs.map(({ city }) => city));
  }

  getCatalog(cityId: string, _locale: Locale): Promise<Catalog> {
    this.catalogCalls += 1;
    if (this.failure) return Promise.reject(this.failure);
    const catalog = this.catalogs.find(({ city }) => city.id === cityId);
    if (!catalog) return Promise.reject(new AppError('unknown', `City ${cityId} not found`));
    return Promise.resolve({ city: catalog.city, places: [...catalog.places] });
  }
}
