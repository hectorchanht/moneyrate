'use client';

import { themeAtom } from '@/lib/atoms';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

// Applies the persisted theme to <html data-theme> on every route.
// Renders nothing, so there's no SSR/hydration output to mismatch.
export default function ThemeApplier() {
  const theme = useAtomValue(themeAtom);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
