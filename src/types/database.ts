// Tipos do banco, ESCRITOS À MÃO a partir de supabase/sql/001 e 003 (docs/ARCHITECTURE.md, seção 8.2).
// Provisório: o gerador de tipos do dashboard (API → tipos TypeScript, docs/SUPABASE_SETUP.md,
// seção 7) substitui este arquivo se estiver disponível. O formato segue o do gerador para a troca
// ser direta. O teste `database.test.ts` compara este arquivo com o SQL e acusa qualquer divergência.
//
// Regras de leitura: `Row` é o que a API devolve; `Insert` só exige o que é NOT NULL e sem default;
// `Update` é tudo opcional. As funções listadas são só as que o cliente pode chamar (`authenticated`):
// os auxiliares internos da cota (`quota_week_start` etc.) não estão aqui de propósito.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          daylight_cutoff: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string;
          daylight_cutoff?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          timezone?: string;
          daylight_cutoff?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          city_id: string;
          category: Database['public']['Enums']['category'];
          name: string;
          address: string;
          lat: number;
          lng: number;
          price_tier: number;
          typical_spend: number;
          duration_min: number;
          moods: Database['public']['Enums']['mood'][];
          avoid_tags: Database['public']['Enums']['avoid_tag'][];
          outdoor: boolean;
          reservable: boolean;
          reservation_url: string | null;
          photo_paths: string[];
          daylight_only: boolean;
          accessible: boolean;
          pet_friendly: boolean;
          active: boolean;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          city_id: string;
          category: Database['public']['Enums']['category'];
          name: string;
          address: string;
          lat: number;
          lng: number;
          price_tier?: number;
          typical_spend?: number;
          duration_min: number;
          moods?: Database['public']['Enums']['mood'][];
          avoid_tags?: Database['public']['Enums']['avoid_tag'][];
          outdoor?: boolean;
          reservable?: boolean;
          reservation_url?: string | null;
          photo_paths?: string[];
          daylight_only?: boolean;
          accessible?: boolean;
          pet_friendly?: boolean;
          active?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          city_id?: string;
          category?: Database['public']['Enums']['category'];
          name?: string;
          address?: string;
          lat?: number;
          lng?: number;
          price_tier?: number;
          typical_spend?: number;
          duration_min?: number;
          moods?: Database['public']['Enums']['mood'][];
          avoid_tags?: Database['public']['Enums']['avoid_tag'][];
          outdoor?: boolean;
          reservable?: boolean;
          reservation_url?: string | null;
          photo_paths?: string[];
          daylight_only?: boolean;
          accessible?: boolean;
          pet_friendly?: boolean;
          active?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'places_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
      place_translations: {
        Row: {
          place_id: string;
          locale: string;
          kind_label: string;
          reason_mood: string;
          reason_time: string;
          reason_money: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          place_id: string;
          locale: string;
          kind_label: string;
          reason_mood: string;
          reason_time: string;
          reason_money: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          place_id?: string;
          locale?: string;
          kind_label?: string;
          reason_mood?: string;
          reason_time?: string;
          reason_money?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_translations_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      place_hours: {
        Row: {
          id: number;
          place_id: string;
          weekday: number;
          opens: string;
          closes: string;
        };
        Insert: {
          id?: never;
          place_id: string;
          weekday: number;
          opens: string;
          closes: string;
        };
        Update: {
          id?: never;
          place_id?: string;
          weekday?: number;
          opens?: string;
          closes?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_hours_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          locale: string;
          timezone: string;
          plan: string;
          accepted_terms_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          locale?: string;
          timezone?: string;
          plan?: string;
          accepted_terms_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          locale?: string;
          timezone?: string;
          plan?: string;
          accepted_terms_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stamps: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          number: number;
          stamped_at: string;
          mood: Database['public']['Enums']['mood'] | null;
          time_slot: Database['public']['Enums']['time_slot'] | null;
          budget: Database['public']['Enums']['budget'] | null;
          memory: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          place_id: string;
          number: number;
          stamped_at: string;
          mood?: Database['public']['Enums']['mood'] | null;
          time_slot?: Database['public']['Enums']['time_slot'] | null;
          budget?: Database['public']['Enums']['budget'] | null;
          memory?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          place_id?: string;
          number?: number;
          stamped_at?: string;
          mood?: Database['public']['Enums']['mood'] | null;
          time_slot?: Database['public']['Enums']['time_slot'] | null;
          budget?: Database['public']['Enums']['budget'] | null;
          memory?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stamps_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      suggestion_events: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          action: string;
          reason: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          place_id: string;
          action: string;
          reason?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          place_id?: string;
          action?: string;
          reason?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'suggestion_events_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      place_feedback: {
        Row: {
          id: string;
          user_id: string;
          stamp_id: string;
          rating: Database['public']['Enums']['feedback_rating'];
          tags: Database['public']['Enums']['feedback_tag'][];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          stamp_id: string;
          rating: Database['public']['Enums']['feedback_rating'];
          tags?: Database['public']['Enums']['feedback_tag'][];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stamp_id?: string;
          rating?: Database['public']['Enums']['feedback_rating'];
          tags?: Database['public']['Enums']['feedback_tag'][];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_feedback_stamp_id_fkey';
            columns: ['stamp_id'];
            isOneToOne: true;
            referencedRelation: 'stamps';
            referencedColumns: ['id'];
          },
        ];
      };
      place_reports: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          reason: Database['public']['Enums']['report_reason'];
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          place_id: string;
          reason: Database['public']['Enums']['report_reason'];
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          place_id?: string;
          reason?: Database['public']['Enums']['report_reason'];
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'place_reports_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          props: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          user_id?: string;
          name: string;
          props?: Json;
          created_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string;
          name?: string;
          props?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      plus_interest: {
        Row: {
          id: string;
          user_id: string;
          plan_viewed: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          plan_viewed: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_viewed?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // `remaining` é null para Plus (sem limite). O supabase-js devolve um array de uma linha.
      consume_suggestion: {
        Args: { p_place_id: string; p_request_id: string; p_action?: string };
        Returns: { allowed: boolean; remaining: number | null; resets_at: string }[];
      };
      quota_status: {
        Args: Record<PropertyKey, never>;
        Returns: { allowed: boolean; remaining: number | null; resets_at: string }[];
      };
    };
    Enums: {
      category:
        | 'viewpoint'
        | 'used_bookstore'
        | 'short_trail'
        | 'hidden_cafe'
        | 'street_market'
        | 'small_museum'
        | 'street_cinema'
        | 'garden'
        | 'open_studio'
        | 'free_show'
        | 'new_square'
        | 'bookstore'
        | 'neighborhood_bar'
        | 'rooftop'
        | 'library'
        | 'lake';
      mood: 'curious' | 'lazy' | 'romantic' | 'restless' | 'chill' | 'social';
      time_slot: '1h' | '2h' | 'half_day' | 'full_day';
      budget: 'free' | 'up_to_30' | 'up_to_80' | 'any';
      report_reason: 'closed' | 'wrong_info' | 'unsafe' | 'other';
      feedback_rating: 'spot_on' | 'ok' | 'miss';
      feedback_tag:
        | 'calm'
        | 'good_for_talking'
        | 'good_price'
        | 'good_food'
        | 'too_crowded'
        | 'too_far';
      avoid_tag: 'bar' | 'nightclub' | 'long_trail' | 'crowded' | 'mall';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

// Valores dos enums em tempo de execução (o gerador oficial também exporta `Constants`).
export const Constants = {
  public: {
    Enums: {
      category: [
        'viewpoint',
        'used_bookstore',
        'short_trail',
        'hidden_cafe',
        'street_market',
        'small_museum',
        'street_cinema',
        'garden',
        'open_studio',
        'free_show',
        'new_square',
        'bookstore',
        'neighborhood_bar',
        'rooftop',
        'library',
        'lake',
      ],
      mood: ['curious', 'lazy', 'romantic', 'restless', 'chill', 'social'],
      time_slot: ['1h', '2h', 'half_day', 'full_day'],
      budget: ['free', 'up_to_30', 'up_to_80', 'any'],
      report_reason: ['closed', 'wrong_info', 'unsafe', 'other'],
      feedback_rating: ['spot_on', 'ok', 'miss'],
      feedback_tag: [
        'calm',
        'good_for_talking',
        'good_price',
        'good_food',
        'too_crowded',
        'too_far',
      ],
      avoid_tag: ['bar', 'nightclub', 'long_trail', 'crowded', 'mall'],
    },
  },
} as const;
