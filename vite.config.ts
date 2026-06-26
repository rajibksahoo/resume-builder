import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { saveResumePlugin } from './vite/save-resume-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveResumePlugin()],
})
