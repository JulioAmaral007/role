import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Endereço e "Como chegar". */
export function Pin(props: IconProps) {
  return (
    <Icon
      defaultSize={16}
      {...props}
    >
      <Path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <Circle cx={12} cy={10} r={2.5} />
    </Icon>
  );
}
