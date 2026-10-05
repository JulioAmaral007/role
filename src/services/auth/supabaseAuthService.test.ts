import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from '@supabase/supabase-js';

import { AppError } from '@/utils/appError';

import { SupabaseAuthService, toAppError } from './supabaseAuthService';

// O client real nunca é criado: `@/lib/supabase` é trocado por um objeto mínimo.
jest.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }));

function createClient(overrides: { getSession?: jest.Mock; signInAnonymously?: jest.Mock }) {
  return {
    auth: {
      getSession:
        overrides.getSession ?? jest.fn(async () => ({ data: { session: null }, error: null })),
      signInAnonymously:
        overrides.signInAnonymously ??
        jest.fn(async () => ({ data: { user: { id: 'new-user' }, session: {} }, error: null })),
    },
  } as never;
}

describe('SupabaseAuthService.ensureSession', () => {
  it('reuses the stored session without signing in again', async () => {
    const getSession = jest.fn(async () => ({
      data: { session: { user: { id: 'stored-user' } } },
      error: null,
    }));
    const signInAnonymously = jest.fn();
    const service = new SupabaseAuthService(createClient({ getSession, signInAnonymously }));

    await expect(service.ensureSession()).resolves.toBe('stored-user');
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('signs in anonymously when there is no session', async () => {
    const signInAnonymously = jest.fn(async () => ({
      data: { user: { id: 'anon-user' }, session: {} },
      error: null,
    }));
    const service = new SupabaseAuthService(createClient({ signInAnonymously }));

    await expect(service.ensureSession()).resolves.toBe('anon-user');
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('shares one attempt between simultaneous calls (a single anonymous user)', async () => {
    const signInAnonymously = jest.fn(async () => ({
      data: { user: { id: 'anon-user' }, session: {} },
      error: null,
    }));
    const service = new SupabaseAuthService(createClient({ signInAnonymously }));

    const results = await Promise.all([service.ensureSession(), service.ensureSession()]);
    expect(results).toEqual(['anon-user', 'anon-user']);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('allows a new attempt after a failure', async () => {
    const signInAnonymously = jest
      .fn()
      .mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new AuthRetryableFetchError('offline', 0),
      })
      .mockResolvedValueOnce({ data: { user: { id: 'anon-user' }, session: {} }, error: null });
    const service = new SupabaseAuthService(createClient({ signInAnonymously }));

    await expect(service.ensureSession()).rejects.toMatchObject({ code: 'network' });
    await expect(service.ensureSession()).resolves.toBe('anon-user');
  });

  it('fails when the session lookup fails', async () => {
    const getSession = jest.fn(async () => ({
      data: { session: null },
      error: new AuthRetryableFetchError('offline', 0),
    }));
    const service = new SupabaseAuthService(createClient({ getSession }));

    await expect(service.ensureSession()).rejects.toBeInstanceOf(AppError);
  });

  it('fails when the sign-in returns no user', async () => {
    const signInAnonymously = jest.fn(async () => ({
      data: { user: null, session: null },
      error: null,
    }));
    const service = new SupabaseAuthService(createClient({ signInAnonymously }));

    await expect(service.ensureSession()).rejects.toMatchObject({ code: 'unknown' });
  });
});

describe('toAppError', () => {
  it('maps a network failure to "network"', () => {
    expect(toAppError(new AuthRetryableFetchError('offline', 0)).code).toBe('network');
  });

  it('maps HTTP 429 to "rateLimited"', () => {
    const error = new AuthApiError('too many', 429, 'over_request_rate_limit');
    expect(toAppError(error).code).toBe('rateLimited');
  });

  it('maps HTTP 401 and 403 to "unauthorized"', () => {
    expect(toAppError(new AuthApiError('nope', 401, 'bad_jwt')).code).toBe('unauthorized');
    expect(toAppError(new AuthApiError('nope', 403, 'anonymous_provider_disabled')).code).toBe(
      'unauthorized',
    );
  });

  it('maps anything else to "unknown" and keeps the original error as the cause', () => {
    const original = new AuthUnknownError('boom', new Error('x'));
    const converted = toAppError(original);
    expect(converted.code).toBe('unknown');
    expect(converted.cause).toBe(original);
  });
});
