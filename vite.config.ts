import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Load `.env*` from the project root (same folder as this config), same as Vite default but explicit.
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), tailwindcss()],
})
