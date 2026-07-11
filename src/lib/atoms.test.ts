import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PERSISTED_ATOM_KEYS } from './atoms';

// Extract every storage key from the atomWithStorage<...>('<key>', ...) calls in
// the atoms.ts source. The generic segment never contains a '>' for these types,
// so [^>]* is a safe match up to the opening paren.
const readAtomStorageKeys = (): string[] => {
  const source = fs.readFileSync(fileURLToPath(new URL('./atoms.ts', import.meta.url)), 'utf8');
  const keys: string[] = [];
  const re = /atomWithStorage<[^>]*>\(\s*'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    keys.push(match[1]);
  }
  return keys;
};

describe('PERSISTED_ATOM_KEYS drift guard', () => {
  it('lists exactly the atomWithStorage keys in declaration order', () => {
    expect(readAtomStorageKeys()).toEqual([...PERSISTED_ATOM_KEYS]);
  });

  it('includes tourSeen and showDatePicker so Reset clears them', () => {
    expect(PERSISTED_ATOM_KEYS).toContain('tourSeen');
    expect(PERSISTED_ATOM_KEYS).toContain('showDatePicker');
  });

  it('has 12 unique entries', () => {
    expect(PERSISTED_ATOM_KEYS).toHaveLength(12);
    expect(new Set(PERSISTED_ATOM_KEYS).size).toBe(PERSISTED_ATOM_KEYS.length);
  });
});
