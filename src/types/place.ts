import type { AvoidTag, Category, Mood } from '@/types/ids';

// Tipos de domínio do catálogo (docs/ARCHITECTURE.md, seção 8.9): o service converte a linha do
// banco (`snake_case`, `database.ts`) nestes tipos (`camelCase`) e nada acima de `services/`
// conhece o formato do Supabase. Instante é sempre string ISO 8601, para sobreviver ao cache
// persistido e à fila offline (JSON).

/** Faixa de preço do catálogo: 0 = de graça ... 3 = caro (`places.price_tier`). */
export type PriceTier = 0 | 1 | 2 | 3;

/** Uma faixa de funcionamento. Um lugar pode ter mais de uma por dia (almoço e jantar). */
export interface PlaceHours {
  /** 0 = domingo ... 6 = sábado, igual ao `getDay()` do JavaScript. */
  weekday: number;
  /** Minutos desde a meia-noite, no fuso da cidade (18:00 = 1080). */
  opensMinute: number;
  /**
   * Minutos desde a meia-noite. Igual ou menor que `opensMinute` quer dizer que a faixa vira a
   * meia-noite e termina no dia seguinte (18:00 → 02:00).
   */
  closesMinute: number;
}

/** Textos do lugar já no idioma ativo (com o idioma base como reserva). */
export interface PlaceText {
  /** Nome do tipo ("Mirante", "Sebo"). */
  kindLabel: string;
  reasonMood: string;
  reasonTime: string;
  reasonMoney: string;
}

export interface City {
  id: string;
  name: string;
  /** Nome IANA (`America/Sao_Paulo`): fuso do horário de funcionamento e do `daylightCutoffMinute`. */
  timeZone: string;
  /** Depois deste horário (minutos desde a meia-noite) somem os lugares `daylightOnly` (D19). */
  daylightCutoffMinute: number;
}

/** Lugar do catálogo, com a tradução e os horários já resolvidos. */
export interface Place {
  id: string;
  cityId: string;
  category: Category;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  priceTier: PriceTier;
  /** Gasto típico em reais ("Gasto ~R$24"); sempre BRL (D10). */
  typicalSpend: number;
  durationMin: number;
  moods: Mood[];
  avoidTags: AvoidTag[];
  outdoor: boolean;
  reservable: boolean;
  reservationUrl: string | null;
  /** Caminhos das fotos no Storage; a primeira é a capa. */
  photoPaths: string[];
  daylightOnly: boolean;
  accessible: boolean;
  petFriendly: boolean;
  active: boolean;
  /** Quando a curadoria conferiu o lugar pela última vez (ISO 8601). */
  verifiedAt: string | null;
  text: PlaceText;
  hours: PlaceHours[];
}
