// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    timeout:     30_000,          // 30s por test (migraciones + DB)
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include:  ['src/**/*.ts'],
      exclude:  ['src/server.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines:     60,
        functions: 60,
        branches:  50,
      },
    },
    // Un worker a la vez para evitar conflictos de DB
    pool:        'forks',
    poolOptions: { forks: { singleFork: true } },
    // Archivos de test
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
