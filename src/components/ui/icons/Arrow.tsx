import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Seta dos CTAs. */
export function Arrow(props: IconProps) {
  return (
    <Icon
      defaultSize={24}
      defaultStrokeWidth={2.2}
      {...props}
    >
      <Path d="M5 12h14" />
      <Path d="M13 6l6 6-6 6" />
    </Icon>
  );
}
