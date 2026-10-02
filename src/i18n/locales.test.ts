import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

// Paridade entre idiomas (docs/ARCHITECTURE.md, seção 10.9). O pt-BR é a base: o que existe nele
// tem que existir nos outros, e vice-versa.

type Tree = { [key: string]: string | Tree };

const LOCALES: Record<string, Tree> = { 'pt-BR': ptBR, en, es };
const OTHER_LOCALES = ['en', 'es'] as const;

const PLURAL_SUFFIX = /_(?:ordinal_)?(?:zero|one|two|few|many|other)$/;
const OTHER_SUFFIX = /_(?:ordinal_)?other$/;

function flatten(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[prefix + key, value] as [string, string]] : flatten(value, `${prefix}${key}.`),
  );
}

/** Chave sem o sufixo de plural/ordinal, porque pt-BR, en e es não têm as mesmas categorias. */
const baseKey = (key: string) => key.replace(PLURAL_SUFFIX, '');

const placeholders = (text: string) => [...new Set(text.match(/\{\{\s*\w+\s*\}\}/g) ?? [])].sort();

const entries = Object.fromEntries(
  Object.entries(LOCALES).map(([locale, tree]) => [locale, flatten(tree)]),
);

/** Para cada chave-base, os placeholders de todas as formas de plural juntos. */
function placeholdersByBaseKey(locale: string): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {};
  for (const [key, value] of entries[locale]) {
    const set = (grouped[baseKey(key)] ??= new Set());
    placeholders(value).forEach((placeholder) => set.add(placeholder));
  }
  return Object.fromEntries(Object.entries(grouped).map(([key, set]) => [key, [...set].sort()]));
}

const baseKeys = (locale: string) => [...new Set(entries[locale].map(([key]) => baseKey(key)))].sort();

describe('locale files', () => {
  it.each(OTHER_LOCALES)('%s has exactly the same keys as pt-BR (ignoring plural suffixes)', (locale) => {
    expect(baseKeys(locale)).toEqual(baseKeys('pt-BR'));
  });

  it.each(OTHER_LOCALES)('%s uses the same placeholders as pt-BR for every key', (locale) => {
    expect(placeholdersByBaseKey(locale)).toEqual(placeholdersByBaseKey('pt-BR'));
  });

  it.each(Object.keys(LOCALES))('%s has no empty value', (locale) => {
    const empty = entries[locale].filter(([, value]) => value.trim() === '').map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it.each(Object.keys(LOCALES))('%s defines _other for every plural and ordinal key', (locale) => {
    const keys = entries[locale].map(([key]) => key);
    const missing = [...new Set(keys.filter((key) => PLURAL_SUFFIX.test(key)).map(baseKey))].flatMap(
      (base) => {
        const forms = keys.filter((key) => baseKey(key) === base);
        const hasOrdinal = forms.some((key) => key.includes('_ordinal_'));
        const hasCardinal = forms.some((key) => !key.includes('_ordinal_'));
        return [
          ...(hasCardinal && !forms.some((key) => key === `${base}_other`) ? [`${base}_other`] : []),
          ...(hasOrdinal && !forms.some((key) => key === `${base}_ordinal_other`)
            ? [`${base}_ordinal_other`]
            : []),
        ];
      },
    );
    expect(missing).toEqual([]);
  });

  it('writes plural keys with {{count}} in every language', () => {
    for (const locale of Object.keys(LOCALES)) {
      const withoutCount = entries[locale]
        .filter(([key]) => OTHER_SUFFIX.test(key))
        .filter(([, value]) => !placeholders(value).includes('{{count}}'))
        .map(([key]) => key);
      expect(withoutCount).toEqual([]);
    }
  });

  it('keeps the product name untranslated', () => {
    for (const tree of Object.values(LOCALES)) {
      expect(flatten(tree).find(([key]) => key === 'app.name')?.[1]).toBe('Rolê Aleatório');
    }
  });
});
