export const MUSCLE_GROUPS = [
  'Brust',
  'Rücken',
  'Beine',
  'Schultern',
  'Bizeps',
  'Trizeps',
  'Bauch',
  'Cardio',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

/** Cardio exercises are logged as duration/distance instead of weight × reps. */
export function isCardio(e: { muscleGroup: string }): boolean {
  return e.muscleGroup === 'Cardio'
}

export const EQUIPMENT = ['Langhantel', 'Kurzhantel', 'Maschine', 'Kabelzug', 'SZ-Stange', 'Körpergewicht'] as const

export type Equipment = (typeof EQUIPMENT)[number]

export type ExerciseSource = 'builtin' | 'custom'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  category: string
  createdAt: string // ISO
  source: ExerciseSource
  aliasEn?: string // built-ins only
  aliases?: string[] // built-ins only: extra search terms (German variants, old names)
  equipment?: Equipment
  hidden?: boolean // only ever true for built-ins
}

export interface Workout {
  id: string
  startedAt: string // ISO
  note?: string
  templateId?: string // workout was started from this template
  templateName?: string // copied at start, survives rename/delete of the template
}

/** Reusable routine: a name and an ordered list of exercises (no sets/weights). */
export interface Template {
  id: string
  name: string
  exerciseIds: string[]
  createdAt: string // ISO
  updatedAt: string // ISO
}

export interface WorkoutSet {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  weight: number // kg; 0 for cardio
  reps: number // 0 for cardio
  durationMin?: number // cardio only, required there
  distanceKm?: number // cardio only, optional
}

export interface BodyWeightEntry {
  id: string
  date: string // YYYY-MM-DD
  weightKg: number
}

export interface AppData {
  schemaVersion: number
  exercises: Exercise[]
  workouts: Workout[]
  sets: WorkoutSet[]
  bodyWeights: BodyWeightEntry[]
  templates: Template[]
}
