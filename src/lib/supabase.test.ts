import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn() },
  })),
}));
jest.mock('./env', () => ({
  env: {
    appEnv: 'development',
    supabaseUrl: 'https://abc.supabase.co',
    supabasePublishableKey: 'sb_publishable_abc',
  },
}));

type Listener = (state: string) => void;

function loadModule(): { supabase: ReturnType<typeof createClient> } {
  let loaded!: { supabase: ReturnType<typeof createClient> };
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require('./supabase');
  });
  return loaded;
}

describe('supabase client', () => {
  let listeners: Listener[];
  let removes: jest.Mock[];

  beforeEach(() => {
    listeners = [];
    removes = [];
    (globalThis as Record<string, unknown>).__roleSupabaseAppStateListener = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, listener: Listener) => {
      listeners.push(listener);
      const remove = jest.fn();
      removes.push(remove);
      return { remove };
    }) as never);
    jest.mocked(createClient).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates one client with the env values and a persisted, auto-refreshed session', () => {
    loadModule();
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith('https://abc.supabase.co', 'sb_publishable_abc', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  });

  it('starts the token refresh when the app is active and stops it otherwise', () => {
    const { supabase } = loadModule();
    expect(listeners).toHaveLength(1);

    listeners[0]('active');
    expect(supabase.auth.startAutoRefresh).toHaveBeenCalledTimes(1);

    listeners[0]('background');
    listeners[0]('inactive');
    expect(supabase.auth.stopAutoRefresh).toHaveBeenCalledTimes(2);
    expect(supabase.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
  });

  it('replaces the previous listener when the module is evaluated again (Fast Refresh)', () => {
    loadModule();
    loadModule();
    expect(listeners).toHaveLength(2);
    expect(removes[0]).toHaveBeenCalledTimes(1);
    expect(removes[1]).not.toHaveBeenCalled();
  });
});
