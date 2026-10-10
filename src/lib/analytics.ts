// PostHog product analytics — moneyrate (Dawn Studio, shared "Default project").
// Browser-only: never imported by server components/routes. initAnalytics()
// is called once from <PostHogProvider/> on the client root.
// - autocapture OFF, session replay OFF, no identify() (anonymous only)
// - every event carries super property {app: 'moneyrate'}
// - key/host: NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST, falling
//   back to the hardcoded public client key (safe to embed in bundles).
import posthog from 'posthog-js';

const FALLBACK_KEY = 'phc_Dn2EebGR8eVrLKfQwArtfwxE4cUKQq2NPhwMRph4LqUf';
const FALLBACK_HOST = 'https://us.i.posthog.com';

let initialized = false;

export function initAnalytics(): void {
  if (typeof window === 'undefined' || initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || FALLBACK_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || FALLBACK_HOST;
  if (!key) return;
  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
  });
  // CRITICAL: the shared project splits per-app dashboards on this property.
  posthog.register({ app: 'moneyrate' });
  initialized = true;
}

// Fire-and-forget event. No-op on the server or before init. NO PII ever —
// never pass emails, names, keys, or raw user input as properties.
export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !initialized) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the app.
  }
}

// Bucket a conversion amount so we never log raw user input.
export function amountBucket(amount: number): string {
  if (!isFinite(amount)) return 'unknown';
  const a = Math.abs(amount);
  if (a === 0) return '0';
  if (a < 1) return '<1';
  if (a < 10) return '1-10';
  if (a < 100) return '10-100';
  if (a < 1000) return '100-1000';
  if (a < 10000) return '1k-10k';
  return '10k+';
}
