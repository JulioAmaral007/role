import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentType } from 'react';

import { FloatingTabBar, type FloatingTabBarItem } from '@/components/ui/FloatingTabBar';
import { Compass } from '@/components/ui/icons/Compass';
import type { IconProps } from '@/components/ui/icons/Icon';
import { Passport } from '@/components/ui/icons/Passport';
import { Profile } from '@/components/ui/icons/Profile';
import { Users } from '@/components/ui/icons/Users';

/** Ícone de cada aba, por nome de rota. Uma aba nova sem ícone aqui quebra o `tsc` (seção 6.2, item 9). */
const TAB_ICONS = {
  index: Compass,
  passport: Passport,
  crew: Users,
  profile: Profile,
} as const satisfies Record<string, ComponentType<IconProps>>;

type TabRouteName = keyof typeof TAB_ICONS;

function isTabRouteName(name: string): name is TabRouteName {
  return name in TAB_ICONS;
}

/**
 * Adaptador entre o `tabBar` do React Navigation (via Expo Router) e o `FloatingTabBar`, que não
 * conhece rota nenhuma (docs/ARCHITECTURE.md, seção 6.2). Se a API do `tabBar` mudar, só este
 * arquivo muda.
 */
export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const entries = state.routes.flatMap((route, routeIndex) => {
    if (!isTabRouteName(route.name)) return [];
    const { options } = descriptors[route.key];
    const item: FloatingTabBarItem = {
      key: route.name,
      // o título vem das opções da tela, já traduzido pelo layout das abas
      label: options.title ?? route.name,
      icon: TAB_ICONS[route.name],
      accessibilityLabel: options.tabBarAccessibilityLabel,
    };
    return [{ item, routeIndex }];
  });

  const handlePress = (position: number) => {
    const route = state.routes[entries[position].routeIndex];
    // padrão do React Navigation: avisa a tela (que pode cancelar) e só navega se ela não cancelou
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (state.index !== entries[position].routeIndex && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const handleLongPress = (position: number) => {
    navigation.emit({ type: 'tabLongPress', target: state.routes[entries[position].routeIndex].key });
  };

  return (
    <FloatingTabBar
      items={entries.map((entry) => entry.item)}
      activeIndex={entries.findIndex((entry) => entry.routeIndex === state.index)}
      bottomInset={insets.bottom}
      onPress={handlePress}
      onLongPress={handleLongPress}
    />
  );
}
