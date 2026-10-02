import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Aba Turma. */
export function Users(props: IconProps) {
  return (
    <Icon
      defaultSize={22}
      {...props}
    >
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <Path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <Path d="M21 20c0-2.6-1.6-4.8-4-5.6" />
    </Icon>
  );
}
