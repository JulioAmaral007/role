import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** "Informar problema" (não existe no protótipo). */
export function Flag(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      {...props}
    >
      <Path d="M5 21V4" />
      <Path d="M5 4h12l-2.5 4.5L17 13H5" />
    </Icon>
  );
}
