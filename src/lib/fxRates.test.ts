import { describe, expect, it } from 'vitest';
import { pairFromTable, parseFrankfurterTable, round5sf } from './fxRates';

// Real Frankfurter v2 rows (fixing of 2026-11-16) — the cross values below
// are what the live per-pair endpoint returned for the same pairs that day.
const rows = [
  { date: '2026-11-16', base: 'USD', quote: 'EUR', rate: 0.90465 },
  { date: '2026-11-16', base: 'USD', quote: 'THB', rate: 33.889 },
  { date: '2026-11-16', base: 'USD', quote: 'JPY', rate: 159.87 },
  { date: '2026-11-16', base: 'USD', quote: 'CAD', rate: 1.4254 },
];

describe('round5sf', () => {
  it('rounds to 5 significant figures like Frankfurter publishes', () => {
    expect(round5sf(37.46089647930139)).toBe(37.461);
    expect(round5sf(1.1053998784060135)).toBe(1.1054);
    expect(round5sf(0.90465)).toBe(0.90465);
    expect(round5sf(159.87)).toBe(159.87);
  });
});

describe('parseFrankfurterTable', () => {
  it('parses rows into a per-quote table with dates', () => {
    const table = parseFrankfurterTable(rows);
    expect(table).not.toBeNull();
    expect(table!.date).toBe('2026-11-16');
    expect(table!.rates.EUR).toEqual({ rate: 0.90465, date: '2026-11-16' });
    expect(table!.rates.JPY.rate).toBe(159.87);
  });

  it('rejects non-array and empty payloads', () => {
    expect(parseFrankfurterTable({ date: '2026-11-16' })).toBeNull();
    expect(parseFrankfurterTable([])).toBeNull();
    expect(parseFrankfurterTable(null)).toBeNull();
  });

  it('skips unusable rows', () => {
    const table = parseFrankfurterTable([
      { date: '2026-11-16', base: 'USD', quote: 'EUR', rate: 0.90465 },
      { date: '2026-11-16', base: 'USD', quote: 'XXX', rate: 'nope' },
      { date: '2026-11-16', base: 'USD', quote: '', rate: 1 },
    ]);
    expect(Object.keys(table!.rates)).toEqual(['EUR']);
  });
});

describe('pairFromTable', () => {
  const table = parseFrankfurterTable(rows)!;

  it('returns USD pairs verbatim from the table', () => {
    expect(pairFromTable(table, 'USD', 'CAD')).toEqual({ rate: 1.4254, rateDate: '2026-11-16' });
    expect(pairFromTable(table, 'USD', 'JPY')).toEqual({ rate: 159.87, rateDate: '2026-11-16' });
  });

  it('inverts for X->USD and rounds to 5 s.f. (matches the per-pair endpoint)', () => {
    expect(pairFromTable(table, 'EUR', 'USD')).toEqual({ rate: 1.1054, rateDate: '2026-11-16' });
  });

  it('crosses two non-USD legs and rounds to 5 s.f. (matches the per-pair endpoint)', () => {
    expect(pairFromTable(table, 'EUR', 'THB')).toEqual({ rate: 37.461, rateDate: '2026-11-16' });
  });

  it('returns null for codes the table lacks (route falls back)', () => {
    expect(pairFromTable(table, 'USD', 'ZZZ')).toBeNull();
    expect(pairFromTable(table, 'ZZZ', 'USD')).toBeNull();
  });

  it('dates a cross by its stalest leg, never newer than the data', () => {
    const mixed = parseFrankfurterTable([
      { date: '2026-11-16', base: 'USD', quote: 'EUR', rate: 0.90465 },
      { date: '2026-11-13', base: 'USD', quote: 'THB', rate: 33.889 },
    ])!;
    expect(pairFromTable(mixed, 'EUR', 'THB')!.rateDate).toBe('2026-11-13');
    expect(pairFromTable(mixed, 'USD', 'THB')!.rateDate).toBe('2026-11-13');
  });
});
