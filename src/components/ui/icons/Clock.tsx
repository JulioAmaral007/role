import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Motivo ligado ao tempo. */
export function Clock(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      {...props}
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Icon>
  );
}
