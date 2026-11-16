import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('safe areas', () => {
  it('components use the --safe-* variables, never raw env(), so the Android app is covered too', () => {
    expect(readFileSync('src/styles/components.css', 'utf8')).not.toMatch(/env\(safe-area/)
  })

  it('the page is padded below the status bar and the viewport covers the cutout', () => {
    const base = readFileSync('src/styles/base.css', 'utf8')
    expect(base).toMatch(/\.page \{[^}]*var\(--safe-top\)/)
    expect(readFileSync('index.html', 'utf8')).toContain('viewport-fit=cover')
  })
})
