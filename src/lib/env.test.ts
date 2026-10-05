describe('env', () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it('reads the three EXPO_PUBLIC variables from process.env', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'preview';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xyz';

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require('./env') as typeof import('./env');
      expect(env).toEqual({
        appEnv: 'preview',
        supabaseUrl: 'https://xyz.supabase.co',
        supabasePublishableKey: 'sb_publishable_xyz',
      });
    });
  });

  it('fails fast on import when a variable is missing', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('./env')).toThrow(/EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    });
  });
});
