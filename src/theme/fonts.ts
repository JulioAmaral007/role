import type { FontSource } from 'expo-font';

// Importamos só os pesos que o protótipo usa, direto do arquivo, e não do índice do pacote: o
// índice tem um `require` por peso (e por itálico) e o Metro empacotaria todos.
import BricolageGrotesque700 from '@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf';
import BricolageGrotesque800 from '@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf';
import DMMono400 from '@expo-google-fonts/dm-mono/400Regular/DMMono_400Regular.ttf';
import DMMono500 from '@expo-google-fonts/dm-mono/500Medium/DMMono_500Medium.ttf';
import InstrumentSans400 from '@expo-google-fonts/instrument-sans/400Regular/InstrumentSans_400Regular.ttf';
import InstrumentSans500 from '@expo-google-fonts/instrument-sans/500Medium/InstrumentSans_500Medium.ttf';
import InstrumentSans600 from '@expo-google-fonts/instrument-sans/600SemiBold/InstrumentSans_600SemiBold.ttf';
import InstrumentSans700 from '@expo-google-fonts/instrument-sans/700Bold/InstrumentSans_700Bold.ttf';

/**
 * Nome de família de cada peso. No React Native uma fonte personalizada é escolhida pelo nome do
 * peso (`fontFamily`), e não por `fontWeight`, para funcionar igual no iOS e no Android.
 */
export const fontFamily = {
  /** Bricolage Grotesque: títulos, CTAs e números. */
  display: {
    bold: 'BricolageGrotesque_700Bold',
    extraBold: 'BricolageGrotesque_800ExtraBold',
  },
  /** Instrument Sans: corpo. */
  body: {
    regular: 'InstrumentSans_400Regular',
    medium: 'InstrumentSans_500Medium',
    semiBold: 'InstrumentSans_600SemiBold',
    bold: 'InstrumentSans_700Bold',
  },
  /** DM Mono: rótulos em caixa alta. */
  mono: {
    regular: 'DMMono_400Regular',
    medium: 'DMMono_500Medium',
  },
} as const;

/** Mapa nome → arquivo, no formato do `useFonts` do `expo-font`. */
export const fontSources: Record<string, FontSource> = {
  [fontFamily.display.bold]: BricolageGrotesque700,
  [fontFamily.display.extraBold]: BricolageGrotesque800,
  [fontFamily.body.regular]: InstrumentSans400,
  [fontFamily.body.medium]: InstrumentSans500,
  [fontFamily.body.semiBold]: InstrumentSans600,
  [fontFamily.body.bold]: InstrumentSans700,
  [fontFamily.mono.regular]: DMMono400,
  [fontFamily.mono.medium]: DMMono500,
};
