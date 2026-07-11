import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Default to node; component tests opt into jsdom via a `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Installs an in-memory Web Storage mock before every test (see vitest.setup.ts).
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
