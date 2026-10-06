import type { Locale } from '@/types/language';
import type { Catalog, City } from '@/types/place';

// Contrato do catálogo (docs/ARCHITECTURE.md, seções 8.9 e 9.3). Quem usa recebe esta interface e
// nunca o client do Supabase, o que permite testar sem rede. Todos os erros saem como `AppError`
// (`network`, `rateLimited`, `unauthorized` ou `unknown`).
export interface PlacesRepository {
  /** As cidades do catálogo (no MVP, uma só). */
  listCities(): Promise<City[]>;

  /**
   * A cidade e os lugares dela, com a tradução no idioma pedido (o idioma base, pt-BR, quando o
   * lugar não tem esse) e os horários resolvidos. Traz os lugares que a RLS libera: os ativos e os
   * inativos que a pessoa já carimbou; quem decide o que sugerir é o `domain/`.
   */
  getCatalog(cityId: string, locale: Locale): Promise<Catalog>;
}
