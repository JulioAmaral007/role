import type { TravelMode } from '@/types/ids';

// Dados que ficam no aparelho para o app abrir sem rede e sobreviver a fechar e reabrir
// (docs/ARCHITECTURE.md, seção 7.3). Guardam um **resumo** do lugar, e não só o `id`: assim as telas
// abrem sem consultar o catálogo, que pode estar fora do cache.

/** O mínimo do lugar para o "A caminho" e para as telas offline. */
export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

/** O rolê em andamento ("Bora, tô indo" até "Cheguei!" ou "Mudei de ideia"). */
export interface Trip {
  place: PlaceSummary;
  travelMode: TravelMode;
  /** Quando a pessoa saiu (ISO 8601). */
  departedAt: string;
  /** Distância em linha reta, em metros, da saída até o lugar: a base do anel de progresso. */
  initialDistanceMeters: number;
}

/** A última sugestão vista, para a tela "Sem internet". */
export interface SavedSuggestion {
  place: PlaceSummary & {
    /** Nome do tipo no idioma de quando foi salva ("Mirante"). */
    kindLabel: string;
    /** A foto de capa no Storage, se houver. */
    photoPath: string | null;
  };
  /** Até quando o lugar estava aberto (ISO 8601); `null` se não se sabia. */
  openUntil: string | null;
  /** Quando foi salva (ISO 8601). */
  savedAt: string;
}
