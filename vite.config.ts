import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin()],
  server: {
    fs: {
      allow: ['..', '.']
    },
    middlewareMode: false,
    origin: 'http://localhost:5173'
  }
})
