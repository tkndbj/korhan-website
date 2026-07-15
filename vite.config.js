import { defineConfig } from 'vite'

export default defineConfig({
  // Frames live in /public and are copied verbatim to the build output,
  // so they are referenced by absolute URL (/frames/...) at runtime.
  server: {
    host: true,
    open: true,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
})
