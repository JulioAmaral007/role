import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** "Convidar amigos" na Turma. */
export function UserPlus(props: IconProps) {
  return (
    <Icon
      defaultSize={20}
      {...props}
    >
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <Path d="M19 8v6" />
      <Path d="M16 11h6" />
    </Icon>
  );
}
