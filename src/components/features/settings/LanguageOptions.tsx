import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Check } from '@/components/ui/icons/Check';
import { ListRow } from '@/components/ui/ListRow';
import { useLanguage } from '@/hooks/useLanguage';
import { getLanguageLabel } from '@/i18n/languageNames';
import { LOCALES, type LanguagePreference } from '@/types/language';


const OPTIONS: readonly LanguagePreference[] = ['system', ...LOCALES];

/** Lista de escolha única do idioma: o ativo fica marcado e a troca vale na hora. */
export function LanguageOptions() {
  const { t } = useTranslation();
  const { preference, setLanguage } = useLanguage();
  const systemLabel = t('settings.languageSystem');
  return (
    <View accessibilityRole="radiogroup">
      {OPTIONS.map((option, index) => {
        const selected = option === preference;
        return (
          <ListRow
            key={option}
            title={getLanguageLabel(option, systemLabel)}
            trailing={selected ? <Check size={20} /> : undefined}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => setLanguage(option)}
            separator={index < OPTIONS.length - 1}
          />
        );
      })}
    </View>
  );
}

