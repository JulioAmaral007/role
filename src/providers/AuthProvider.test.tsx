import { act, render, screen } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { IN_MEMORY_USER_ID, InMemoryAuthService } from '@/services/auth/inMemoryAuthService';

import { AUTH_RETRY_DELAYS_MS, AuthProvider } from './AuthProvider';

jest.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }));

function Probe() {
  const { status, userId } = useAuth();
  return <Text testID="probe">{`${status}:${userId ?? 'none'}`}</Text>;
}

async function renderProvider(service: InMemoryAuthService) {
  await render(
    <AuthProvider service={service}>
      <Probe />
    </AuthProvider>,
  );
}

const probe = () => screen.getByTestId('probe').props.children;

describe('AuthProvider', () => {
  let appStateListeners: ((state: string) => void)[];
  let removeListener: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    // os logs de desenvolvimento do provider não devem poluir a saída dos testes
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    appStateListeners = [];
    removeListener = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _: string,
      listener: (state: string) => void,
    ) => {
      appStateListeners.push(listener);
      return { remove: removeListener };
    }) as never);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders the children right away, while the sign-in is still pending', async () => {
    const service = new InMemoryAuthService();
    jest.spyOn(service, 'ensureSession').mockReturnValue(new Promise(() => {}));

    await renderProvider(service);

    expect(probe()).toBe('signingIn:none');
  });

  it('turns ready with the user id once the session exists', async () => {
    const service = new InMemoryAuthService();
    await renderProvider(service);

    expect(probe()).toBe(`ready:${IN_MEMORY_USER_ID}`);
    expect(service.calls).toBe(1);
  });

  it('reports the error and retries with growing waits until it works', async () => {
    const service = new InMemoryAuthService({ failures: 2 });
    await renderProvider(service);

    expect(probe()).toBe('error:none');
    expect(service.calls).toBe(1);

    // ainda não deu a primeira espera: nada de nova tentativa
    await act(async () => {
      jest.advanceTimersByTime(AUTH_RETRY_DELAYS_MS[0] - 1);
    });
    expect(service.calls).toBe(1);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(service.calls).toBe(2);
    expect(probe()).toBe('error:none');

    // a segunda espera é maior que a primeira
    await act(async () => {
      jest.advanceTimersByTime(AUTH_RETRY_DELAYS_MS[1]);
    });
    expect(service.calls).toBe(3);
    expect(probe()).toBe(`ready:${IN_MEMORY_USER_ID}`);
  });

  it('logs the reason of a failed attempt in development, so it is not silent', async () => {
    const service = new InMemoryAuthService({ failures: 1 });
    await renderProvider(service);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[auth] falha ao entrar (network)'),
      expect.anything(),
    );
  });

  it('stops retrying once the session is ready', async () => {
    const service = new InMemoryAuthService({ failures: 1 });
    await renderProvider(service);

    await act(async () => {
      jest.advanceTimersByTime(AUTH_RETRY_DELAYS_MS[0]);
    });
    expect(probe()).toBe(`ready:${IN_MEMORY_USER_ID}`);

    await act(async () => {
      jest.advanceTimersByTime(10 * 60_000);
    });
    expect(service.calls).toBe(2);
  });

  it('retries immediately when the app comes back to the foreground without a session', async () => {
    const service = new InMemoryAuthService({ failures: 1 });
    await renderProvider(service);
    expect(probe()).toBe('error:none');

    await act(async () => {
      appStateListeners[0]('active');
    });

    expect(service.calls).toBe(2);
    expect(probe()).toBe(`ready:${IN_MEMORY_USER_ID}`);
  });

  it('does not start a second attempt while one is already running', async () => {
    const service = new InMemoryAuthService();
    let resolve!: (id: string) => void;
    const ensureSession = jest
      .spyOn(service, 'ensureSession')
      .mockReturnValue(new Promise<string>((r) => (resolve = r)));

    await renderProvider(service);
    await act(async () => {
      appStateListeners[0]('active');
    });
    expect(ensureSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve('late-user');
    });
    expect(probe()).toBe('ready:late-user');
  });

  it('cancels the retry timer and the AppState listener on unmount', async () => {
    const service = new InMemoryAuthService({ failures: 5 });
    const { unmount } = await render(
      <AuthProvider service={service}>
        <Probe />
      </AuthProvider>,
    );
    expect(service.calls).toBe(1);

    await unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(10 * 60_000);
    });
    expect(service.calls).toBe(1);
  });
});
