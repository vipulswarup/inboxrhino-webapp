import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['examples/**', 'node_modules/**', 'dist/**', 'dist-worker/**'],
    css: false,
  },
});
