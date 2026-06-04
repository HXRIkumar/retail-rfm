import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/types.ts'],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 100,
        lines: 95,
      },
    },
  },
});
