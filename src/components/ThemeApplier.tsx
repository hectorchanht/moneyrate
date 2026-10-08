'use client';

import { themeModeAtom } from '@/lib/atoms';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

// Applies the persisted theme preference to <html data-theme> on every route.
// 'system' follows the OS via matchMedia and re-applies live when the OS
// theme flips (e.g. sunset auto-dark). Renders nothing, so there's no
// SSR/hydration output to mismatch.
export default function ThemeApplier() {
  const themeMode = useAtomValue(themeModeAtom);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = themeMode === 'system' ? (mq.matches ? 'dark' : 'light') : themeMode;
      document.documentElement.setAttribute('data-theme', resolved);
    };
    apply();
    if (themeMode !== 'system') return;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themeMode]);

  return null;
}
