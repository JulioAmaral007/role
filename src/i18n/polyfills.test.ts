/* eslint-disable @typescript-eslint/no-require-imports */
// Node tem `Intl.PluralRules`; aqui simulamos o Hermes removendo-o e conferimos que o polyfill
// fornece as regras de pt, en e es. O comportamento real do Hermes é um critério 👀 da Fase 2.
describe('polyfills', () => {
  const original = Intl.PluralRules;

  afterEach(() => {
    Object.defineProperty(Intl, 'PluralRules', { value: original, configurable: true, writable: true });
  });

  it('does nothing when Intl.PluralRules already exists', () => {
    jest.isolateModules(() => {
      require('./polyfills');
    });
    expect(Intl.PluralRules).toBe(original);
  });

  it('installs pt, en and es plural rules when Intl.PluralRules is missing', () => {
    Object.defineProperty(Intl, 'PluralRules', { value: undefined, configurable: true, writable: true });
    jest.isolateModules(() => {
      require('./polyfills');
    });
    expect(Intl.PluralRules).not.toBe(original);
    expect(new Intl.PluralRules('pt').select(1)).toBe('one');
    expect(new Intl.PluralRules('pt').select(2)).toBe('other');
    expect(new Intl.PluralRules('pt').select(1_000_000)).toBe('many');
    expect(new Intl.PluralRules('en').select(1)).toBe('one');
    expect(new Intl.PluralRules('es').select(5)).toBe('other');
    expect(new Intl.PluralRules('en', { type: 'ordinal' }).select(2)).toBe('two');
  });
});
