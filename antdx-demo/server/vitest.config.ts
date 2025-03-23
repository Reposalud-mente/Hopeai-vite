/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'server/tests/setup.ts',
      ],
    },
    testTimeout: 30000, // 30 segundos para pruebas individuales
    hookTimeout: 30000, // 30 segundos para hooks (beforeAll, afterAll, etc)
    setupFiles: ['server/test/setup.ts'],
    pool: 'forks', // Usar forks para mejor aislamiento
    maxConcurrency: 1 // Ejecutar pruebas de integración en serie
  },
  resolve: {
    alias: {
      '@server': resolve(__dirname, './server')
    }
  }
}); 