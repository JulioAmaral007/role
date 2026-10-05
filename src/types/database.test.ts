import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Constants, type Database, type Enums } from './database';

// O `database.ts` é escrito à mão (docs/ARCHITECTURE.md, seção 8.2). Este teste o compara com o
// SQL versionado, para qualquer divergência aparecer no `npx jest` e não só no `test:db`.

const SQL_DIR = path.join(__dirname, '../../supabase/sql');

function readSql(file: string): string {
  // sem comentários de linha, que podem citar nomes de tabelas e colunas
  return readFileSync(path.join(SQL_DIR, file), 'utf8').replace(/--.*$/gm, '');
}

function parseEnums(sql: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const match of sql.matchAll(/create type public\.(\w+) as enum \(([^)]*)\)/g)) {
    result[match[1]] = [...match[2].matchAll(/'([^']+)'/g)].map((value) => value[1]);
  }
  return result;
}

const NOT_COLUMNS = new Set(['constraint', 'primary', 'unique', 'check', 'foreign']);

function parseTables(sql: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const match of sql.matchAll(/create table if not exists public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    const columns: string[] = [];
    for (const line of match[2].split('\n')) {
      const column = /^ {2}([a-z_]+)\s+\S/.exec(line)?.[1];
      if (column && !NOT_COLUMNS.has(column)) columns.push(column);
    }
    result[match[1]] = columns;
  }
  return result;
}

// Lista exaustiva das colunas de `Row` por tabela: o TypeScript acusa coluna que falta ou que sobra.
type TableName = keyof Database['public']['Tables'];
type RowColumns = {
  [T in TableName]: { [K in keyof Database['public']['Tables'][T]['Row']]: true };
};

const ROW_COLUMNS: RowColumns = {
  cities: { id: true, name: true, timezone: true, daylight_cutoff: true, created_at: true, updated_at: true },
  places: {
    id: true, city_id: true, category: true, name: true, address: true, lat: true, lng: true,
    price_tier: true, typical_spend: true, duration_min: true, moods: true, avoid_tags: true,
    outdoor: true, reservable: true, reservation_url: true, photo_paths: true, daylight_only: true,
    accessible: true, pet_friendly: true, active: true, verified_at: true, created_at: true,
    updated_at: true,
  },
  place_translations: {
    place_id: true, locale: true, kind_label: true, reason_mood: true, reason_time: true,
    reason_money: true, created_at: true, updated_at: true,
  },
  place_hours: { id: true, place_id: true, weekday: true, opens: true, closes: true },
  profiles: {
    id: true, locale: true, timezone: true, plan: true, accepted_terms_at: true, created_at: true,
    updated_at: true,
  },
  stamps: {
    id: true, user_id: true, place_id: true, number: true, stamped_at: true, mood: true,
    time_slot: true, budget: true, memory: true, created_at: true,
  },
  suggestion_events: {
    id: true, user_id: true, place_id: true, action: true, reason: true, request_id: true,
    created_at: true,
  },
  place_feedback: { id: true, user_id: true, stamp_id: true, rating: true, tags: true, created_at: true },
  place_reports: { id: true, user_id: true, place_id: true, reason: true, note: true, created_at: true },
  events: { id: true, user_id: true, name: true, props: true, created_at: true },
  plus_interest: { id: true, user_id: true, plan_viewed: true, created_at: true },
};

describe('database.ts matches the SQL scripts', () => {
  const schemaSql = readSql('001_initial_schema.sql');

  it('has exactly the enums of 001, with the same values in the same order', () => {
    expect(Constants.public.Enums).toEqual(parseEnums(schemaSql));
  });

  it('has a runtime constant for each enum value union (checked by the compiler)', () => {
    const constants: { [K in keyof Database['public']['Enums']]: readonly Enums<K>[] } =
      Constants.public.Enums;
    expect(Object.keys(constants)).toHaveLength(8);
  });

  it('has exactly the tables of 001', () => {
    expect(Object.keys(ROW_COLUMNS).sort()).toEqual(Object.keys(parseTables(schemaSql)).sort());
  });

  it.each(Object.keys(ROW_COLUMNS) as TableName[])('has the same columns as the SQL for %s', (table) => {
    expect(Object.keys(ROW_COLUMNS[table]).sort()).toEqual([...parseTables(schemaSql)[table]].sort());
  });

  it('declares the quota RPCs with the parameters of 003', () => {
    const quotaSql = readSql('003_quota.sql');
    expect(quotaSql).toMatch(/function public\.consume_suggestion\(\s*p_place_id\s+uuid,\s*p_request_id\s+uuid,\s*p_action\s+text default 'shown'\s*\)/);
    expect(quotaSql).toMatch(/function public\.quota_status\(\)/);
    expect(quotaSql).toMatch(/returns table \(allowed boolean, remaining integer, resets_at timestamptz\)/);

    // compile-time: os argumentos e o retorno usados pelo app
    const args: Database['public']['Functions']['consume_suggestion']['Args'] = {
      p_place_id: 'a',
      p_request_id: 'b',
    };
    const row: Database['public']['Functions']['quota_status']['Returns'][number] = {
      allowed: true,
      remaining: null,
      resets_at: '2026-10-12T03:00:00Z',
    };
    expect(args.p_action).toBeUndefined();
    expect(row.remaining).toBeNull();
  });
});
