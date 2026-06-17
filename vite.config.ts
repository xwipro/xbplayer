import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'XbPlayer',
      formats: ['iife', 'umd', 'es'],
      fileName: (format) => `xbplayer.${format}.js`,
    },
  },
})
