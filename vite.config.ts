import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
// @ts-ignore - manifest is a JSON file
import manifest from './manifest.json'

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    host: '127.0.0.1',
    origin: 'http://127.0.0.1:5174',
    hmr: {
      clientPort: 5174,
    },
  },
  plugins: [
    react(),
    crx({ manifest: manifest as any }),
  ],
})
