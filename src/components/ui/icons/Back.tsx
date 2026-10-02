import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Voltar. */
export function Back(props: IconProps) {
  return (
    <Icon
      defaultSize={20}
      defaultStrokeWidth={2.2}
      {...props}
    >
      <Path d="M15 6l-6 6 6 6" />
    </Icon>
  );
}
