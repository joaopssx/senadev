import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2022',
    // Three.js is one lazy chunk loaded after the content, so its size doesn't affect first paint.
    chunkSizeWarningLimit: 600,
  },
})
