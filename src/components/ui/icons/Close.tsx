import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Fechar. */
export function Close(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      defaultStrokeWidth={2.2}
      {...props}
    >
      <Path d="M6 6l12 12" />
      <Path d="M18 6L6 18" />
    </Icon>
  );
}
