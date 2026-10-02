import { Circle, Path, Rect } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Aba Passaporte. */
export function Passport(props: IconProps) {
  return (
    <Icon
      defaultSize={22}
      {...props}
    >
      <Rect x={5} y={3} width={14} height={18} rx={2} />
      <Circle cx={12} cy={11} r={3} />
      <Path d="M9 17h6" />
    </Icon>
  );
}
