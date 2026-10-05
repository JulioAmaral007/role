import { getBackoffDelay } from './backoff';

const DELAYS = [1000, 5000, 15000];

describe('getBackoffDelay', () => {
  it('walks through the steps in order', () => {
    expect(getBackoffDelay(0, DELAYS)).toBe(1000);
    expect(getBackoffDelay(1, DELAYS)).toBe(5000);
    expect(getBackoffDelay(2, DELAYS)).toBe(15000);
  });

  it('stays at the last step once the list ends', () => {
    expect(getBackoffDelay(3, DELAYS)).toBe(15000);
    expect(getBackoffDelay(50, DELAYS)).toBe(15000);
  });

  it('treats a negative or fractional attempt as a valid index', () => {
    expect(getBackoffDelay(-4, DELAYS)).toBe(1000);
    expect(getBackoffDelay(1.9, DELAYS)).toBe(5000);
  });

  it('returns 0 for an empty list', () => {
    expect(getBackoffDelay(2, [])).toBe(0);
  });
});
