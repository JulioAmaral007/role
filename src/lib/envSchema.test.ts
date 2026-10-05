import { EnvError, parseEnv, type RawEnv } from './envSchema';

const VALID: RawEnv = {
  appEnv: 'development',
  supabaseUrl: 'https://abc.supabase.co',
  supabasePublishableKey: 'sb_publishable_abc123',
};

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function jwt(payload: object): string {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.signature`;
}

function problemsOf(raw: RawEnv): string {
  try {
    parseEnv(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(EnvError);
    return (error as Error).message;
  }
  throw new Error('expected parseEnv to throw');
}

describe('parseEnv', () => {
  it('returns the typed environment for valid values', () => {
    expect(parseEnv(VALID)).toEqual({
      appEnv: 'development',
      supabaseUrl: 'https://abc.supabase.co',
      supabasePublishableKey: 'sb_publishable_abc123',
    });
  });

  it.each(['development', 'preview', 'production'])('accepts the app env "%s"', (appEnv) => {
    expect(parseEnv({ ...VALID, appEnv }).appEnv).toBe(appEnv);
  });

  it('trims surrounding whitespace', () => {
    const env = parseEnv({
      appEnv: ' preview ',
      supabaseUrl: ' https://abc.supabase.co ',
      supabasePublishableKey: ' sb_publishable_abc123 ',
    });
    expect(env).toEqual({
      appEnv: 'preview',
      supabaseUrl: 'https://abc.supabase.co',
      supabasePublishableKey: 'sb_publishable_abc123',
    });
  });

  it('accepts the legacy anon key (a JWT that is not service_role)', () => {
    const anon = jwt({ role: 'anon' });
    expect(parseEnv({ ...VALID, supabasePublishableKey: anon }).supabasePublishableKey).toBe(anon);
  });

  it('reports every missing variable at once, pointing to .env.example', () => {
    const message = problemsOf({});
    expect(message).toContain('EXPO_PUBLIC_APP_ENV');
    expect(message).toContain('EXPO_PUBLIC_SUPABASE_URL');
    expect(message).toContain('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(message).toContain('.env.example');
  });

  it('treats empty and blank values as missing', () => {
    const message = problemsOf({ appEnv: '', supabaseUrl: '   ', supabasePublishableKey: '' });
    expect(message).toContain('EXPO_PUBLIC_APP_ENV está vazia');
    expect(message).toContain('EXPO_PUBLIC_SUPABASE_URL está vazia');
    expect(message).toContain('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY está vazia');
  });

  it('rejects an unknown app env', () => {
    expect(problemsOf({ ...VALID, appEnv: 'staging' })).toContain('"staging"');
  });

  it('rejects a URL that is not https', () => {
    expect(problemsOf({ ...VALID, supabaseUrl: 'http://abc.supabase.co' })).toContain('https://');
  });

  it('rejects a malformed URL', () => {
    expect(problemsOf({ ...VALID, supabaseUrl: 'abc.supabase.co' })).toContain('não é uma URL válida');
  });

  it('rejects the new secret key', () => {
    const message = problemsOf({ ...VALID, supabasePublishableKey: 'sb_secret_abc123' });
    expect(message).toContain('SECRETA');
  });

  it('rejects the legacy service_role JWT', () => {
    const message = problemsOf({ ...VALID, supabasePublishableKey: jwt({ role: 'service_role' }) });
    expect(message).toContain('SECRETA');
  });

  it('mentions the old variable name when the key is missing', () => {
    expect(problemsOf({ ...VALID, supabasePublishableKey: undefined })).toContain(
      'EXPO_PUBLIC_SUPABASE_KEY',
    );
  });
});
