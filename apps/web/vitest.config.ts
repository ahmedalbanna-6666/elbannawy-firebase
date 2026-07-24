import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@el-bannawy/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@el-bannawy/lib': path.resolve(__dirname, '../../lib'),
    },
  },
});
