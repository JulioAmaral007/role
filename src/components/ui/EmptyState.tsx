import type { ComponentType } from 'react';

import type { IconProps } from './icons/Icon';
import { StatePanel } from './StatePanel';

export interface EmptyStateProps {
  icon?: ComponentType<IconProps>;
  title: string;
  message?: string;
  /** A ação é opcional: só aparece com `actionLabel` e `onAction` juntos. */
  actionLabel?: string;
  onAction?: () => void;
}

/** Tela ou lista sem conteúdo ainda. */
export function EmptyState(props: EmptyStateProps) {
  return <StatePanel {...props} />;
}
