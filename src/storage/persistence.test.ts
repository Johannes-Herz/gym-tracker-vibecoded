import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StorageAdapter } from './adapter'
import { setStorage } from './adapter'
import { createAutoBackup, BACKUP_DIR } from './autoBackup'
import { fakeFiles } from './fakeFiles'
import { flushOnBackground } from './lifecycle'
import { openNativeStorage, type NativeStorage } from './nativeStorage'
import { loadHistoryView, loadLanguage, loadStatsRange, loadTrendMetric, saveHistoryView, saveLanguage, saveStatsRange, saveTrendMetric } from './preferences'
import { bodyWeights, exercises, sets, templates, workouts } from './repo'
import { _resetSessionCache, clearSession, getSession, startSession, updateSession } from './session'
import { _resetCache, getState, subscribe } from './store'
import { replaceAllData, deleteAllData } from './backup'
import { emptyData } from './storage'

const DATA_FILE = 'store/gymtracker.v1.dat'
const SESSION_FILE = 'store/gymtracker.session.dat'
const PREFS_FILE = 'store/gymtracker.prefs.dat'

type Disk = Map<string, string>
const json = (disk: Disk, file: string) => JSON.parse(disk.get(file) ?? 'null')

/** Opens the native adapter over `files` and installs it, like `initStorage` does on the phone. */
async function boot(files: ReturnType<typeof fakeFiles>): Promise<NativeStorage> {
  const opened = await openNativeStorage(files.api)
  setStorage(opened.storage)
  _resetCache()
  _resetSessionCache()
  return opened
}

/** A process kill: everything in memory is gone, only the files remain. */
function kill(): void {
  setStorage(null)
  _resetCache()
  _resetSessionCache()
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  kill()
})

describe('every data-changing action is persisted through the adapter', () => {
  it('writes the data key for each repository action', async () => {
    const files = fakeFiles()
    const opened = await boot(files)
    const writes: string[] = []
    const spy: StorageAdapter = {
      getItem: (k) => opened.storage.getItem(k),
      setItem: (k, v) => {
        writes.push(k)
        opened.storage.setItem(k, v)
      },
      removeItem: (k) => opened.storage.removeItem(k),
    }
    setStorage(spy)

    const ex = exercises.add({ name: 'Zottman Curl', muscleGroup: 'arms', category: 'Isolation' } as never)
    const w = workouts.add('2026-01-01T10:00:00.000Z')
    const actions: Array<[string, () => void]> = [
      ['exercises.update', () => void exercises.update(ex.id, { name: 'Zottman Curl 2', muscleGroup: 'arms', category: 'Isolation' } as never)],
      ['exercises.setHidden', () => void exercises.setHidden('builtin-bench-press', true)],
      ['templates.add', () => void templates.add('Push', [ex.id])],
      ['workouts.update', () => workouts.update(w.id, { note: 'felt good' })],
      ['sets.add', () => void sets.add({ workoutId: w.id, exerciseId: ex.id, weight: 10, reps: 8 })],
      ['sets.addConfirmed', () => sets.addConfirmed({ id: 's2', workoutId: w.id, exerciseId: ex.id, order: 1, weight: 12, reps: 6 })],
      ['bodyWeights.save', () => bodyWeights.save('2026-01-01', 80)],
      ['bodyWeights.remove', () => bodyWeights.remove(getState().bodyWeights[0].id)],
      ['workouts.remove', () => workouts.remove(w.id)],
      ['exercises.remove', () => expect(exercises.remove(exercises.add({ name: 'Temp', muscleGroup: 'arms', category: 'Isolation' } as never).id)).toBe(true)],
      ['replaceAllData', () => replaceAllData(emptyData())],
      ['deleteAllData', () => deleteAllData()],
    ]
    for (const [name, run] of actions) {
      writes.length = 0
      run()
      expect(writes, name).toContain('gymtracker:v1')
    }
  })

  it('writes session and preferences through the adapter too', async () => {
    const files = fakeFiles()
    const opened = await boot(files)
    startSession({ startedAt: '2026-01-01T10:00:00.000Z', pending: [] })
    updateSession((s) => ({ ...s, note: 'n' }))
    saveLanguage('en')
    saveHistoryView('calendar')
    saveStatsRange({ key: '3m' })
    saveTrendMetric('weighted', 'volume')
    await opened.flush()
    expect(json(files.disk, SESSION_FILE).note).toBe('n')
    const prefs = json(files.disk, PREFS_FILE)
    expect(prefs).toMatchObject({ language: 'en', historyView: 'calendar', statsRange: { key: '3m' } })
    clearSession()
    await opened.flush()
    expect(files.disk.has(SESSION_FILE)).toBe(false)
  })

  it('app code never touches localStorage directly (only the adapter does)', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) walk(path)
        else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !path.endsWith(join('storage', 'adapter.ts'))) {
          if (/\b(localStorage|sessionStorage|indexedDB)\b/.test(readFileSync(path, 'utf8').replace(/\/\/.*$/gm, ''))) offenders.push(path)
        }
      }
    }
    walk('src')
    expect(offenders).toEqual([])
  })
})

describe('flush when the app goes to the background', () => {
  function targets() {
    const handlers = new Map<string, Array<(arg?: { isActive?: boolean }) => void>>()
    const reg = (kind: string) => (type: string, l: (arg?: { isActive?: boolean }) => void) => {
      handlers.set(`${kind}:${type}`, [...(handlers.get(`${kind}:${type}`) ?? []), l])
    }
    const doc = { visibilityState: 'visible', addEventListener: (t: string, l: () => void) => reg('doc')(t, l) }
    const win = { addEventListener: (t: string, l: () => void) => reg('win')(t, l) }
    const app = { addListener: (t: string, l: (s?: { isActive?: boolean }) => void) => reg('app')(t, l) }
    const fire = (key: string, arg?: { isActive?: boolean }) => handlers.get(key)?.forEach((l) => l(arg))
    return { doc, win, app, fire }
  }

  it.each([
    ['page hidden', (t: ReturnType<typeof targets>) => { t.doc.visibilityState = 'hidden'; t.fire('doc:visibilitychange') }],
    ['pagehide', (t: ReturnType<typeof targets>) => t.fire('win:pagehide')],
    ['native pause', (t: ReturnType<typeof targets>) => t.fire('app:pause')],
    ['native appStateChange to inactive', (t: ReturnType<typeof targets>) => t.fire('app:appStateChange', { isActive: false })],
  ])('flushes on %s', (_name, trigger) => {
    const flush = vi.fn()
    const t = targets()
    flushOnBackground(flush, t)
    trigger(t)
    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('does not flush when the app becomes visible or active again', () => {
    const flush = vi.fn()
    const t = targets()
    flushOnBackground(flush, t)
    t.fire('doc:visibilitychange') // still 'visible'
    t.fire('app:appStateChange', { isActive: true })
    expect(flush).not.toHaveBeenCalled()
  })
})

describe('kill and reopen (mocked)', () => {
  it('restores data, active session and preferences after the app is killed right after a change', async () => {
    const files = fakeFiles()
    const opened = await boot(files)
    const t = { handlers: [] as Array<() => void> }
    flushOnBackground(() => void opened.flush(), {
      doc: { visibilityState: 'hidden', addEventListener: () => {} },
      win: { addEventListener: () => {} },
      app: { addListener: (_e, l) => void t.handlers.push(l as () => void) },
    })

    exercises.setHidden('builtin-bench-press', true)
    bodyWeights.save('2026-02-01', 81.5)
    const tpl = templates.add('Pull', [])
    startSession({ startedAt: '2026-02-01T09:00:00.000Z', pending: [{ id: 'p1', exerciseId: 'builtin-bench-press', order: 0, weight: 60, reps: 8 }] })
    saveLanguage('en')
    saveHistoryView('calendar')

    t.handlers.forEach((h) => h()) // native pause
    await vi.runAllTimersAsync()
    kill() // the OS kills the process; no further code runs

    await boot(files) // reopen
    const data = getState()
    expect(data.exercises.find((e) => e.id === 'builtin-bench-press')?.hidden).toBe(true)
    expect(data.bodyWeights).toMatchObject([{ date: '2026-02-01', weightKg: 81.5 }])
    expect(data.templates.map((x) => x.id)).toEqual([tpl.id])
    expect(getSession()?.pending).toHaveLength(1)
    expect(loadLanguage()).toBe('en')
    expect(loadHistoryView()).toBe('calendar')
    expect(loadStatsRange()).toEqual({ key: '1m' })
    expect(loadTrendMetric('weighted', ['weight', 'volume'] as const)).toBe('weight')
  })

  it('keeps the previous state when the kill happens while a write is half done', async () => {
    const files = fakeFiles()
    const opened = await boot(files)
    bodyWeights.save('2026-02-01', 80)
    await opened.flush()
    files.fail.on = (op, path) => op === 'rename' && path.endsWith('.tmp') // crash before the rename
    bodyWeights.save('2026-02-02', 81)
    await vi.runAllTimersAsync()
    kill()
    files.fail.on = () => false
    await boot(files)
    expect(getState().bodyWeights.map((b) => b.date)).toEqual(['2026-02-01'])
  })
})

describe('automatic backup file', () => {
  it('is written after changes, flushed on pause, and rotates to the last 3', async () => {
    const internal = fakeFiles()
    const docs = fakeFiles()
    const opened = await boot(internal)
    let tick = 0
    const backup = createAutoBackup({ files: docs.api, getData: getState, now: () => new Date(2026, 0, 1, 12, 0, tick++) })
    subscribe(backup.notify)

    for (let i = 1; i <= 5; i++) {
      bodyWeights.save(`2026-03-0${i}`, 80 + i)
      await backup.flush() // what a pause does
    }
    await opened.flush()
    const names = [...docs.disk.keys()].sort()
    expect(names).toHaveLength(3)
    expect(names.every((n) => n.startsWith(`${BACKUP_DIR}/gym-tracker-backup-`))).toBe(true)
    const newest = JSON.parse(docs.disk.get(names[2])!)
    expect(JSON.stringify(newest)).toContain('2026-03-05')
    expect(JSON.stringify(json(internal.disk, DATA_FILE))).toContain('2026-03-05')
  })
})
