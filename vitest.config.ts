import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/__tests__/**/*.test.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      include: [
        'packages/sdk/src/**/*.ts',
        'packages/cli/src/utils/**/*.ts',
        'packages/mcp-server/src/utils/**/*.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/dist/**',
        '**/index.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
