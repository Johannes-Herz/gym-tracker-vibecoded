import NumberStepper from '../../components/NumberStepper'
import { t } from '../../i18n'
import { BW_LABEL } from '../exercises/bodyweight'
import { sets } from '../../storage/repo'
import type { WorkoutSet } from '../../types'

interface Props {
  set: WorkoutSet
  index: number
  cardio: boolean
  bodyweight: boolean
}

export default function SetRow({ set, index, cardio, bodyweight }: Props) {
  return (
    <div className={`set-row${cardio ? ' cardio' : ''}${set.suggested ? ' suggested' : ''}`}>
      {set.suggested ? (
        <button
          type="button"
          className="btn confirm-set"
          aria-label={t(cardio ? 'set.confirmEntry' : 'set.confirmSet', { n: index + 1 })}
          onClick={() => sets.confirm(set.id)}
        >
          ✓
        </button>
      ) : (
        <span className="set-index muted">{index + 1}</span>
      )}
      {cardio ? (
        <>
          <NumberStepper
            label={t('set.duration')}
            step={1}
            min={1}
            buttons={false}
            inputMode="numeric"
            value={set.durationMin}
            onChange={(durationMin) => sets.update(set.id, { durationMin })}
          />
          <NumberStepper
            label={t('set.distance')}
            step={0.1}
            buttons={false}
            value={set.distanceKm}
            onChange={(distanceKm) => sets.update(set.id, { distanceKm })}
            onClear={() => sets.update(set.id, { distanceKm: undefined })}
          />
        </>
      ) : (
        <>
          {bodyweight ? (
            // Added weight; empty/0 = bodyweight only ("BW"), negative = assisted.
            <NumberStepper
              label={t('set.addedWeight')}
              step={1.25}
              min={-100}
              placeholder={BW_LABEL}
              value={set.weight === 0 ? undefined : set.weight}
              onChange={(weight) => sets.update(set.id, { weight })}
              onClear={() => sets.update(set.id, { weight: 0 })}
            />
          ) : (
            <NumberStepper
              label={t('set.weight')}
              step={1.25}
              value={set.weight}
              onChange={(weight) => sets.update(set.id, { weight })}
            />
          )}
          <NumberStepper
            label={t('set.reps')}
            step={1}
            min={0}
            inputMode="numeric"
            value={set.reps}
            onChange={(reps) => sets.update(set.id, { reps })}
          />
        </>
      )}
      <button
        type="button"
        className="btn btn-danger-text"
        aria-label={t(cardio ? 'set.deleteEntry' : 'set.deleteSet', { n: index + 1 })}
        onClick={() => sets.remove(set.id)}
      >
        ✕
      </button>
    </div>
  )
}
