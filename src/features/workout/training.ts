import { useSyncExternalStore } from 'react'
import { moveExercise } from '../../lib/exerciseOrder'
import { newId } from '../../lib/id'
import { sets as setsRepo, workouts as workoutsRepo, type SetValues } from '../../storage/repo'
import {
  clearSession,
  getSession,
  startSession,
  updateSession,
  useSession,
  type PendingSet,
  type Session,
} from '../../storage/session'
import { getState, useStore } from '../../storage/store'
import type { AppData, Exercise, Template, Workout, WorkoutSet } from '../../types'
import { valuesOf, initialValues } from './prefill'
import type { TemplateEntry } from './fromTemplate'

/**
 * Where an editor keeps its unconfirmed sets:
 * - `null`: the active training session (persisted, survives navigation and restarts)
 * - a workout id: a past workout opened from Verlauf; suggestions are only kept in memory
 *   while the editor is open and never touch the session.
 */
export type Scope = string | null

/** Route id of the active training (a real workout id never looks like this). */
export const ACTIVE_ID = 'aktiv'

/** A set as the editor shows it: confirmed (real) or still a suggestion. */
export type EditorSet = WorkoutSet & { suggested?: true }

export interface EditorMeta {
  startedAt: string
  note?: string
  templateName?: string
}

// ---- in-memory drafts for past workouts -----------------------------------

const drafts = new Map<string, PendingSet[]>()
const draftListeners = new Set<() => void>()
let draftVersion = 0

function notifyDrafts(): void {
  draftVersion++
  draftListeners.forEach((l) => l())
}

function subscribeDrafts(listener: () => void): () => void {
  draftListeners.add(listener)
  return () => draftListeners.delete(listener)
}

/** Forgets the suggestions of a past workout (its editor was closed). */
export function dropDraft(workoutId: string): void {
  if (drafts.delete(workoutId)) notifyDrafts()
}

/** For tests. */
export function _resetDrafts(): void {
  drafts.clear()
  notifyDrafts()
}

// ---- reading ----------------------------------------------------------------

function pendingOf(scope: Scope): PendingSet[] {
  return scope === null ? (getSession()?.pending ?? []) : (drafts.get(scope) ?? [])
}

/** Id of the real workout behind a scope, if it exists. */
function workoutIdOf(scope: Scope, data: AppData = getState()): string | undefined {
  const id = scope === null ? getSession()?.workoutId : scope
  return id !== undefined && data.workouts.some((w) => w.id === id) ? id : undefined
}

/** Confirmed sets of the workout plus the pending suggestions, in display order. */
export function mergeSets(real: WorkoutSet[], pending: PendingSet[], workoutId: string): EditorSet[] {
  const confirmed = new Set(real.map((s) => s.id))
  const suggestions = pending
    .filter((p) => !confirmed.has(p.id)) // a confirmed set always wins (crash between the two writes)
    .map((p): EditorSet => ({ ...p, workoutId, suggested: true }))
  return [...real, ...suggestions].sort((a, b) => a.order - b.order)
}

export function currentSets(scope: Scope): EditorSet[] {
  const wid = workoutIdOf(scope)
  const real = wid ? getState().sets.filter((s) => s.workoutId === wid) : []
  return mergeSets(real, pendingOf(scope), wid ?? '')
}

export function metaOf(data: AppData, session: Session | null, scope: Scope): EditorMeta | null {
  if (scope === null) {
    return session && { startedAt: session.startedAt, note: session.note, templateName: session.templateName }
  }
  const w = data.workouts.find((x) => x.id === scope)
  return w ? { startedAt: w.startedAt, note: w.note, templateName: w.templateName } : null
}

/** Everything an editor renders: all sets (confirmed + suggested) and the workout meta data. */
export function useTraining(scope: Scope): { sets: EditorSet[]; meta: EditorMeta | null } {
  const data = useStore()
  const session = useSession()
  useSyncExternalStore(subscribeDrafts, () => draftVersion)
  const wid = scope === null ? session?.workoutId : scope
  const real = wid ? data.sets.filter((s) => s.workoutId === wid) : []
  const pending = scope === null ? (session?.pending ?? []) : (drafts.get(scope) ?? [])
  return { sets: mergeSets(real, pending, wid ?? ''), meta: metaOf(data, session, scope) }
}

// ---- writing ----------------------------------------------------------------

function setPending(scope: Scope, fn: (pending: PendingSet[]) => PendingSet[]): void {
  if (scope === null) {
    updateSession((s) => ({ ...s, pending: fn(s.pending) }))
  } else {
    drafts.set(scope, fn(drafts.get(scope) ?? []))
    notifyDrafts()
  }
}

/** Marks activity on the session (resets its timeout) when a real set of it was edited. */
function touch(scope: Scope): void {
  if (scope === null) updateSession((s) => s)
}

function nextOrder(scope: Scope): number {
  return currentSets(scope).reduce((max, s) => Math.max(max, s.order), -1) + 1
}

function addPending(scope: Scope, exercise: Exercise): void {
  const values = initialValues(getState(), workoutIdOf(scope) ?? '', exercise, currentSets(scope))
  const set: PendingSet = { id: newId(), exerciseId: exercise.id, order: nextOrder(scope), ...values }
  setPending(scope, (p) => [...p, set])
}

/** Adds a new suggested set to an exercise that is already in the workout. */
export function addSet(scope: Scope, exercise: Exercise): void {
  addPending(scope, exercise)
}

/** Adds an exercise with one suggested set. */
export function addExercise(scope: Scope, exercise: Exercise): void {
  addPending(scope, exercise)
}

/**
 * Confirms a suggestion (optionally with edited values): it becomes a real set. In
 * the active session the real workout is created together with its first confirmed set.
 */
export function confirmSet(scope: Scope, id: string, patch: Partial<SetValues> = {}): void {
  const pending = pendingOf(scope).find((p) => p.id === id)
  if (!pending) return
  const session = scope === null ? getSession() : null
  if (scope === null && !session) return
  const existing = workoutIdOf(scope)
  const workoutId = existing ?? (scope ?? session?.workoutId ?? newId())
  const set: WorkoutSet = {
    id: pending.id,
    workoutId,
    exerciseId: pending.exerciseId,
    order: pending.order,
    ...valuesOf(pending),
    ...patch,
  }
  let newWorkout: Workout | undefined
  if (!existing && session) {
    newWorkout = {
      id: workoutId,
      startedAt: session.startedAt,
      ...(session.note && { note: session.note }),
      ...(session.templateId && { templateId: session.templateId }),
      ...(session.templateName && { templateName: session.templateName }),
    }
  }
  // Data first: if the app dies in between, the confirmed set wins over the leftover suggestion.
  setsRepo.addConfirmed(set, newWorkout)
  if (scope === null) updateSession((s) => ({ ...s, workoutId, pending: s.pending.filter((p) => p.id !== id) }))
  else setPending(scope, (p) => p.filter((x) => x.id !== id))
}

/** Editing a value of a suggestion confirms it; editing a confirmed set just changes it. */
export function updateSet(scope: Scope, id: string, patch: Partial<SetValues>): void {
  if (pendingOf(scope).some((p) => p.id === id)) return confirmSet(scope, id, patch)
  setsRepo.update(id, patch)
  touch(scope)
}

/** Drops the real workout again if it lost its last set (session scope only; past ones are cleaned on leaving). */
function dropWorkoutIfEmpty(scope: Scope): void {
  if (scope !== null) return
  const wid = getSession()?.workoutId
  if (wid) workoutsRepo.removeIfEmpty(wid)
}

export function removeSet(scope: Scope, id: string): void {
  if (pendingOf(scope).some((p) => p.id === id)) return setPending(scope, (p) => p.filter((x) => x.id !== id))
  setsRepo.remove(id)
  dropWorkoutIfEmpty(scope)
  touch(scope)
}

export function removeExercise(scope: Scope, exerciseId: string): void {
  const wid = workoutIdOf(scope)
  if (wid) setsRepo.removeExercise(wid, exerciseId)
  setPending(scope, (p) => p.filter((x) => x.exerciseId !== exerciseId))
  dropWorkoutIfEmpty(scope)
}

/** Moves an exercise block (confirmed sets and suggestions together) up (-1) or down (+1). */
export function moveBlock(scope: Scope, exerciseId: string, delta: -1 | 1): void {
  const orders = moveExercise(currentSets(scope), exerciseId, delta)
  if (!orders) return
  setsRepo.setOrders(orders)
  setPending(scope, (p) => p.map((x) => (orders.has(x.id) ? { ...x, order: orders.get(x.id)! } : x)))
}

export function setStartedAt(scope: Scope, startedAt: string): void {
  if (scope === null) updateSession((s) => ({ ...s, startedAt }))
  const wid = workoutIdOf(scope)
  if (wid) workoutsRepo.update(wid, { startedAt })
}

export function setNote(scope: Scope, note: string): void {
  if (scope === null) updateSession((s) => ({ ...s, note }))
  const wid = workoutIdOf(scope)
  if (wid) workoutsRepo.update(wid, { note })
}

// ---- session lifecycle -------------------------------------------------------

/**
 * Starts the training session (replacing any existing one). Nothing is saved to the
 * workout data yet. Returns false, starting nothing, if there are no sets.
 */
export function startTraining(input: {
  startedAt: string
  template?: Pick<Template, 'id' | 'name'>
  entries: TemplateEntry[]
}): boolean {
  const pending: PendingSet[] = []
  for (const entry of input.entries) {
    for (const values of entry.sets) {
      pending.push({ id: newId(), exerciseId: entry.exerciseId, order: pending.length, ...values })
    }
  }
  if (pending.length === 0) return false
  startSession({
    startedAt: input.startedAt,
    ...(input.template && { templateId: input.template.id, templateName: input.template.name }),
    pending,
  })
  return true
}

/** Ends the training: suggestions are dropped, the real workout stays as it is. */
export function endTraining(): void {
  clearSession()
}

/** Ends the session if nothing is left in it (no suggestions, no workout). Called when leaving the editor. */
export function endTrainingIfEmpty(): void {
  const s = getSession()
  if (s && s.pending.length === 0 && !workoutIdOf(null)) clearSession()
}

/** Deletes the training completely: the real workout (if any) and the session. */
export function discardTraining(): void {
  const wid = getSession()?.workoutId
  if (wid) workoutsRepo.remove(wid)
  clearSession()
}
