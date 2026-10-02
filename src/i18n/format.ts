import type { Locale } from './types';

// Funções puras: recebem o idioma (e o fuso) em vez de ler estado global. Regras do Hermes em
// docs/ARCHITECTURE.md, seção 10.5: nada de formatToParts, RelativeTimeFormat, ListFormat,
// style: 'unit', signDisplay ou notação compacta.

// `js-hoist-intl`: criar um Intl.* é caro, então cada formatador é criado uma vez e reaproveitado.
const dateTimeFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();

function getDateTimeFormat(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let format = dateTimeFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    dateTimeFormats.set(key, format);
  }
  return format;
}

function getNumberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, format);
  }
  return format;
}

// Espaço não separável: o "R$" não fica sozinho no fim de uma linha.
const NBSP = String.fromCharCode(160);

interface CalendarDay {
  day: string;
  month: string;
  year: string;
}

/**
 * Dia, mês e ano de um instante no fuso dado, sem `formatToParts` (seção 13.5, opção a):
 * formata em `en-US` ("10/02/2026") e separa os números. O `en-US` tem formato estável.
 */
function getCalendarDay(date: Date, timeZone: string): CalendarDay {
  const text = getDateTimeFormat('en-US', timeZone, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const match = /(\d+)\D+(\d+)\D+(\d+)/.exec(text);
  if (!match) throw new Error(`Unexpected date format: ${text}`);
  return { month: match[1], day: match[2], year: match[3] };
}

/** Data do carimbo: "02 · 10 · 2026". Montada à mão, igual em qualquer aparelho e idioma. */
export function formatStampDate(date: Date, timeZone: string): string {
  const { day, month, year } = getCalendarDay(date, timeZone);
  return `${day} · ${month} · ${year}`;
}

function toShortLabel(text: string, locale: Locale): string {
  return text.replace(/\.$/, '').toLocaleUpperCase(locale);
}

/** Dia da semana e mês curtos, em caixa alta: "SEX · 02 OUT". */
export function formatWeekdayShort(date: Date, locale: Locale, timeZone: string): string {
  const weekday = getDateTimeFormat(locale, timeZone, { weekday: 'short' }).format(date);
  const month = getDateTimeFormat(locale, timeZone, { month: 'short' }).format(date);
  const { day } = getCalendarDay(date, timeZone);
  return `${toShortLabel(weekday, locale)} · ${day} ${toShortLabel(month, locale)}`;
}

/** Data por extenso, sem ano: "2 de outubro" / "October 2" / "2 de octubre". */
export function formatDate(date: Date, locale: Locale, timeZone: string): string {
  return getDateTimeFormat(locale, timeZone, { day: 'numeric', month: 'long' }).format(date);
}

/**
 * Valor em reais: "R$ 30,00" (pt-BR e es) / "R$30.00" (en). A moeda é sempre BRL (D10) e o símbolo
 * é "R$" nos três idiomas, como no resto do app. Só o número passa pelo Intl: o `style: 'currency'`
 * do espanhol escreve "BRL" no lugar do símbolo, e `currencyDisplay: 'narrowSymbol'` não é
 * garantido no Hermes.
 */
export function formatCurrency(value: number, locale: Locale): string {
  const amount = getNumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return locale === 'en' ? `R$${amount}` : `R$${NBSP}${amount}`;
}

/** Distância: "350 m" abaixo de 1 km; a partir daí "1,8 km" / "1.8 km". */
export function formatDistance(meters: number, locale: Locale): string {
  const rounded = Math.round(Math.max(0, meters));
  if (rounded < 1000) {
    return `${getNumberFormat(locale, { maximumFractionDigits: 0 }).format(rounded)} m`;
  }
  const km = getNumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${km.format(rounded / 1000)} km`;
}
