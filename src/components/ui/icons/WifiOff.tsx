import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Ilustração do "Sem internet" (Wi-Fi cortado). */
export function WifiOff(props: IconProps) {
  return (
    <Icon
      defaultSize={46}
      defaultStrokeWidth={1.8}
      {...props}
    >
      <Path d="M2 8.5a15 15 0 0 1 4.5-2.8" />
      <Path d="M10.5 5.1A15 15 0 0 1 22 8.5" />
      <Path d="M5 12a10 10 0 0 1 3.5-2" />
      <Path d="M15 10.2A10 10 0 0 1 19 12" />
      <Path d="M8.5 15.5a5 5 0 0 1 7 0" />
      <Path d="M12 19.5h.01" />
      <Path d="M3 3l18 18" />
    </Icon>
  );
}
