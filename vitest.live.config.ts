import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.live.spec.ts'],
    exclude: ['**/misc/**', '**/node_modules/**'],
    setupFiles: ['./tests/setup.live.ts'],
  },
})
