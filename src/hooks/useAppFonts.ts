import { useFonts } from 'expo-font';

import { fontSources } from '@/theme/fonts';

/**
 * Carrega as fontes do app. Devolve `true` quando a splash pode sair: fontes prontas **ou** falha
 * ao carregar (o app abre com a fonte do sistema em vez de ficar preso na splash).
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(fontSources);
  return loaded || error != null;
}
