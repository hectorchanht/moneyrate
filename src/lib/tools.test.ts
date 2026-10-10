import { describe, expect, it } from 'vitest';
import { crossPctChange, parseBatchAmounts, spreadPct, tripSplit } from './tools';

describe('parseBatchAmounts', () => {
  it('parses one amount per line', () => {
    expect(parseBatchAmounts('120\n1000\n55.5')).toEqual([120, 1000, 55.5]);
  });
  it('treats every comma as a separator, never a thousand separator', () => {
    expect(parseBatchAmounts('1,000\n$55.50\n€ 20')).toEqual([1, 55.5, 20]);
  });
  it('parses "4,600" as 4 and 600', () => {
    expect(parseBatchAmounts('1,4,600')).toEqual([1, 4, 600]);
  });
  it('splits on commas and semicolons too', () => {
    expect(parseBatchAmounts('10, 20;30')).toEqual([10, 20, 30]);
  });
  it('skips blanks, junk and non-positive values', () => {
    expect(parseBatchAmounts('\nabc\n0\n-5\n42')).toEqual([42]);
  });
});

describe('spreadPct', () => {
  it('is negative when the shop quote sits below market', () => {
    expect(spreadPct(19.5, 20.1)).toBeCloseTo(-2.985, 2);
  });
  it('is positive when the shop quote is worse (above market)', () => {
    expect(spreadPct(21, 20)).toBeCloseTo(5, 6);
  });
  it('returns NaN for a non-positive market rate', () => {
    expect(spreadPct(19.5, 0)).toBeNaN();
  });
});

describe('tripSplit', () => {
  it('splits budget into net + fee', () => {
    expect(tripSplit(1000, 2.5)).toEqual({ net: 975, fee: 25 });
  });
  it('handles zero fee', () => {
    expect(tripSplit(1000, 0)).toEqual({ net: 1000, fee: 0 });
  });
});

describe('crossPctChange', () => {
  // chg = 24h % change of (1 base = X code); base USD.
  const chg = { jpy: 2, eur: -1, hkd: 0.5 };
  it('uses changePctByCur directly when from is the base', () => {
    expect(crossPctChange(chg, 'USD', 'jpy', 'USD')).toBeCloseTo(2, 9);
  });
  it('derives the cross move when neither leg is the base', () => {
    // (1.02 / 0.99 - 1) * 100 ≈ 3.0303
    expect(crossPctChange(chg, 'eur', 'jpy', 'USD')).toBeCloseTo(3.0303, 3);
  });
  it('returns undefined when a leg is missing', () => {
    expect(crossPctChange(chg, 'USD', 'gbp', 'USD')).toBeUndefined();
  });
  it('is case-insensitive', () => {
    expect(crossPctChange(chg, 'usd', 'JPY', 'usd')).toBeCloseTo(2, 9);
  });
});
