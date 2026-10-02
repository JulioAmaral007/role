import { Path, Rect } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** "Reservar". */
export function Calendar(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      {...props}
    >
      <Rect x={3} y={5} width={18} height={16} rx={2} />
      <Path d="M3 10h18" />
      <Path d="M8 3v4" />
      <Path d="M16 3v4" />
    </Icon>
  );
}
