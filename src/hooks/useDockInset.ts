import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dock } from '@/theme/tokens';

/**
 * Recuo inferior das telas com tabs: o dock flutua por cima do conteúdo, então cada tela soma
 * este valor ao padding de baixo (`contentContainerStyle` do scroll, ou o padding do contêiner).
 * É a base do dock (item + padding + margem + folga) mais o safe area do aparelho. Não usa
 * `useBottomTabBarHeight`: o dock é absoluto e esse hook só existe dentro de tabs
 * (docs/ARCHITECTURE.md, seção 6.2, item 5).
 */
export function useDockInset(): number {
  const { bottom } = useSafeAreaInsets();
  return dock.baseInset + bottom;
}
