import NumberStepper from '../../components/NumberStepper'
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
    <div className={cardio ? 'set-row cardio' : 'set-row'}>
      <span className="set-index muted">{index + 1}</span>
      {cardio ? (
        <>
          <NumberStepper
            label="Dauer in Minuten"
            step={1}
            min={1}
            buttons={false}
            inputMode="numeric"
            value={set.durationMin}
            onChange={(durationMin) => sets.update(set.id, { durationMin })}
          />
          <NumberStepper
            label="Distanz in Kilometern"
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
            // Added weight; empty/0 = bodyweight only ("KG"), negative = assisted.
            <NumberStepper
              label="Zusatzgewicht"
              step={1.25}
              min={-100}
              placeholder="KG"
              value={set.weight === 0 ? undefined : set.weight}
              onChange={(weight) => sets.update(set.id, { weight })}
              onClear={() => sets.update(set.id, { weight: 0 })}
            />
          ) : (
            <NumberStepper
              label="Gewicht"
              step={1.25}
              value={set.weight}
              onChange={(weight) => sets.update(set.id, { weight })}
            />
          )}
          <NumberStepper
            label="Wiederholungen"
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
        aria-label={`${cardio ? 'Eintrag' : 'Satz'} ${index + 1} löschen`}
        onClick={() => sets.remove(set.id)}
      >
        ✕
      </button>
    </div>
  )
}
