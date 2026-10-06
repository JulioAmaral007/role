import { Constants } from '@/types/database';
import type { Category } from '@/types/ids';
import type { Place } from '@/types/place';
import type { Stamp } from '@/types/stamp';

// Bingo da cidade: uma grade com as 16 categorias; a célula fica marcada quando existe pelo menos
// 1 carimbo de um lugar daquela categoria. A categoria vem do lugar (o carimbo só guarda o
// `placeId`), então o catálogo precisa incluir os lugares já carimbados, mesmo os desativados
// (a RLS libera esses). Carimbo de um lugar que não está na lista não marca nada.

/** As 16 categorias, na ordem da grade 4×4 do protótipo (a do enum do banco). */
export const BINGO_CATEGORIES: readonly Category[] = Constants.public.Enums.category;

export interface BingoCell {
  category: Category;
  stamped: boolean;
  /** Quantos carimbos a categoria tem. */
  stampCount: number;
  /** Os carimbos da categoria, na ordem em que vieram, para o detalhe ao tocar na célula. */
  stampIds: string[];
}

export interface Bingo {
  cells: BingoCell[];
  /** Quantas categorias já têm carimbo ("7 de 16"). */
  stampedCount: number;
  total: number;
  /** As 16 marcadas. */
  isComplete: boolean;
}

export function getBingo(
  stamps: readonly Pick<Stamp, 'id' | 'placeId'>[],
  places: readonly Pick<Place, 'id' | 'category'>[],
): Bingo {
  const categoryByPlace = new Map<string, Category>();
  for (const place of places) categoryByPlace.set(place.id, place.category);

  const stampIdsByCategory = new Map<Category, string[]>();
  for (const stamp of stamps) {
    const category = categoryByPlace.get(stamp.placeId);
    if (!category) continue;
    const ids = stampIdsByCategory.get(category);
    if (ids) ids.push(stamp.id);
    else stampIdsByCategory.set(category, [stamp.id]);
  }

  const cells = BINGO_CATEGORIES.map((category): BingoCell => {
    const stampIds = stampIdsByCategory.get(category) ?? [];
    return { category, stamped: stampIds.length > 0, stampCount: stampIds.length, stampIds };
  });
  const stampedCount = cells.filter((cell) => cell.stamped).length;

  return { cells, stampedCount, total: cells.length, isComplete: stampedCount === cells.length };
}
