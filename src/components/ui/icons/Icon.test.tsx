import { render } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import { colors } from '@/theme/tokens';

import { Arrow } from './Arrow';
import { Back } from './Back';
import { Bolt } from './Bolt';
import { Calendar } from './Calendar';
import { Camera } from './Camera';
import { Check } from './Check';
import { Clock } from './Clock';
import { CloudRain } from './CloudRain';
import { Close } from './Close';
import { Compass } from './Compass';
import { Flag } from './Flag';
import type { IconProps } from './Icon';
import { Logo } from './Logo';
import { Passport } from './Passport';
import { Pin } from './Pin';
import { PinOff } from './PinOff';
import { Profile } from './Profile';
import { Refresh } from './Refresh';
import { Search } from './Search';
import { Settings } from './Settings';
import { Share } from './Share';
import { Smile } from './Smile';
import { UserPlus } from './UserPlus';
import { Users } from './Users';
import { Wallet } from './Wallet';
import { WifiOff } from './WifiOff';

const ICONS: Record<string, ComponentType<IconProps>> = {
  Arrow,
  Back,
  Bolt,
  Calendar,
  Camera,
  Check,
  Clock,
  CloudRain,
  Close,
  Compass,
  Flag,
  Logo,
  Passport,
  Pin,
  PinOff,
  Profile,
  Refresh,
  Search,
  Settings,
  Share,
  Smile,
  UserPlus,
  Users,
  Wallet,
  WifiOff,
};

/** Tamanho padrão de cada ícone, igual ao do protótipo (só `Settings` e `Flag` não existem lá). */
const DEFAULT_SIZE: Record<string, number> = {
  Arrow: 24,
  Back: 20,
  Bolt: 14,
  Calendar: 18,
  Camera: 24,
  Check: 16,
  Clock: 18,
  CloudRain: 48,
  Close: 18,
  Compass: 22,
  Flag: 18,
  Logo: 26,
  Passport: 22,
  Pin: 16,
  PinOff: 46,
  Profile: 22,
  Refresh: 18,
  Search: 18,
  Settings: 22,
  Share: 20,
  Smile: 18,
  UserPlus: 20,
  Users: 22,
  Wallet: 18,
  WifiOff: 46,
};

async function renderIcon(name: string, props: IconProps = {}) {
  const IconComponent = ICONS[name];
  const { toJSON } = await render(<IconComponent {...props} />);
  const tree = await toJSON();
  if (Array.isArray(tree) || tree == null) throw new Error('expected a single root');
  return tree;
}

describe('icons', () => {
  it('has the icons of the revised prototype plus Settings and Flag', () => {
    expect(Object.keys(ICONS)).toHaveLength(25);
    expect(Object.keys(DEFAULT_SIZE).sort()).toEqual(Object.keys(ICONS).sort());
  });

  it.each(Object.keys(ICONS))('%s draws something at its default size', async (name) => {
    const view = await renderIcon(name);
    expect(view.props.width).toBe(DEFAULT_SIZE[name]);
    expect(view.props.height).toBe(DEFAULT_SIZE[name]);
    expect(view.props.vbWidth).toBe(24);
    expect(view.children?.length).toBeGreaterThan(0);
  });

  it.each(Object.keys(ICONS))('%s is decorative for screen readers', async (name) => {
    const view = await renderIcon(name);
    expect(view.props.accessible).toBe(false);
    expect(view.props.accessibilityElementsHidden).toBe(true);
    expect(view.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it.each(Object.keys(ICONS))('%s accepts size, color and strokeWidth', async (name) => {
    const view = await renderIcon(name, { size: 40, color: colors.yellow, strokeWidth: 3 });
    expect(view.props.width).toBe(40);
    expect(view.props.height).toBe(40);
    expect(view.props.color).toBe(colors.yellow);
    expect(view.props.strokeWidth).toBe(3);
  });

  it('defaults to the ink color', async () => {
    const view = await renderIcon('Compass');
    expect(view.props.color).toBe(colors.ink);
  });

  it('draws line icons with a rounded stroke and no fill', async () => {
    const view = await renderIcon('Compass');
    expect(view.props).toMatchObject({
      fill: 'none',
      stroke: 'currentColor',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: 2,
    });
  });

  it('keeps the stroke widths of the prototype', async () => {
    expect((await renderIcon('Arrow')).props.strokeWidth).toBe(2.2);
    expect((await renderIcon('Check')).props.strokeWidth).toBe(2.6);
    expect((await renderIcon('Back')).props.strokeWidth).toBe(2.2);
    expect((await renderIcon('Pin')).props.strokeWidth).toBe(2);
  });

  it('draws the large illustration-size icons with the thinner 1.8 stroke of the prototype', async () => {
    for (const name of ['CloudRain', 'PinOff', 'WifiOff']) {
      expect({ name, strokeWidth: (await renderIcon(name)).props.strokeWidth }).toEqual({ name, strokeWidth: 1.8 });
    }
  });

  it('draws Bolt as a filled shape without stroke', async () => {
    const view = await renderIcon('Bolt');
    expect(view.props).toMatchObject({ fill: 'currentColor', stroke: 'none' });
  });
});
