import { t } from '../../i18n'

/** Chart units are language-neutral codes ("kg", "min", "reps"); only "reps" needs translating. */
export function unitLabel(unit: string): string {
  return unit === 'reps' ? t('unit.reps') : unit
}
