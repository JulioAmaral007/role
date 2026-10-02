import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { dock, height } from '@/theme/tokens';

import { useDockInset } from './useDockInset';

function metrics(bottom: number): Metrics {
  return {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom },
  };
}

function wrapperWith(bottom: number) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SafeAreaProvider initialMetrics={metrics(bottom)}>{children}</SafeAreaProvider>;
  };
}

describe('useDockInset', () => {
  it('is just the dock base on a device without a bottom inset', async () => {
    const { result } = await renderHook(() => useDockInset(), { wrapper: wrapperWith(0) });
    expect(result.current).toBe(106);
  });

  it('adds the bottom safe area, like the home indicator of an iPhone', async () => {
    const { result } = await renderHook(() => useDockInset(), { wrapper: wrapperWith(34) });
    expect(result.current).toBe(106 + 34);
  });

  it('adds a gesture navigation bar inset on Android', async () => {
    const { result } = await renderHook(() => useDockInset(), { wrapper: wrapperWith(24) });
    expect(result.current).toBe(dock.baseInset + 24);
  });

  it('always clears the whole dock: its item, padding and margin, with some room to spare', async () => {
    for (const bottom of [0, 24, 34]) {
      const { result } = await renderHook(() => useDockInset(), { wrapper: wrapperWith(bottom) });
      const dockFootprint = height.dockItem + dock.padding * 2 + dock.bottomMargin + bottom;
      expect(result.current).toBeGreaterThan(dockFootprint);
    }
  });
});
