'use client';

import { themeAtom } from '@/lib/atoms';
import { MoonSvg, SunSvg } from '@/lib/svgs';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);
  // Avoid a hydration mismatch: render the default (dark -> sun) until mounted,
  // then reflect the persisted theme.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isLight = mounted && theme === 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title="Toggle light/dark theme"
      aria-label="Toggle light/dark theme"
      className="h-[52px] w-[30px] shrink-0 flex items-center justify-center"
    >
      {isLight ? <MoonSvg /> : <SunSvg />}
    </button>
  );
}
