/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Configuración común para todos los tests
const commonConfig = {
  globals: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/tests/setup.ts',
    ],
  }
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  test: {
    ...commonConfig,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '!server/**/*.test.*' // Excluir tests del servidor
    ],
    deps: {
      inline: [
        'antd',
        'react-router-dom',
        '@ant-design/icons',
        '@testing-library/react'
      ]
    }
  }
}); 