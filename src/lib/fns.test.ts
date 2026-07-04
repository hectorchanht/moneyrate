import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce, evalMathExpression, getDataFromLocalStorage, getDropIndex, getResponsiveCryptoDp, resolveTourLocale, setDataToLocalStorage, sortCurrencyPairs } from './fns';

describe('evalMathExpression', () => {
  it('returns a plain number unchanged', () => {
    expect(evalMathExpression('150')).toBe(150);
    expect(evalMathExpression('12.5')).toBe(12.5);
  });

  it('respects operator precedence and parentheses', () => {
    expect(evalMathExpression('2+3*4')).toBe(14);
    expect(evalMathExpression('(2+3)*4')).toBe(20);
    expect(evalMathExpression('10/4')).toBe(2.5);
  });

  it('handles unary minus and thousands separators', () => {
    expect(evalMathExpression('-5+2')).toBe(-3);
    expect(evalMathExpression('3*-2')).toBe(-6);
    expect(evalMathExpression('1,000+500')).toBe(1500);
  });

  it('returns null for empty, invalid, or non-finite input', () => {
    expect(evalMathExpression('')).toBeNull();
    expect(evalMathExpression('abc')).toBeNull();
    expect(evalMathExpression('5/0')).toBeNull();
    expect(evalMathExpression('(2+3')).toBeNull();
  });
});

describe('getResponsiveCryptoDp', () => {
  it('defaults to 6 on wide viewports', () => {
    expect(getResponsiveCryptoDp(888, false)).toBe(6);
    expect(getResponsiveCryptoDp(888, true)).toBe(6);
  });

  it('narrows to 4 then 3 only while editing', () => {
    expect(getResponsiveCryptoDp(400, true)).toBe(4);
    expect(getResponsiveCryptoDp(360, true)).toBe(3);
    // not editing: width thresholds above 300 have no effect
    expect(getResponsiveCryptoDp(360, false)).toBe(6);
  });

  it('drops to 2 below 300px regardless of edit mode', () => {
    expect(getResponsiveCryptoDp(299, false)).toBe(2);
    expect(getResponsiveCryptoDp(299, true)).toBe(2);
  });
});

describe('sortCurrencyPairs', () => {
  const pairs: [string, number][] = [['usd', 1], ['eur', 0.9], ['btc', 0.00003]];

  it('returns the same array reference for custom (no reorder)', () => {
    expect(sortCurrencyPairs(pairs, 'custom')).toBe(pairs);
  });

  it('sorts by code A–Z', () => {
    expect(sortCurrencyPairs(pairs, 'name').map((p) => p[0])).toEqual(['btc', 'eur', 'usd']);
  });

  it('sorts by rate high → low', () => {
    expect(sortCurrencyPairs(pairs, 'value').map((p) => p[0])).toEqual(['usd', 'eur', 'btc']);
  });

  it('sorts by 24h change high → low, pushing unknowns last', () => {
    const changeOf = (c: string): number | undefined => ({ usd: 1, eur: -2 } as Record<string, number>)[c];
    expect(sortCurrencyPairs(pairs, 'change', changeOf).map((p) => p[0])).toEqual(['usd', 'eur', 'btc']);
  });

  it('does not mutate the input array', () => {
    const p: [string, number][] = [['b', 2], ['a', 1]];
    sortCurrencyPairs(p, 'name');
    expect(p.map((x) => x[0])).toEqual(['b', 'a']);
  });
});

describe('getDropIndex', () => {
  it('floors the offset into an index', () => {
    expect(getDropIndex(150, 72, 10)).toBe(2);
  });

  it('clamps a negative offset (drop above the list) to 0', () => {
    expect(getDropIndex(-40, 72, 10)).toBe(0);
  });

  it('clamps an offset past the end to the last index', () => {
    expect(getDropIndex(99999, 72, 5)).toBe(4);
  });
});

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

describe('setDataToLocalStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubWritableStorage = () => {
    const store: Record<string, string> = {};
    const localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v; },
    };
    vi.stubGlobal('window', { localStorage });
    vi.stubGlobal('localStorage', localStorage);
    return store;
  };

  it('round-trips a JSON-serializable value', () => {
    stubWritableStorage();
    setDataToLocalStorage('rates', { usd: 1, eur: 0.9 });
    expect(getDataFromLocalStorage('rates', null)).toEqual({ usd: 1, eur: 0.9 });
  });

  it('is a no-op when localStorage is unavailable (SSR)', () => {
    // window undefined in node env — must not throw
    expect(() => setDataToLocalStorage('x', { a: 1 })).not.toThrow();
  });
});

describe('resolveTourLocale', () => {
  it('returns exact match when navigator language is directly supported', () => {
    expect(resolveTourLocale(['zh-TW'], ['en', 'zh-TW'], 'en')).toBe('zh-TW');
  });

  it('falls back to base-language match', () => {
    expect(resolveTourLocale(['fr-CA'], ['en', 'fr'], 'en')).toBe('fr');
  });

  it('falls back to default when nothing matches', () => {
    expect(resolveTourLocale(['xx-YY'], ['en', 'fr'], 'en')).toBe('en');
  });

  it('falls back to default when navLangs is empty', () => {
    expect(resolveTourLocale([], ['en', 'fr'], 'en')).toBe('en');
  });
});
