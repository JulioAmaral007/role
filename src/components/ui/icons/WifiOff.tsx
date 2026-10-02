import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Sem conexão (não existe no protótipo; traçado do Feather Icons, licença MIT). */
export function WifiOff(props: IconProps) {
  return (
    <Icon
      defaultSize={22}
      {...props}
    >
      <Path d="M1 1l22 22" />
      <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <Path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <Path d="M12 20h.01" />
    </Icon>
  );
}
