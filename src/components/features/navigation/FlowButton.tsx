import { Button, ButtonText, type ButtonVariant } from '@/components/ui/Button';

export interface FlowButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
}

/** Botão de saída dos placeholders da Fase 3: liga uma tela à próxima do fluxo, com dados fake. */
export function FlowButton({ label, onPress, variant = 'outline' }: FlowButtonProps) {
  return (
    <Button size="medium" variant={variant} onPress={onPress}>
      <ButtonText label={label} />
    </Button>
  );
}
