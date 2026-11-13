import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const STATIC_FILES = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']

/** Emits sw.js with the list of all built assets so the app works offline. */
function serviceWorker(): Plugin {
  return {
    name: 'gymtracker-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = [...STATIC_FILES, ...Object.keys(bundle)]
      const version = createHash('sha256').update(files.join('|')).digest('hex').slice(0, 10)
      const template = readFileSync(new URL('./sw/sw.template.js', import.meta.url), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace('__VERSION__', version)
          .replace('__PRECACHE__', JSON.stringify(files)),
      })
    },
  }
}

export default defineConfig({
  base: '/gym-tracker-vibecoded/',
  plugins: [react(), serviceWorker()],
  test: { environment: 'node' },
})
