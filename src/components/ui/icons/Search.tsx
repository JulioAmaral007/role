import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Campo de busca de cidade ou bairro. */
export function Search(props: IconProps) {
  return (
    <Icon
      defaultSize={18}
      {...props}
    >
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-4-4" />
    </Icon>
  );
}
