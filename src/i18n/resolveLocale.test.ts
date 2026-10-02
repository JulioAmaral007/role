import { resolveLocale } from './resolveLocale';

const device = (...codes: (string | null)[]) => codes.map((languageCode) => ({ languageCode }));

describe('resolveLocale', () => {
  it('maps every Portuguese variant to pt-BR', () => {
    expect(resolveLocale('system', device('pt'))).toBe('pt-BR');
  });

  it('keeps English and Spanish regardless of region', () => {
    expect(resolveLocale('system', device('en'))).toBe('en');
    expect(resolveLocale('system', device('es'))).toBe('es');
  });

  it('falls back to pt-BR for unsupported languages', () => {
    expect(resolveLocale('system', device('fr'))).toBe('pt-BR');
  });

  it('falls back to pt-BR when the device reports nothing usable', () => {
    expect(resolveLocale('system', [])).toBe('pt-BR');
    expect(resolveLocale('system', device(null))).toBe('pt-BR');
  });

  it('uses the first supported language in the device preference order', () => {
    expect(resolveLocale('system', device('fr', 'es', 'en'))).toBe('es');
  });

  it('is case insensitive on the language code', () => {
    expect(resolveLocale('system', device('EN'))).toBe('en');
  });

  it('lets the saved choice win over the device', () => {
    expect(resolveLocale('es', device('en'))).toBe('es');
    expect(resolveLocale('pt-BR', device('en'))).toBe('pt-BR');
    expect(resolveLocale('en', [])).toBe('en');
  });
});
