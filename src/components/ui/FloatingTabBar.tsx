import { useEffect, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, dock, height, radius, shadow } from '@/theme/tokens';
import {
  activeWidth,
  iconLeftsByActive,
  labelLeft,
  maxLabelWidth,
  pillStep,
  type DockGeometry,
} from '@/utils/dockLayout';

import type { IconProps } from './icons/Icon';
import { Text } from './Text';

// Dock flutuante do protótipo (docs/ARCHITECTURE.md, seção 6). Componente puro: não conhece o
// Expo Router nem o React Navigation; quem liga o dock às rotas é o `AppTabBar`.
//
// Animação só com `transform` e `opacity` (regra `animation-gpu-properties`, sem exceção):
//  - a pílula amarela tem largura FIXA (`activeWidth`) e desliza com `translateX`;
//  - cada ícone desliza até a posição do seu espaço e troca de cor por um fundido de opacidade
//    entre duas cópias (areia e ink), em vez de animar a cor do `Svg`;
//  - o label aparece e some com `opacity` (e um pequeno `translateX`).
// `progress` (o índice ativo, animado com mola) é a única fonte de verdade (`state-ground-truth`).

export interface FloatingTabBarItem {
  key: string;
  /** Texto do item ativo (já traduzido). */
  label: string;
  icon: ComponentType<IconProps>;
  /** Nome para leitor de tela. Padrão: o `label`. Nos inativos (só ícone) é o único nome. */
  accessibilityLabel?: string;
}

export interface FloatingTabBarProps {
  items: readonly FloatingTabBarItem[];
  activeIndex: number;
  /** Safe area inferior do aparelho, somada à margem do dock. */
  bottomInset: number;
  /** Nome do grupo de abas para leitor de tela (ex.: "Principal"). */
  accessibilityLabel?: string;
  onPress: (index: number) => void;
  onLongPress?: (index: number) => void;
}

const SPRING = { mass: 1, damping: 22, stiffness: 260 } as const;
const ICON_TOP = (height.dockItem - dock.iconSize) / 2;
const LABEL_GAP = 8;
const CONTENT_PADDING = 10;
/** Distância do deslocamento horizontal do label ao entrar e sair. */
const LABEL_SHIFT = 6;

const clamp = Extrapolation.CLAMP;

export function FloatingTabBar({
  items,
  activeIndex,
  bottomInset,
  accessibilityLabel,
  onPress,
  onLongPress,
}: FloatingTabBarProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState<(number | undefined)[]>([]);
  const progress = useSharedValue(activeIndex);

  useEffect(() => {
    progress.set(withSpring(activeIndex, SPRING));
  }, [activeIndex, progress]);

  // `ui-measure-views`: `onLayout`, e o estado só muda quando o valor muda
  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth((previous) => (previous === width ? previous : width));
  };
  const handleLabelLayout = (index: number, width: number) => {
    setLabelWidths((previous) => {
      if (previous[index] === width) return previous;
      const next = [...previous];
      next[index] = width;
      return next;
    });
  };

  const geometry: DockGeometry = {
    containerWidth,
    padding: dock.padding,
    gap: dock.gap,
    inactiveWidth: dock.inactiveItemWidth,
    iconSize: dock.iconSize,
    labelGap: LABEL_GAP,
    contentPadding: CONTENT_PADDING,
    itemCount: items.length,
    labelWidths: items.map((_, index) => labelWidths[index] ?? 0),
  };
  const itemActiveWidth = activeWidth(geometry);
  // sem a largura do dock e dos labels medidas, as posições ainda estariam erradas: fica invisível
  const ready = containerWidth > 0 && items.every((_, index) => labelWidths[index] !== undefined);

  // o worklet roda na thread de UI e só captura valores: `pillStep` (função JS) fica de fora
  const step = pillStep(geometry);
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * step }],
  }));

  return (
    <View
      testID="floating-tab-bar"
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleContainerLayout}
      style={[styles.container, { bottom: dock.bottomMargin + bottomInset, opacity: ready ? 1 : 0 }]}
    >
      <View style={styles.inner}>
        {/* camada visual: só desenha, não recebe toque nem é lida pelo leitor de tela */}
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          <Animated.View testID="floating-tab-bar-pill" style={[styles.pill, { width: itemActiveWidth }, pillStyle]} />
          {items.map((item, index) => (
            <DockItemVisual
              key={item.key}
              item={item}
              index={index}
              count={items.length}
              progress={progress}
              iconLefts={iconLeftsByActive(geometry, index)}
              labelX={labelLeft(geometry, index)}
              labelMaxWidth={maxLabelWidth(geometry)}
              onLabelWidth={handleLabelLayout}
            />
          ))}
        </View>
        {/* camada de toque: segue o layout final de cada estado (ativo largo, inativos de 64) */}
        <View style={styles.touchRow}>
          {items.map((item, index) => (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              accessibilityState={{ selected: index === activeIndex }}
              onPress={() => onPress(index)}
              onLongPress={onLongPress ? () => onLongPress(index) : undefined}
              style={{ width: index === activeIndex ? itemActiveWidth : dock.inactiveItemWidth, height: height.dockItem }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

interface DockItemVisualProps {
  item: FloatingTabBarItem;
  index: number;
  count: number;
  progress: SharedValue<number>;
  /** Posição esquerda do ícone para cada item ativo possível. */
  iconLefts: number[];
  labelX: number;
  labelMaxWidth: number;
  onLabelWidth: (index: number, width: number) => void;
}

function DockItemVisual({
  item,
  index,
  count,
  progress,
  iconLefts,
  labelX,
  labelMaxWidth,
  onLabelWidth,
}: DockItemVisualProps) {
  const IconComponent = item.icon;
  const positions = Array.from({ length: count }, (_, position) => position);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.get(), positions, iconLefts, clamp) }],
  }));
  const inkOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [index - 1, index, index + 1], [0, 1, 0], clamp),
  }));
  const sandOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [index - 1, index, index + 1], [1, 0, 1], clamp),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [index - 0.5, index, index + 0.5], [0, 1, 0], clamp),
    transform: [
      { translateX: interpolate(progress.get(), [index - 1, index, index + 1], [-LABEL_SHIFT, 0, LABEL_SHIFT], clamp) },
    ],
  }));

  return (
    <>
      <Animated.View testID={`floating-tab-bar-icon-${item.key}`} style={[styles.icon, iconStyle]}>
        <Animated.View style={sandOpacity}>
          <IconComponent size={dock.iconSize} color={colors.sand} />
        </Animated.View>
        <Animated.View style={[styles.iconInk, inkOpacity]}>
          <IconComponent size={dock.iconSize} color={colors.ink} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        onLayout={(event) => onLabelWidth(index, event.nativeEvent.layout.width)}
        style={[styles.label, { left: labelX, maxWidth: labelMaxWidth }, labelStyle]}
      >
        <Text variant="tabLabel" color={colors.ink} numberOfLines={1}>
          {item.label}
        </Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: dock.sideMargin,
    right: dock.sideMargin,
    padding: dock.padding,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    backgroundColor: colors.ink,
    boxShadow: shadow.dock,
  },
  inner: {
    height: height.dockItem,
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: height.dockItem,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    backgroundColor: colors.yellow,
  },
  icon: {
    position: 'absolute',
    top: ICON_TOP,
    left: 0,
    width: dock.iconSize,
    height: dock.iconSize,
  },
  iconInk: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  label: {
    position: 'absolute',
    top: 0,
    height: height.dockItem,
    justifyContent: 'center',
  },
  touchRow: {
    flexDirection: 'row',
    gap: dock.gap,
  },
});
