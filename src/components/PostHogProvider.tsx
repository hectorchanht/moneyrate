// Client-only PostHog bootstrap. Mounted once in the root layout; inits the
// SDK, then fires app_first_open exactly once per browser (localStorage flag)
// with non-PII context. $pageview/$pageleave are handled by the SDK itself.
'use client';

import { useEffect } from 'react';
import { initAnalytics, track } from '@/lib/analytics';

const FIRST_OPEN_FLAG = 'dawn_ph_first_open';

function firstOpenProps(): Record<string, string> {
  const props: Record<string, string> = {};
  try {
    if (document.referrer) props.referrer = new URL(document.referrer).hostname;
    const utm = new URLSearchParams(window.location.search).get('utm_source');
    if (utm) props.utm_source = utm;
    if (navigator.language) props.locale = navigator.language;
  } catch {
    // Hostname parsing must never break first-open tracking.
  }
  return props;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
    try {
      if (!localStorage.getItem(FIRST_OPEN_FLAG)) {
        localStorage.setItem(FIRST_OPEN_FLAG, '1');
        track('app_first_open', firstOpenProps());
      }
    } catch {
      // localStorage unavailable (private mode) — skip, don't crash.
    }
  }, []);

  return <>{children}</>;
}
