import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

// Behavior tests render the real tool components (jsdom) and assert outputs.
// The @ alias matches tsconfig so tools resolve '@/components/...'.
export default defineConfig({
  resolve: {
    alias: { '@': resolve(process.cwd()) },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    testTimeout: 15000,
  },
})
