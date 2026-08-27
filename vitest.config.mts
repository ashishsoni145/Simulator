import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The science modules are pure functions, so the default node environment is
    // both correct and fast. Component tests opt into jsdom per-file with a
    // `// @vitest-environment jsdom` pragma.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/science/**/*.ts'],
      exclude: ['src/science/**/*.test.ts']
    }
  }
})
