import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Semana cumprida e célula do bingo (no protótipo: 16 com espessura 2,6 e 14 com 3). */
export function Check(props: IconProps) {
  return (
    <Icon
      defaultSize={16}
      defaultStrokeWidth={2.6}
      {...props}
    >
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}
