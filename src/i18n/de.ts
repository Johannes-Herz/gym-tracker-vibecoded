/**
 * German UI strings: the source of truth for the keys. `en.ts` is typed against
 * this object, so a missing English translation is a type error.
 * Placeholders look like {n}; plurals use `<key>_one` / `<key>_other`.
 */
export const de = {
  'settings.language': 'Sprache',

  // Stored values are German; these are the display labels.
  'muscle.Brust': 'Brust',
  'muscle.Rücken': 'Rücken',
  'muscle.Beine': 'Beine',
  'muscle.Schultern': 'Schultern',
  'muscle.Bizeps': 'Bizeps',
  'muscle.Trizeps': 'Trizeps',
  'muscle.Bauch': 'Bauch',
  'muscle.Cardio': 'Cardio',
  'equipment.Langhantel': 'Langhantel',
  'equipment.Kurzhantel': 'Kurzhantel',
  'equipment.Maschine': 'Maschine',
  'equipment.Kabelzug': 'Kabelzug',
  'equipment.SZ-Stange': 'SZ-Stange',
  'equipment.Körpergewicht': 'Körpergewicht',
} as const
