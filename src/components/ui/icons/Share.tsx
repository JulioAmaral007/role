import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Compartilhar (no protótipo aparece em 20 e em 18). */
export function Share(props: IconProps) {
  return (
    <Icon
      defaultSize={20}
      defaultStrokeWidth={2.2}
      {...props}
    >
      <Path d="M12 3v12" />
      <Path d="M7 8l5-5 5 5" />
      <Path d="M5 14v5h14v-5" />
    </Icon>
  );
}
