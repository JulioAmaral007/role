import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Aba Rolê. */
export function Compass(props: IconProps) {
  return (
    <Icon
      defaultSize={22}
      {...props}
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </Icon>
  );
}
