import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { build } from 'vite'

const dirs: string[] = []

async function buildInto(mode: string | undefined) {
  const outDir = mkdtempSync(join(tmpdir(), 'gymtracker-build-'))
  dirs.push(outDir)
  await build({ mode, logLevel: 'silent', build: { outDir, emptyOutDir: true } })
  return { html: readFileSync(join(outDir, 'index.html'), 'utf8'), has: (f: string) => existsSync(join(outDir, f)) }
}

afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

describe('build modes', () => {
  it('PWA build keeps the service worker and the GitHub Pages base path', async () => {
    const out = await buildInto(undefined)
    expect(out.has('sw.js')).toBe(true)
    expect(out.html).toContain('/gym-tracker-vibecoded/assets/')
  }, 60_000)

  it('Android build uses a relative base and has no service worker', async () => {
    const out = await buildInto('android')
    expect(out.has('sw.js')).toBe(false)
    expect(out.html).toContain('src="./assets/')
    expect(out.html).not.toContain('/gym-tracker-vibecoded/')
  }, 60_000)
})
