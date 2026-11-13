import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/gym-tracker-vibecoded/',
  plugins: [react()],
  test: { environment: 'node' },
})
