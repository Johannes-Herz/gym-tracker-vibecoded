import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guard against UI text that bypasses the dictionaries. Heuristic, not a proof:
 * it flags German words with umlauts, single-line JSX text and text in
 * aria-label / placeholder / title / label attributes outside src/i18n.
 */
const ROOT = join(__dirname, '..')

// Stored (language-neutral) German values; shown through labels, never directly.
const STORED_VALUES = new Set(['Rücken', 'Körpergewicht'])

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'i18n' ? [] : sourceFiles(path)
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return []
    if (entry.name === 'builtinExercises.ts') return [] // catalog: German names are data
    return [path]
  })
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

describe('no hardcoded UI text outside the dictionaries', () => {
  const files = sourceFiles(ROOT)

  it('scans the source tree', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it('has no German words with umlauts (except stored values)', () => {
    const found: string[] = []
    for (const file of files) {
      const code = withoutComments(readFileSync(file, 'utf8'))
      for (const word of code.match(/[\p{L}]*[äöüÄÖÜß][\p{L}]*/gu) ?? []) {
        if (!STORED_VALUES.has(word)) found.push(`${file.slice(ROOT.length + 1)}: ${word}`)
      }
    }
    expect(found).toEqual([])
  })

  it('has no literal text in JSX or in label-like attributes', () => {
    const found: string[] = []
    for (const file of files.filter((f) => f.endsWith('.tsx'))) {
      const code = withoutComments(readFileSync(file, 'utf8'))
      code.split('\n').forEach((line, i) => {
        const jsxText = /<[A-Za-z][^<>]*>\s*[^<>{}\s][^<>{}]*[A-Za-z]{3,}[^<>{}]*<\//.test(line)
        const attr = /\b(aria-label|placeholder|title|label|alt)="[^"{}]*[A-Za-z]{2,}[^"{}]*"/.test(line)
        if (jsxText || attr) found.push(`${file.slice(ROOT.length + 1)}:${i + 1}: ${line.trim()}`)
      })
    }
    expect(found).toEqual([])
  })
})
