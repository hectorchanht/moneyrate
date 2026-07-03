'use client'; // Ensure this runs only on the client-side in Next.js App Router

import { useEffect, useState } from 'react';
import { debounce } from '@/lib/fns';

function useWindowWidth() {
  // Initialize with undefined or a fallback value for server-side rendering
  const [windowWidth, setWindowWidth] = useState<number>(888);

  useEffect(() => {
    // Only run on the client-side where window is available
    if (typeof window !== 'undefined') {
      // Debounce so a window drag-resize doesn't re-render the whole list on every pixel.
      const handleResize = debounce(() => setWindowWidth(window.innerWidth), 150);

      // Set initial width immediately (not debounced)
      setWindowWidth(window.innerWidth);

      // Add resize event listener
      window.addEventListener('resize', handleResize);

      // Cleanup listener on unmount
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []); // Empty dependency array ensures effect runs only on mount/unmount

  return windowWidth;
}

export default useWindowWidth;