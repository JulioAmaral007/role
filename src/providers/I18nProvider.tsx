import { useEffect, useRef, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { useLanguage } from '@/hooks/useLanguage';
import i18n from '@/i18n';

/**
 * Aplica o idioma efetivo ao i18next (docs/ARCHITECTURE.md, seção 10.3): a escolha salva depois da
 * hidratação do store e, com a escolha `'system'`, o idioma do aparelho quando ele muda. Os filhos
 * só aparecem depois da **primeira** aplicação, para o usuário nunca ver um idioma e depois outro.
 * Trocas seguintes (`useLanguage().setLanguage`) não desmontam nada.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [applied, setApplied] = useState(false);
  // só a primeira aplicação muda o estado; as trocas seguintes não precisam de nova renderização
  const appliedOnce = useRef(false);

  useEffect(() => {
    let active = true;
    i18n
      .changeLanguage(locale)
      .catch(() => {})
      // com falha o app abre mesmo assim, no idioma que o i18next já tinha
      .finally(() => {
        if (!active || appliedOnce.current) return;
        appliedOnce.current = true;
        setApplied(true);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  if (!applied) return null;
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
