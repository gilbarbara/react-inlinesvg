import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      all: true,
      include: ['src/**/*.ts?(x)'],
      exclude: ['src/global.d.ts', 'src/types.ts'],
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/__setup__/vitest.setup.ts'],
  },
});
