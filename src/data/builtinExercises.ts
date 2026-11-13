import type { Equipment, MuscleGroup } from '../types'

export type BuiltinCategory = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio'

export interface BuiltinExercise {
  id: string // stable: never change once released
  name: string // German display name
  aliasEn: string
  /** Extra search terms: German variants, abbreviations and previous names. */
  aliases: readonly string[]
  muscleGroup: MuscleGroup
  category: BuiltinCategory
  equipment: Equipment
}

interface RowOptions {
  category?: BuiltinCategory // overrides the group's default category
  aliases?: string[]
}

type Row = [slug: string, name: string, aliasEn: string, equipment: Equipment, options?: RowOptions]

const LH: Equipment = 'Langhantel'
const KH: Equipment = 'Kurzhantel'
const M: Equipment = 'Maschine'
const K: Equipment = 'Kabelzug'
const SZ: Equipment = 'SZ-Stange'
const KG: Equipment = 'Körpergewicht'

/*
 * Naming: equipment prefix with hyphen for simple compounds ("Kurzhantel-Rudern"),
 * equipment in parentheses for phrase names where needed ("Enges Bankdrücken (SZ)").
 * Renamed exercises keep their id and list the old name as an alias.
 */
const GROUPS: [MuscleGroup, BuiltinCategory, Row[]][] = [
  ['Brust', 'Push', [
    ['bench-press', 'Langhantel-Bankdrücken', 'Barbell Bench Press', LH, { aliases: ['Bankdrücken', 'Flachbankdrücken'] }],
    ['incline-bench-press', 'Langhantel-Schrägbankdrücken', 'Incline Barbell Bench Press', LH, { aliases: ['Schrägbankdrücken'] }],
    ['dumbbell-bench-press', 'Kurzhantel-Bankdrücken', 'Dumbbell Bench Press', KH],
    ['incline-dumbbell-press', 'Kurzhantel-Schrägbankdrücken', 'Incline Dumbbell Press', KH],
    ['dumbbell-fly', 'Kurzhantel-Fliegende', 'Dumbbell Fly', KH, { aliases: ['Fliegende'] }],
    ['pec-deck', 'Butterfly', 'Pec Deck', M, { aliases: ['Butterfly-Maschine'] }],
    ['chest-press', 'Brustpresse', 'Machine Chest Press', M],
    ['cable-crossover', 'Cable Crossover', 'Cable Crossover', K],
    ['dips', 'Dips', 'Dips', KG],
    ['push-up', 'Liegestütze', 'Push-up', KG],
  ]],
  ['Rücken', 'Pull', [
    ['deadlift', 'Kreuzheben', 'Deadlift', LH],
    ['pull-up', 'Klimmzüge', 'Pull-up', KG],
    ['lat-pulldown', 'Latziehen', 'Lat Pulldown', K, { aliases: ['Latzug'] }],
    ['barbell-row', 'Langhantel-Rudern', 'Barbell Row', LH, { aliases: ['Langhantelrudern'] }],
    ['dumbbell-row', 'Kurzhantel-Rudern', 'Dumbbell Row', KH, { aliases: ['Kurzhantelrudern'] }],
    ['seated-cable-row', 'Kabel-Rudern', 'Seated Cable Row', K, { aliases: ['Rudern am Kabel', 'Kabelrudern'] }],
    ['t-bar-row', 'T-Bar-Rudern', 'T-Bar Row', LH],
    ['machine-row', 'Maschinen-Rudern', 'Machine Row', M, { aliases: ['Rudern an der Maschine'] }],
    ['straight-arm-pulldown', 'Kabel-Überzüge', 'Straight-Arm Pulldown', K, { aliases: ['Überzüge am Kabel'] }],
    ['back-extension', 'Rückenstrecker', 'Back Extension', KG, { aliases: ['Hyperextensions'] }],
    ['ez-bent-over-row', 'Vorgebeugtes Rudern (SZ)', 'EZ Bar Bent-Over Row', SZ, { aliases: ['Rudern vorgebeugt SZ', 'SZ-Rudern', 'EZ Bent-Over Row'] }],
  ]],
  ['Beine', 'Legs', [
    ['squat', 'Kniebeuge', 'Barbell Squat', LH],
    ['front-squat', 'Frontkniebeuge', 'Front Squat', LH],
    ['goblet-squat', 'Goblet Squat', 'Goblet Squat', KH],
    ['leg-press', 'Beinpresse', 'Leg Press', M],
    ['romanian-deadlift', 'Rumänisches Kreuzheben', 'Romanian Deadlift', LH, { aliases: ['RDL'] }],
    ['lunges', 'Ausfallschritte', 'Dumbbell Lunges', KH],
    ['bulgarian-split-squat', 'Bulgarian Split Squat', 'Bulgarian Split Squat', KH, { aliases: ['Bulgarische Kniebeuge'] }],
    ['leg-extension', 'Beinstrecker', 'Leg Extension', M],
    ['leg-curl', 'Beinbeuger', 'Leg Curl', M],
    ['hip-thrust', 'Hip Thrust', 'Hip Thrust', LH],
    ['standing-calf-raise', 'Wadenheben', 'Standing Calf Raise', M],
  ]],
  ['Schultern', 'Push', [
    ['overhead-press', 'Langhantel-Schulterdrücken', 'Barbell Overhead Press', LH, { aliases: ['Schulterdrücken', 'Military Press'] }],
    ['dumbbell-shoulder-press', 'Kurzhantel-Schulterdrücken', 'Dumbbell Shoulder Press', KH],
    ['machine-shoulder-press', 'Schulterpresse', 'Machine Shoulder Press', M],
    ['lateral-raise', 'Seitheben', 'Dumbbell Lateral Raise', KH],
    ['cable-lateral-raise', 'Kabel-Seitheben', 'Cable Lateral Raise', K, { aliases: ['Seitheben am Kabel'] }],
    ['front-raise', 'Frontheben', 'Dumbbell Front Raise', KH],
    ['reverse-fly', 'Reverse Butterfly', 'Machine Reverse Fly', M, { category: 'Pull' }],
    ['face-pull', 'Face Pulls', 'Face Pull', K, { category: 'Pull' }],
    ['ez-upright-row', 'Aufrechtes Rudern', 'EZ Bar Upright Row', SZ, { category: 'Pull', aliases: ['Upright Row', 'Kinnrudern', 'SZ-Aufrechtes Rudern'] }],
  ]],
  ['Bizeps', 'Pull', [
    ['barbell-curl', 'Langhantel-Curls', 'Barbell Curl', LH],
    ['dumbbell-curl', 'Kurzhantel-Curls', 'Dumbbell Curl', KH],
    ['hammer-curl', 'Hammer-Curls', 'Hammer Curl', KH, { aliases: ['Hammer Curls'] }],
    ['preacher-curl', 'Scott-Curls', 'EZ Bar Preacher Curl', SZ, { aliases: ['Scottcurls', 'Scott Curls', 'Preacher Curls', 'Predigerbank-Curls', 'SZ-Scott-Curls', 'EZ Preacher Curl'] }],
    ['cable-curl', 'Kabel-Curls', 'Cable Curl', K],
    ['concentration-curl', 'Konzentrations-Curls', 'Concentration Curl', KH, { aliases: ['Konzentrationscurls'] }],
    ['ez-curl', 'SZ-Curls', 'EZ Bar Curl', SZ, { aliases: ['Bizepscurls SZ-Stange', 'SZ-Hantel-Curls', 'EZ Curl', 'EZ-Bar Curl', 'EZ'] }],
    ['ez-reverse-curl', 'SZ-Reverse-Curls', 'EZ Bar Reverse Curl', SZ, { aliases: ['Reverse Curls', 'Umgekehrte Curls', 'Obergriff-Curls', 'EZ Reverse Curl'] }],
    ['ez-spider-curl', 'SZ-Spider-Curls', 'EZ Bar Spider Curl', SZ, { aliases: ['Spider Curls', 'EZ Spider Curl'] }],
    ['ez-drag-curl', 'SZ-Drag-Curls', 'EZ Bar Drag Curl', SZ, { aliases: ['Drag Curls', 'EZ Drag Curl'] }],
  ]],
  ['Trizeps', 'Push', [
    ['triceps-pushdown', 'Kabel-Trizepsdrücken', 'Cable Triceps Pushdown', K, { aliases: ['Trizepsdrücken am Kabel', 'Trizepsdrücken'] }],
    ['skull-crusher', 'French Press', 'EZ Bar Skull Crusher', SZ, { aliases: ['Stirndrücken', 'Skullcrusher', 'Liegendes Trizepsstrecken', 'EZ Skull Crusher', 'SZ-Stange', 'EZ'] }],
    ['overhead-triceps-extension', 'Überkopf-Trizepsstrecken (Kurzhantel)', 'Dumbbell Overhead Triceps Extension', KH, { aliases: ['Überkopf-Trizepsstrecken', 'Trizepsdrücken über Kopf'] }],
    ['ez-overhead-triceps-extension', 'Überkopf-Trizepsstrecken (SZ)', 'EZ Bar Overhead Triceps Extension', SZ, { aliases: ['Trizepsdrücken über Kopf', 'French Press über Kopf', 'EZ Overhead Triceps Extension'] }],
    ['close-grip-bench-press', 'Enges Bankdrücken', 'Barbell Close-Grip Bench Press', LH],
    ['ez-close-grip-bench-press', 'Enges Bankdrücken (SZ)', 'EZ Bar Close-Grip Bench Press', SZ, { aliases: ['Bankdrücken eng SZ', 'Close-Grip Bench Press EZ', 'EZ'] }],
    ['triceps-kickback', 'Trizeps-Kickbacks', 'Dumbbell Triceps Kickback', KH, { aliases: ['Kickbacks'] }],
  ]],
  ['Bauch', 'Core', [
    ['crunch', 'Crunches', 'Crunch', KG],
    ['cable-crunch', 'Kabel-Crunches', 'Cable Crunch', K],
    ['ab-crunch-machine', 'Bauchmaschine', 'Ab Crunch Machine', M],
    ['hanging-leg-raise', 'Beinheben hängend', 'Hanging Leg Raise', KG],
    ['russian-twist', 'Russian Twists', 'Russian Twist', KG],
    ['ab-wheel-rollout', 'Ab-Wheel', 'Ab Wheel Rollout', KG, { aliases: ['Ab Wheel', 'Bauchroller'] }],
  ]],
  ['Cardio', 'Cardio', [
    ['treadmill', 'Laufband', 'Treadmill', M],
    ['cross-trainer', 'Crosstrainer', 'Elliptical Trainer', M],
    ['rowing-machine', 'Rudergerät', 'Rowing Machine', M],
    ['stationary-bike', 'Fahrradergometer', 'Stationary Bike', M, { aliases: ['Ergometer', 'Fahrrad'] }],
    ['stair-climber', 'Stepper', 'Stair Climber', M],
    ['jump-rope', 'Seilspringen', 'Jump Rope', KG],
  ]],
]

export const BUILTIN_EXERCISES: readonly BuiltinExercise[] = GROUPS.flatMap(([muscleGroup, category, rows]) =>
  rows.map(([slug, name, aliasEn, equipment, options]) => ({
    id: `builtin-${slug}`,
    name,
    aliasEn,
    aliases: options?.aliases ?? [],
    muscleGroup,
    category: options?.category ?? category,
    equipment,
  })),
)
