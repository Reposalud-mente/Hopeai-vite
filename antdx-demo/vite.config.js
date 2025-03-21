import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Para habilitar polyfills específicos
      include: ['async_hooks'],
      // Opciones de overrides para personalizar comportamientos específicos
      overrides: {
        // Por ejemplo, proporcionar una implementación personalizada
        async_hooks: true
      },
    }),
  ],
  resolve: {
    alias: {
      // Asegurar que los módulos node: específicos sean manejados correctamente
      'node:async_hooks': 'async_hooks'
    }
  }
})
