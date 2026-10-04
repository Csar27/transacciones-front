import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

/**
 * El proxy no es opcional: la API solo acepta CORS desde localhost:4200 (Angular)
 * y localhost:5173. Vite arranca en 5173, asi que sin proxy el navegador
 * bloquea cada llamada.
 *
 * Por eso VITE_API_URL es "/api" (relativo) y no la URL absoluta de la API:
 * lo relativo sale del mismo origen que el servidor de Vite y lo resuelve el proxy.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const objetivo = env.VITE_PROXY_TARGET || 'http://localhost:5250'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: objetivo,
          changeOrigin: true,
        },
      },
    },
    build: {
      // El aviso de peso se deja en un valor alto a proposito: el bundle grande es
      // el proveedor de iconos, que se tree-shakea bien. Un limite bajo aqui solo
      // genera ruido en consola sin señalar un problema real.
      chunkSizeWarningLimit: 700,
    },
    test: {
      // Solo se prueban funciones puras: normalizacion de errores, validacion,
      // tabla de estados y fechas. No hay tests de componentes, asi que no hace
      // falta cargar jsdom.
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  }
})