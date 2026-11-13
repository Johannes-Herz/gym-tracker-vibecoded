import NumberStepper from '../../components/NumberStepper'
import { sets } from '../../storage/repo'
import type { WorkoutSet } from '../../types'

export default function SetRow({ set, index }: { set: WorkoutSet; index: number }) {
  return (
    <div className="set-row">
      <span className="set-index muted">{index + 1}</span>
      <NumberStepper
        label="Gewicht"
        step={1.25}
        value={set.weight}
        onChange={(weight) => sets.update(set.id, { weight })}
      />
      <NumberStepper
        label="Wiederholungen"
        step={1}
        buttons={false}
        inputMode="numeric"
        value={set.reps}
        onChange={(reps) => sets.update(set.id, { reps })}
      />
      <button
        type="button"
        className="btn btn-danger-text"
        aria-label={`Satz ${index + 1} löschen`}
        onClick={() => sets.remove(set.id)}
      >
        ✕
      </button>
    </div>
  )
}
