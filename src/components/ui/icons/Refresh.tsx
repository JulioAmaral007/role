import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** "Outra". */
export function Refresh(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      {...props}
    >
      <Path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <Path d="M20 4v5h-5" />
    </Icon>
  );
}
