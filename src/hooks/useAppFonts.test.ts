import { renderHook } from '@testing-library/react-native';
import { useFonts } from 'expo-font';

import { fontFamily, fontSources } from '@/theme/fonts';

import { useAppFonts } from './useAppFonts';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));

const mockedUseFonts = jest.mocked(useFonts);

describe('useAppFonts', () => {
  it('keeps the splash while the fonts are loading', async () => {
    mockedUseFonts.mockReturnValue([false, null]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(false);
  });

  it('releases the splash when the fonts are ready', async () => {
    mockedUseFonts.mockReturnValue([true, null]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(true);
  });

  it('releases the splash when loading fails, so the app does not hang', async () => {
    mockedUseFonts.mockReturnValue([false, new Error('boom')]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(true);
  });

  it('asks expo-font for every family the theme declares', async () => {
    mockedUseFonts.mockReturnValue([true, null]);
    await renderHook(() => useAppFonts());
    expect(mockedUseFonts).toHaveBeenCalledWith(fontSources);
  });
});

describe('font families', () => {
  const names = [
    ...Object.values(fontFamily.display),
    ...Object.values(fontFamily.body),
    ...Object.values(fontFamily.mono),
  ];

  it('has a font file for every declared family, and no extra file', () => {
    expect(Object.keys(fontSources).sort()).toEqual([...names].sort());
  });

  it('names each family after its weight, as the Google Fonts packages do', () => {
    expect(names).toEqual([
      'BricolageGrotesque_700Bold',
      'BricolageGrotesque_800ExtraBold',
      'InstrumentSans_400Regular',
      'InstrumentSans_500Medium',
      'InstrumentSans_600SemiBold',
      'InstrumentSans_700Bold',
      'DMMono_400Regular',
      'DMMono_500Medium',
    ]);
  });
});
