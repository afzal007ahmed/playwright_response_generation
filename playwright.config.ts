import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  workers: 4, // Optimal parallel execution for large test sets (e.g. 500 cases)
  reporter: [
    ['html', { open: 'never' }],
    ['./customReporter.ts'] // Custom thread-safe reporter to write responses
  ],
});
