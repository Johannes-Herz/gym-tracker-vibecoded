import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionsFor } from '../stats/exerciseStats'
import { serializeBackup } from '../../storage/backup'
import { sets } from '../../storage/repo'
import { SESSION_TIMEOUT_MS, _resetSessionCache, expireSession, getSession } from '../../storage/session'
import { _resetCache, getState } from '../../storage/store'
import type { Exercise, Template } from '../../types'
import { templateEntries } from './fromTemplate'
import { recentExerciseIds } from './recent'
import {
  _resetDrafts,
  addExercise,
  addSet,
  confirmSet,
  currentSets,
  discardTraining,
  dropDraft,
  endTraining,
  endTrainingIfEmpty,
  moveBlock,
  removeExercise,
  removeSet,
  setNote,
  setStartedAt,
  startTraining,
  updateSet,
} from './training'

const template: Template = {
  id: 't1',
  name: 'Push Tag',
  exerciseIds: ['builtin-squat', 'builtin-bench-press'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const exercise = (id: string) => getState().exercises.find((e) => e.id === id) as Exercise

/** Simulates killing and reopening the app: all in-memory state is reloaded from localStorage. */
function reload() {
  _resetCache()
  _resetSessionCache()
  _resetDrafts()
}

function startFromTemplate(setsPerExercise = 3) {
  const entries = templateEntries(getState(), template).map((e) => ({
    ...e,
    sets: Array.from({ length: setsPerExercise }, () => ({ weight: 50, reps: 8 })),
  }))
  expect(startTraining({ startedAt: '2026-11-14T10:00:00.000Z', template, entries })).toBe(true)
}

const view = () => currentSets(null).map((s) => [s.exerciseId.replace('builtin-', ''), s.suggested ? 'S' : 'C'].join(':'))

beforeEach(() => {
  const mem = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  }
  reload()
})
afterEach(() => {
  vi.useRealTimers()
  delete (globalThis as { localStorage?: unknown }).localStorage
  reload()
})

describe('template training survives leaving the editor and an app reload', () => {
  it('before the first set: only the session exists, nothing in history', () => {
    startFromTemplate()
    expect(getState().workouts).toEqual([])
    expect(getState().sets).toEqual([])
    expect(view()).toEqual(['squat:S', 'squat:S', 'squat:S', 'bench-press:S', 'bench-press:S', 'bench-press:S'])
    // Opening Verlauf / switching tabs no longer touches it, and an app restart keeps it.
    reload()
    expect(getSession()).toMatchObject({ templateId: 't1', templateName: 'Push Tag' })
    expect(view()).toHaveLength(6)
    expect(getState().workouts).toEqual([])
  })

  it('after some confirmed sets: workout holds only those, the rest of the plan is intact and in order', () => {
    startFromTemplate()
    const [a, b] = currentSets(null)
    confirmSet(null, a.id)
    updateSet(null, b.id, { reps: 9 })
    expect(getState().workouts).toHaveLength(1)
    expect(getState().workouts[0]).toMatchObject({ templateId: 't1', templateName: 'Push Tag', startedAt: '2026-11-14T10:00:00.000Z' })
    expect(getState().sets.map((s) => [s.id, s.reps])).toEqual([[a.id, 8], [b.id, 9]])
    expect(view()).toEqual(['squat:C', 'squat:C', 'squat:S', 'bench-press:S', 'bench-press:S', 'bench-press:S'])
    reload()
    expect(view()).toEqual(['squat:C', 'squat:C', 'squat:S', 'bench-press:S', 'bench-press:S', 'bench-press:S'])
    expect(getSession()!.workoutId).toBe(getState().workouts[0].id)
  })

  it('with mostly unconfirmed sets, at any point, nothing is lost (logging set by set)', () => {
    startFromTemplate()
    const ids = currentSets(null).map((s) => s.id)
    for (const id of ids) {
      confirmSet(null, id)
      reload() // phone kills the app between every set
      expect(currentSets(null)).toHaveLength(ids.length)
      expect(getState().sets.map((s) => s.id)).toEqual(ids.slice(0, getState().sets.length))
    }
    expect(view().every((v) => v.endsWith(':C'))).toBe(true)
  })

  it('confirming out of order keeps the position of every set', () => {
    startFromTemplate(2)
    const [s1, s2, b1] = currentSets(null)
    confirmSet(null, s2.id)
    expect(currentSets(null).map((s) => s.id).slice(0, 3)).toEqual([s1.id, s2.id, b1.id])
    reload()
    expect(currentSets(null).map((s) => s.id).slice(0, 3)).toEqual([s1.id, s2.id, b1.id])
  })

  it('adding, moving and removing keeps confirmed sets and suggestions together', () => {
    startFromTemplate(2)
    confirmSet(null, currentSets(null)[0].id)
    addSet(null, exercise('builtin-squat'))
    expect(view().filter((v) => v.startsWith('squat'))).toEqual(['squat:C', 'squat:S', 'squat:S'])
    addExercise(null, exercise('builtin-deadlift'))
    moveBlock(null, 'builtin-deadlift', -1)
    moveBlock(null, 'builtin-deadlift', -1)
    expect(view()[0]).toBe('deadlift:S')
    reload()
    expect(view()[0]).toBe('deadlift:S')
    expect(view().filter((v) => v.startsWith('squat'))).toEqual(['squat:C', 'squat:S', 'squat:S'])
    removeExercise(null, 'builtin-squat')
    expect(view().some((v) => v.startsWith('squat'))).toBe(false)
    expect(getState().sets).toEqual([])
    expect(getState().workouts).toEqual([]) // lost its last set: not kept in history
  })

  it('date and note are kept before and after the workout exists', () => {
    startFromTemplate(1)
    setNote(null, 'before')
    setStartedAt(null, '2026-11-14T08:30:00.000Z')
    confirmSet(null, currentSets(null)[0].id)
    expect(getState().workouts[0]).toMatchObject({ note: 'before', startedAt: '2026-11-14T08:30:00.000Z' })
    setNote(null, 'after')
    expect(getState().workouts[0].note).toBe('after')
    expect(getSession()!.note).toBe('after')
  })

  it('removing the last confirmed set removes the workout again; confirming the next one recreates it', () => {
    startFromTemplate(2)
    const [a, b] = currentSets(null)
    confirmSet(null, a.id)
    const workoutId = getState().workouts[0].id
    removeSet(null, a.id)
    expect(getState().workouts).toEqual([])
    confirmSet(null, b.id)
    expect(getState().workouts[0].id).toBe(workoutId)
    expect(getState().sets).toHaveLength(1)
  })

  it('a crash between the two writes does not duplicate a set (the confirmed one wins)', () => {
    startFromTemplate(1)
    const [a] = currentSets(null)
    // data written, session not yet updated:
    confirmSet(null, a.id)
    const real = getState().sets[0]
    const s = getSession()!
    s.pending = [{ id: a.id, exerciseId: a.exerciseId, order: a.order, weight: 1, reps: 1 }, ...s.pending]
    expect(currentSets(null).filter((x) => x.id === a.id)).toEqual([real])
  })
})

describe('unconfirmed suggestions never reach history, stats or export', () => {
  it('not while only suggested', () => {
    startFromTemplate()
    const exported = serializeBackup(getState())
    for (const p of getSession()!.pending) expect(exported).not.toContain(p.id)
    expect(JSON.parse(exported).data.workouts).toEqual([])
    expect(JSON.parse(exported).data.sets).toEqual([])
    expect(sessionsFor(getState(), 'builtin-squat', { key: 'all' })).toEqual([])
    expect(recentExerciseIds(getState())).toEqual([])
  })

  it('only the confirmed set shows up once one is confirmed', () => {
    startFromTemplate()
    const [a, ...rest] = currentSets(null)
    confirmSet(null, a.id)
    const exported = JSON.parse(serializeBackup(getState()))
    expect(exported.data.sets.map((s: { id: string }) => s.id)).toEqual([a.id])
    expect(JSON.stringify(exported)).not.toContain(rest[0].id)
    expect(sessionsFor(getState(), 'builtin-squat', { key: 'all' })).toHaveLength(1)
    expect(recentExerciseIds(getState())).toEqual(['builtin-squat'])
  })
})

describe('ending the training', () => {
  it('"Training beenden" keeps the confirmed workout and drops the suggestions', () => {
    startFromTemplate()
    confirmSet(null, currentSets(null)[0].id)
    endTraining()
    expect(getSession()).toBeNull()
    expect(getState().workouts).toHaveLength(1)
    expect(getState().sets).toHaveLength(1)
    reload()
    expect(getSession()).toBeNull()
    expect(getState().sets).toHaveLength(1)
  })

  it('ending before the first confirmed set leaves no workout behind', () => {
    startFromTemplate()
    endTraining()
    expect(getState().workouts).toEqual([])
  })

  it('the timeout ends the session the same way', () => {
    startFromTemplate()
    confirmSet(null, currentSets(null)[0].id)
    const t0 = Date.parse(getSession()!.updatedAt)
    expect(expireSession(t0 + SESSION_TIMEOUT_MS + 1000)).toBe(true)
    expect(getSession()).toBeNull()
    expect(getState().workouts).toHaveLength(1)
    expect(getState().sets).toHaveLength(1)
  })

  it('an expired session found at app start is gone, the workout stays', () => {
    startFromTemplate()
    confirmSet(null, currentSets(null)[0].id)
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + SESSION_TIMEOUT_MS + 60_000)
    reload()
    expect(getSession()).toBeNull()
    expect(getState().sets).toHaveLength(1)
  })

  it('an empty session is ended when leaving the editor, a non-empty one is not', () => {
    startTraining({ startedAt: '2026-11-14T10:00:00.000Z', entries: [{ exerciseId: 'builtin-squat', sets: [{ weight: 0, reps: 0 }] }] })
    endTrainingIfEmpty()
    expect(getSession()).not.toBeNull()
    removeSet(null, currentSets(null)[0].id)
    endTrainingIfEmpty()
    expect(getSession()).toBeNull()
  })

  it('discardTraining deletes the workout and the session', () => {
    startFromTemplate()
    confirmSet(null, currentSets(null)[0].id)
    discardTraining()
    expect(getSession()).toBeNull()
    expect(getState().workouts).toEqual([])
    expect(getState().sets).toEqual([])
  })
})

describe('starting an empty workout uses the same mechanism', () => {
  it('first exercise starts a session without a workout; confirming creates it', () => {
    startTraining({ startedAt: '2026-11-14T10:00:00.000Z', entries: [{ exerciseId: 'builtin-squat', sets: [{ weight: 0, reps: 0 }] }] })
    expect(getSession()!.templateId).toBeUndefined()
    expect(getState().workouts).toEqual([])
    updateSet(null, currentSets(null)[0].id, { weight: 100, reps: 5 })
    expect(getState().workouts).toHaveLength(1)
    expect(getState().workouts[0].templateId).toBeUndefined()
  })

  it('does not start without sets', () => {
    expect(startTraining({ startedAt: '2026-11-14T10:00:00.000Z', entries: [] })).toBe(false)
    expect(getSession()).toBeNull()
  })
})

describe('editing a past workout does not start or touch a session', () => {
  const seedPast = () =>
    sets.addConfirmed(
      { id: 'o1', workoutId: 'old', exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5 },
      { id: 'old', startedAt: '2026-10-01T10:00:00.000Z' },
    )

  it('suggestions of a past workout live in memory only and are dropped when leaving', () => {
    seedPast()
    addSet('old', exercise('builtin-squat'))
    expect(currentSets('old').map((x) => !!x.suggested)).toEqual([false, true])
    expect(getState().sets).toHaveLength(1)
    expect(getSession()).toBeNull()
    expect(serializeBackup(getState())).not.toContain(currentSets('old')[1].id)
    dropDraft('old')
    expect(currentSets('old')).toHaveLength(1)
  })

  it('confirming there adds a real set to that workout and leaves a running session alone', () => {
    seedPast()
    startFromTemplate()
    const sessionBefore = JSON.stringify(getSession())
    addSet('old', exercise('builtin-squat'))
    updateSet('old', currentSets('old')[1].id, { reps: 6 })
    expect(getState().sets.filter((x) => x.workoutId === 'old').map((x) => x.reps)).toEqual([5, 6])
    expect(getState().workouts).toHaveLength(1)
    expect(JSON.stringify(getSession())).toBe(sessionBefore)
    expect(currentSets(null)).toHaveLength(6)
  })
})
