import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce, getDataFromLocalStorage } from './fns';

describe('debounce', () => {
  afterEach(() => vi.useRealTimers());

  it('invokes the function once after the delay, coalescing rapid calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 150);

    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the latest arguments through', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('b');
  });
});

describe('getDataFromLocalStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubStorage = (store: Record<string, string>) => {
    const localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
    };
    vi.stubGlobal('window', { localStorage });
    vi.stubGlobal('localStorage', localStorage);
  };

  it('returns the default when localStorage is unavailable (SSR)', () => {
    // window is undefined in the node test env by default
    expect(getDataFromLocalStorage('missing', 'fallback')).toBe('fallback');
  });

  it('returns the default when the key is absent', () => {
    stubStorage({});
    expect(getDataFromLocalStorage('missing', 42)).toBe(42);
  });

  it('parses stored JSON', () => {
    stubStorage({ list: JSON.stringify(['usd', 'eur']) });
    expect(getDataFromLocalStorage('list', [])).toEqual(['usd', 'eur']);
  });

  it('returns the raw string when the stored value is not valid JSON', () => {
    stubStorage({ raw: 'not-json' });
    expect(getDataFromLocalStorage('raw', '')).toBe('not-json');
  });
});
