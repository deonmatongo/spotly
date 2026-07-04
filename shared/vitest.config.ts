import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
})
