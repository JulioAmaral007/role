import i18n from './index';

// Teste de tipos: o `tsc` valida os @ts-expect-error; o jest só garante que roda.
describe('i18n key typing', () => {
  it('accepts valid keys, plurals, ordinals and domain ids', () => {
    expect(i18n.t('home.title')).toBeTruthy();
    expect(i18n.t('suggestion.remaining', { count: 2 })).toBeTruthy();
    expect(i18n.t('stamp.body', { count: 3, place: 'X', ordinal: true })).toBeTruthy();
    expect(i18n.t('timeSlot.half_day')).toBeTruthy();
    expect(i18n.t('budget.up_to_30')).toBeTruthy();
    expect(i18n.t('category.hidden_cafe')).toBeTruthy();
    expect(i18n.t(`mood.${'curious' as 'curious' | 'lazy'}`)).toBeTruthy();
  });

  it('rejects unknown keys at compile time', () => {
    // @ts-expect-error chave inexistente
    i18n.t('home.titulo');
    // @ts-expect-error id de domínio inexistente
    i18n.t('mood.bored');
  });
});
