'use client';

import { hapticsAtom, themeModeAtom } from '@/lib/atoms';
import { vibrate } from '@/lib/fns';
import { MonitorSvg, MoonSvg, SunSvg } from '@/lib/svgs';
import type { ThemeMode } from '@/lib/types';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

const NEXT_MODE: Record<ThemeMode, ThemeMode> = { dark: 'light', light: 'system', system: 'dark' };

// One-tap theme cycler: dark -> light -> system -> dark.
// The icon always shows the CURRENT state (moon = dark, sun = light,
// monitor = system) — never the action — so all three states read distinctly.
export default function ThemeToggle() {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const haptics = useAtomValue(hapticsAtom);
  // Avoid a hydration mismatch: render the default until mounted,
  // then reflect the persisted preference.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mode: ThemeMode = mounted ? themeMode : 'dark';

  return (
    <button
      type="button"
      onClick={() => { vibrate(haptics); setThemeMode(NEXT_MODE[themeMode]); }}
      title={`Theme: ${mode} (tap to change)`}
      aria-label={`Theme: ${mode} (tap to change)`}
      data-tour="tour-theme-toggle"
      className="h-[44px] w-[44px] shrink-0 flex items-center justify-center"
    >
      {mode === 'dark' ? <MoonSvg /> : mode === 'light' ? <SunSvg /> : <MonitorSvg />}
    </button>
  );
}
