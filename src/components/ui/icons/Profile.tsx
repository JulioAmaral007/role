import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Aba Perfil. */
export function Profile(props: IconProps) {
  return (
    <Icon
      defaultSize={22}
      {...props}
    >
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </Icon>
  );
}
