import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Ajustes (não existe no protótipo; ícone de controles deslizantes). */
export function Settings(props: IconProps) {
  return (
    <Icon
      defaultSize={22}
      {...props}
    >
      <Path d="M4 7h9" />
      <Path d="M17 7h3" />
      <Circle cx={15} cy={7} r={2} />
      <Path d="M4 17h3" />
      <Path d="M11 17h9" />
      <Circle cx={9} cy={17} r={2} />
    </Icon>
  );
}
