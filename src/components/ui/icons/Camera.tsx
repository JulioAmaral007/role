import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** "Adicionar foto" no Como foi. */
export function Camera(props: IconProps) {
  return (
    <Icon
      defaultSize={24}
      {...props}
    >
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx={12} cy={13} r={3.5} />
    </Icon>
  );
}
