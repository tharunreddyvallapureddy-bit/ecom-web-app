import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // If deploying to https://<USERNAME>.github.io/<REPO-NAME>/, 
  // uncomment the line below and set it to your repository name:
  // base: '/<REPO-NAME>/',
})

