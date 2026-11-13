export const MUSCLE_GROUPS = [
  'Brust',
  'Rücken',
  'Beine',
  'Schultern',
  'Bizeps',
  'Trizeps',
  'Bauch',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  category: string
  createdAt: string // ISO
}

export interface Workout {
  id: string
  startedAt: string // ISO
  note?: string
}

export interface WorkoutSet {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  weight: number // kg
  reps: number
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
}
