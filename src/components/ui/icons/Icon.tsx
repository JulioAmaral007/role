import type { ReactNode } from 'react';
import Svg from 'react-native-svg';

import { colors } from '@/theme/tokens';

export interface IconProps {
  /** Lado do ícone, em pontos. Cada ícone tem o tamanho que o protótipo usa. */
  size?: number;
  /** Cor do traço (ou do preenchimento, nos ícones preenchidos). */
  color?: string;
  /** Espessura do traço. */
  strokeWidth?: number;
}

interface BaseIconProps extends IconProps {
  defaultSize: number;
  defaultStrokeWidth?: number;
  /** Ícone preenchido, sem traço. */
  filled?: boolean;
  children: ReactNode;
}

/**
 * Base de todos os ícones: grade 24×24, traço arredondado, sem texto. O desenho dos filhos usa
 * `currentColor`, que o `Svg` resolve a partir da prop `color`. Ícones são decorativos: quem os
 * usa dá o nome acessível (o protótipo marca todos como `aria-hidden`).
 */
export function Icon({
  size,
  color = colors.ink,
  strokeWidth,
  defaultSize,
  defaultStrokeWidth = 2,
  filled = false,
  children,
}: BaseIconProps) {
  const dimension = size ?? defaultSize;
  return (
    <Svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      color={color}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth ?? defaultStrokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </Svg>
  );
}
