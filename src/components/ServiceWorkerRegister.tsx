'use client';

import { useEffect } from 'react';

// Registers the offline service worker. Production only — a SW in dev fights HMR
// and serves stale chunks.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // registration failing shouldn't break the app
      });
    }
  }, []);

  return null;
}
