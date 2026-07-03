'use client';

import { useEffect } from 'react';

// Backstop for errors thrown in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="opacity-70">An unexpected error occurred. Please try again.</p>
          <button className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
