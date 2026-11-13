import type { Equipment, MuscleGroup } from '../types'
import { dictionaries, translate, type MessageKey } from './index'

/** Stored values (German) -> label in the UI language. Unknown values are shown as is. */
export function muscleLabel(group: string): string {
  const key = `muscle.${group}` as MessageKey
  return key in dictionaries.de ? translate(key) : group
}

export function equipmentLabel(equipment: string): string {
  const key = `equipment.${equipment}` as MessageKey
  return key in dictionaries.de ? translate(key) : equipment
}

/** Labels of a muscle group in every language, for search. */
export function muscleLabelsAll(group: MuscleGroup): string[] {
  const key = `muscle.${group}` as MessageKey
  return [dictionaries.de[key], dictionaries.en[key]]
}

export function equipmentLabelsAll(equipment: Equipment): string[] {
  const key = `equipment.${equipment}` as MessageKey
  return [dictionaries.de[key], dictionaries.en[key]]
}
