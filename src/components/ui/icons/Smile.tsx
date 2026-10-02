import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Motivo ligado ao humor. */
export function Smile(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      {...props}
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      <Path d="M9 9.5h.01" />
      <Path d="M15 9.5h.01" />
    </Icon>
  );
}
