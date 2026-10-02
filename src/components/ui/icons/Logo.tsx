import { Circle, Rect } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Marca do app: quadrado com três pontos. */
export function Logo(props: IconProps) {
  return (
    <Icon
      defaultSize={26}
      {...props}
    >
      <Rect x={3} y={3} width={18} height={18} rx={5} />
      <Circle cx={8.5} cy={8.5} r={1.4} fill="currentColor" stroke="none" />
      <Circle cx={12} cy={12} r={1.4} fill="currentColor" stroke="none" />
      <Circle cx={15.5} cy={15.5} r={1.4} fill="currentColor" stroke="none" />
    </Icon>
  );
}
