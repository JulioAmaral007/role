import {
  formatCurrency,
  formatDate,
  formatDistance,
  formatStampDate,
  formatWeekdayShort,
} from './format';
import { LOCALES } from '@/types/language';

const SAO_PAULO = 'America/Sao_Paulo';
const TOKYO = 'Asia/Tokyo';
// 2026-10-02T15:00Z: sexta-feira em São Paulo (12h) e já sábado, dia 03, em Tóquio (00h).
const FRIDAY_NOON_SP = new Date(Date.UTC(2026, 9, 2, 15, 0));
// 2026-10-03T02:30Z: ainda dia 02 às 23h30 em São Paulo, mas já dia 03 em UTC.
const SP_LATE_NIGHT = new Date(Date.UTC(2026, 9, 3, 2, 30));

// O Intl separa valor e símbolo com espaço não separável; normalizar deixa o teste legível.
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('formatStampDate', () => {
  it('builds "DD · MM · YYYY" with two-digit day and month', () => {
    expect(formatStampDate(FRIDAY_NOON_SP, SAO_PAULO)).toBe('02 · 10 · 2026');
    expect(formatStampDate(new Date(Date.UTC(2026, 0, 5, 12)), SAO_PAULO)).toBe('05 · 01 · 2026');
  });

  it('uses the given time zone at the day boundary', () => {
    expect(formatStampDate(SP_LATE_NIGHT, SAO_PAULO)).toBe('02 · 10 · 2026');
    expect(formatStampDate(SP_LATE_NIGHT, 'UTC')).toBe('03 · 10 · 2026');
    expect(formatStampDate(FRIDAY_NOON_SP, TOKYO)).toBe('03 · 10 · 2026');
  });

  it('crosses the year boundary by time zone', () => {
    const newYearUtc = new Date(Date.UTC(2027, 0, 1, 1, 0));
    expect(formatStampDate(newYearUtc, SAO_PAULO)).toBe('31 · 12 · 2026');
    expect(formatStampDate(newYearUtc, 'UTC')).toBe('01 · 01 · 2027');
  });
});

describe('formatWeekdayShort', () => {
  it('formats weekday, day and month in each language', () => {
    expect(formatWeekdayShort(FRIDAY_NOON_SP, 'pt-BR', SAO_PAULO)).toBe('SEX · 02 OUT');
    expect(formatWeekdayShort(FRIDAY_NOON_SP, 'en', SAO_PAULO)).toBe('FRI · 02 OCT');
    expect(formatWeekdayShort(FRIDAY_NOON_SP, 'es', SAO_PAULO)).toBe('VIE · 02 OCT');
  });

  it('follows the time zone for weekday and day together', () => {
    expect(formatWeekdayShort(SP_LATE_NIGHT, 'pt-BR', SAO_PAULO)).toBe('SEX · 02 OUT');
    expect(formatWeekdayShort(SP_LATE_NIGHT, 'pt-BR', 'UTC')).toBe('SÁB · 03 OUT');
  });

  it('never leaves the trailing dot of abbreviations', () => {
    for (const locale of LOCALES) {
      expect(formatWeekdayShort(FRIDAY_NOON_SP, locale, SAO_PAULO)).not.toContain('.');
    }
  });
});

describe('formatDate', () => {
  it('writes the day and the full month name', () => {
    expect(formatDate(FRIDAY_NOON_SP, 'pt-BR', SAO_PAULO)).toBe('2 de outubro');
    expect(formatDate(FRIDAY_NOON_SP, 'en', SAO_PAULO)).toBe('October 2');
    expect(formatDate(FRIDAY_NOON_SP, 'es', SAO_PAULO)).toBe('2 de octubre');
  });

  it('uses the time zone', () => {
    expect(formatDate(SP_LATE_NIGHT, 'pt-BR', 'UTC')).toBe('3 de outubro');
  });
});

describe('formatCurrency', () => {
  it('always uses BRL and only the format follows the language', () => {
    expect(plain(formatCurrency(30, 'pt-BR'))).toBe('R$ 30,00');
    expect(plain(formatCurrency(1234.5, 'pt-BR'))).toBe('R$ 1.234,50');
    expect(plain(formatCurrency(30, 'en'))).toBe('R$30.00');
    expect(plain(formatCurrency(1234.5, 'en'))).toBe('R$1,234.50');
    expect(plain(formatCurrency(0, 'es'))).toBe('R$ 0,00');
    expect(plain(formatCurrency(1234.5, 'es'))).toBe('R$ 1234,50');
  });
});

describe('formatDistance', () => {
  it('shows meters below 1 km', () => {
    expect(formatDistance(350, 'pt-BR')).toBe('350 m');
    expect(formatDistance(0, 'en')).toBe('0 m');
    expect(formatDistance(999.4, 'pt-BR')).toBe('999 m');
  });

  it('shows one decimal in km from 1 km on, with the decimal separator of the language', () => {
    expect(formatDistance(1800, 'pt-BR')).toBe('1,8 km');
    expect(formatDistance(1800, 'en')).toBe('1.8 km');
    expect(formatDistance(1800, 'es')).toBe('1,8 km');
    expect(formatDistance(1000, 'pt-BR')).toBe('1,0 km');
    expect(formatDistance(12_340, 'pt-BR')).toBe('12,3 km');
  });

  it('rounds to meters first, so 999.6 m becomes 1,0 km and not "1000 m"', () => {
    expect(formatDistance(999.6, 'pt-BR')).toBe('1,0 km');
  });

  it('does not go below zero', () => {
    expect(formatDistance(-5, 'pt-BR')).toBe('0 m');
  });
});
