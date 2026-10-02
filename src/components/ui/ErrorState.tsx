import type { ComponentType } from 'react';

import { Flag } from './icons/Flag';
import type { IconProps } from './icons/Icon';
import { StatePanel } from './StatePanel';

export interface ErrorStateProps {
  title: string;
  message?: string;
  /** Texto do botão de tentar de novo. */
  retryLabel: string;
  onRetry: () => void;
  /** Padrão: bandeira. Quem usa pode trocar (ex.: `WifiOff` para falta de conexão). */
  icon?: ComponentType<IconProps>;
}

/** Falha ao carregar: sempre oferece tentar de novo, e é anunciada como alerta. */
export function ErrorState({ title, message, retryLabel, onRetry, icon = Flag }: ErrorStateProps) {
  return (
    <StatePanel
      accessibilityRole="alert"
      icon={icon}
      title={title}
      message={message}
      actionLabel={retryLabel}
      onAction={onRetry}
    />
  );
}
