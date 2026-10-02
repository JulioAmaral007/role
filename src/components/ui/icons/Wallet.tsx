import { Path, Rect } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Motivo ligado ao orçamento. */
export function Wallet(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      {...props}
    >
      <Rect x={3} y={6} width={18} height={13} rx={3} />
      <Path d="M3 10h18" />
      <Path d="M16 14.5h2" />
    </Icon>
  );
}
