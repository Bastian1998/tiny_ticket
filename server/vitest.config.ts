import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // The first run downloads a MongoDB binary for mongodb-memory-server.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
