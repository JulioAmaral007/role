import i18n from './index';

describe('i18n instance', () => {
  it('is initialized synchronously with the three bundled locales', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(Object.keys(i18n.options.resources ?? {}).sort()).toEqual(['en', 'es', 'pt-BR']);
    expect(i18n.t('app.name')).toBe('Rolê Aleatório');
  });

  it('falls back to pt-BR', () => {
    expect(i18n.options.fallbackLng).toEqual(['pt-BR']);
  });

  it('changes language without restarting', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
    await i18n.changeLanguage('pt-BR');
  });
});
