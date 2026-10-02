import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Raio da ofensiva (preenchido). */
export function Bolt(props: IconProps) {
  return (
    <Icon
      defaultSize={14}
      filled
      {...props}
    >
      <Path d="M13 3L5 14h6l-1 7 8-11h-6z" />
    </Icon>
  );
}
