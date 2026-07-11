import { beforeEach } from 'vitest';

// Node 25 ships an experimental built-in `localStorage` global whose methods are
// missing (`typeof localStorage.setItem === 'undefined'`). Under vitest's jsdom
// environment it shadows jsdom's real storage, so jotai's `atomWithStorage`
// resolves its default storage to that broken global and throws
// `TypeError: setItem is not a function` on the first persisted-atom write.
// Install a working in-memory Web Storage mock to beat it.

const createStorageMock = (): Storage => {
  const store = new Map<string, string>();

  const mock = {
    getItem(key: string): string | null {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    get length(): number {
      return store.size;
    },
  };

  // The DOM `Storage` type carries an index signature that a plain object
  // cannot implement directly; cast at the boundary.
  return mock as Storage;
};

const installStorage = (target: typeof globalThis, name: 'localStorage' | 'sessionStorage'): void => {
  // `configurable: true` lets this override replace Node 25's built-in and stay
  // replaceable across setup runs.
  Object.defineProperty(target, name, {
    value: createStorageMock(),
    configurable: true,
    writable: true,
  });
};

installStorage(globalThis, 'localStorage');
installStorage(globalThis, 'sessionStorage');

if (typeof window !== 'undefined' && (window as unknown) !== globalThis) {
  installStorage(window as unknown as typeof globalThis, 'localStorage');
  installStorage(window as unknown as typeof globalThis, 'sessionStorage');
}

// Reset storage between tests so persisted-atom state never bleeds across cases.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
