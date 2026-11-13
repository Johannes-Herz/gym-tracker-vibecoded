import type { Equipment, MuscleGroup } from '../types'

export type BuiltinCategory = 'Push' | 'Pull' | 'Legs' | 'Core'

export interface BuiltinExercise {
  id: string // stable: never change once released
  name: string // German display name
  aliasEn: string
  muscleGroup: MuscleGroup
  category: BuiltinCategory
  equipment: Equipment
}

type Row = [slug: string, name: string, aliasEn: string, equipment: Equipment, category?: BuiltinCategory]

const LH: Equipment = 'Langhantel'
const KH: Equipment = 'Kurzhantel'
const M: Equipment = 'Maschine'
const K: Equipment = 'Kabelzug'
const KG: Equipment = 'Körpergewicht'

const GROUPS: [MuscleGroup, BuiltinCategory, Row[]][] = [
  ['Brust', 'Push', [
    ['bench-press', 'Bankdrücken', 'Bench Press', LH],
    ['incline-bench-press', 'Schrägbankdrücken', 'Incline Bench Press', LH],
    ['dumbbell-bench-press', 'Kurzhantel-Bankdrücken', 'Dumbbell Bench Press', KH],
    ['incline-dumbbell-press', 'Kurzhantel-Schrägbankdrücken', 'Incline Dumbbell Press', KH],
    ['dumbbell-fly', 'Fliegende', 'Dumbbell Fly', KH],
    ['pec-deck', 'Butterfly', 'Pec Deck', M],
    ['chest-press', 'Brustpresse', 'Chest Press', M],
    ['cable-crossover', 'Cable Crossover', 'Cable Crossover', K],
    ['dips', 'Dips', 'Dips', KG],
    ['push-up', 'Liegestütze', 'Push-up', KG],
  ]],
  ['Rücken', 'Pull', [
    ['deadlift', 'Kreuzheben', 'Deadlift', LH],
    ['pull-up', 'Klimmzüge', 'Pull-up', KG],
    ['lat-pulldown', 'Latziehen', 'Lat Pulldown', K],
    ['barbell-row', 'Langhantelrudern', 'Barbell Row', LH],
    ['dumbbell-row', 'Kurzhantelrudern', 'Dumbbell Row', KH],
    ['seated-cable-row', 'Rudern am Kabel', 'Seated Cable Row', K],
    ['t-bar-row', 'T-Bar-Rudern', 'T-Bar Row', LH],
    ['machine-row', 'Rudern an der Maschine', 'Machine Row', M],
    ['straight-arm-pulldown', 'Überzüge am Kabel', 'Straight-Arm Pulldown', K],
    ['back-extension', 'Rückenstrecker', 'Back Extension', KG],
  ]],
  ['Beine', 'Legs', [
    ['squat', 'Kniebeuge', 'Squat', LH],
    ['front-squat', 'Frontkniebeuge', 'Front Squat', LH],
    ['goblet-squat', 'Goblet Squat', 'Goblet Squat', KH],
    ['leg-press', 'Beinpresse', 'Leg Press', M],
    ['romanian-deadlift', 'Rumänisches Kreuzheben', 'Romanian Deadlift', LH],
    ['lunges', 'Ausfallschritte', 'Lunges', KH],
    ['bulgarian-split-squat', 'Bulgarian Split Squat', 'Bulgarian Split Squat', KH],
    ['leg-extension', 'Beinstrecker', 'Leg Extension', M],
    ['leg-curl', 'Beinbeuger', 'Leg Curl', M],
    ['hip-thrust', 'Hip Thrust', 'Hip Thrust', LH],
    ['standing-calf-raise', 'Wadenheben', 'Standing Calf Raise', M],
  ]],
  ['Schultern', 'Push', [
    ['overhead-press', 'Schulterdrücken', 'Overhead Press', LH],
    ['dumbbell-shoulder-press', 'Kurzhantel-Schulterdrücken', 'Dumbbell Shoulder Press', KH],
    ['machine-shoulder-press', 'Schulterpresse', 'Machine Shoulder Press', M],
    ['lateral-raise', 'Seitheben', 'Lateral Raise', KH],
    ['cable-lateral-raise', 'Seitheben am Kabel', 'Cable Lateral Raise', K],
    ['front-raise', 'Frontheben', 'Front Raise', KH],
    ['reverse-fly', 'Reverse Butterfly', 'Reverse Fly', M, 'Pull'],
    ['face-pull', 'Face Pulls', 'Face Pull', K, 'Pull'],
  ]],
  ['Bizeps', 'Pull', [
    ['barbell-curl', 'Langhantel-Curls', 'Barbell Curl', LH],
    ['dumbbell-curl', 'Kurzhantel-Curls', 'Dumbbell Curl', KH],
    ['hammer-curl', 'Hammer Curls', 'Hammer Curl', KH],
    ['preacher-curl', 'Scott-Curls', 'Preacher Curl', LH],
    ['cable-curl', 'Kabel-Curls', 'Cable Curl', K],
    ['concentration-curl', 'Konzentrationscurls', 'Concentration Curl', KH],
  ]],
  ['Trizeps', 'Push', [
    ['triceps-pushdown', 'Trizepsdrücken am Kabel', 'Triceps Pushdown', K],
    ['skull-crusher', 'French Press', 'Skull Crusher', LH],
    ['overhead-triceps-extension', 'Überkopf-Trizepsstrecken', 'Overhead Triceps Extension', KH],
    ['close-grip-bench-press', 'Enges Bankdrücken', 'Close-Grip Bench Press', LH],
    ['triceps-kickback', 'Kickbacks', 'Triceps Kickback', KH],
  ]],
  ['Bauch', 'Core', [
    ['crunch', 'Crunches', 'Crunch', KG],
    ['cable-crunch', 'Kabel-Crunches', 'Cable Crunch', K],
    ['ab-crunch-machine', 'Bauchmaschine', 'Ab Crunch Machine', M],
    ['hanging-leg-raise', 'Beinheben hängend', 'Hanging Leg Raise', KG],
    ['russian-twist', 'Russian Twists', 'Russian Twist', KG],
    ['ab-wheel-rollout', 'Ab Wheel', 'Ab Wheel Rollout', KG],
  ]],
]

export const BUILTIN_EXERCISES: readonly BuiltinExercise[] = GROUPS.flatMap(([muscleGroup, category, rows]) =>
  rows.map(([slug, name, aliasEn, equipment, override]) => ({
    id: `builtin-${slug}`,
    name,
    aliasEn,
    muscleGroup,
    category: override ?? category,
    equipment,
  })),
)
