import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Ilustração do "Nada bateu" (tamanho de ilustração, traço mais fino). */
export function CloudRain(props: IconProps) {
  return (
    <Icon
      defaultSize={48}
      defaultStrokeWidth={1.8}
      {...props}
    >
      <Path d="M7 15a4 4 0 1 1 .9-7.9A5 5 0 0 1 17.5 8 3.5 3.5 0 0 1 17 15z" />
      <Path d="M8 18l-1 2" />
      <Path d="M12 18l-1 2" />
      <Path d="M16 18l-1 2" />
    </Icon>
  );
}
