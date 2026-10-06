import { AppError } from '@/utils/appError';

import { toPostgrestAppError } from './postgrestError';

const error = { message: 'boom', code: 'X' };

describe('toPostgrestAppError', () => {
  it('maps a request that never got an answer to "network"', () => {
    const result = toPostgrestAppError({ message: 'TypeError: Network request failed', code: '' }, 0);
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('network');
    expect(result.message).toBe('TypeError: Network request failed');
  });

  it('maps 429 to "rateLimited"', () => {
    expect(toPostgrestAppError(error, 429).code).toBe('rateLimited');
  });

  it('maps 401 and 403 to "unauthorized"', () => {
    expect(toPostgrestAppError(error, 401).code).toBe('unauthorized');
    expect(toPostgrestAppError(error, 403).code).toBe('unauthorized');
  });

  it('maps everything else to "unknown"', () => {
    expect(toPostgrestAppError(error, 500).code).toBe('unknown');
    expect(toPostgrestAppError(error, 400).code).toBe('unknown');
  });

  it('keeps the original error as the cause', () => {
    expect(toPostgrestAppError(error, 500).cause).toBe(error);
  });
});
