import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  workers: 1, // Safe sequential execution to avoid file write race conditions
  reporter: [['html', { open: 'never' }]],
});
