import PageHeader from '../components/PageHeader'
import WorkoutEditor from '../features/workout/WorkoutEditor'
import { isSameLocalDay } from '../lib/format'
import { workouts } from '../storage/repo'
import { useStore } from '../storage/store'

export default function TrainingPage() {
  const { workouts: all, sets } = useStore()

  // The current workout is the most recent one that started today.
  const today = new Date()
  const current = [...all]
    .filter((w) => isSameLocalDay(new Date(w.startedAt), today))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]

  const hasSets = current ? sets.some((s) => s.workoutId === current.id) : false

  function startNew() {
    // Reuse an empty workout instead of piling up blank ones.
    if (current && !hasSets) workouts.update(current.id, { startedAt: new Date().toISOString() })
    else workouts.add()
  }

  if (!current) {
    return (
      <>
        <PageHeader title="Training" />
        <p className="muted">Heute noch kein Training.</p>
        <button type="button" className="btn btn-primary wide" onClick={startNew}>
          Training starten
        </button>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Training"
        action={
          hasSets && (
            <button type="button" className="btn" onClick={startNew}>
              Neues Training
            </button>
          )
        }
      />
      <WorkoutEditor key={current.id} workoutId={current.id} />
    </>
  )
}
