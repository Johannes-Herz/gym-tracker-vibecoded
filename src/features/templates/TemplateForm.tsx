import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { moveItem } from '../../lib/exerciseOrder'
import { templates as repo } from '../../storage/repo'
import { useStore } from '../../storage/store'
import type { Template } from '../../types'
import ExerciseSearchSheet from '../exercises/ExerciseSearchSheet'
import { recentExerciseIds } from '../workout/recent'

interface Props {
  /** Undefined = create a new template. */
  template?: Template
  /** Called after saving or deleting. */
  onDone: () => void
}

/** Name plus ordered exercise list. Changes are kept in a draft until "Speichern". */
export default function TemplateForm({ template, onDone }: Props) {
  const data = useStore()
  const [name, setName] = useState(template?.name ?? '')
  const [ids, setIds] = useState<string[]>(template?.exerciseIds ?? [])
  const [picking, setPicking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [overwriting, setOverwriting] = useState(false)

  const exerciseOf = (id: string) => data.exercises.find((e) => e.id === id)
  const shownIds = ids.filter((id) => exerciseOf(id))
  const canSave = name.trim() !== '' && shownIds.length > 0

  function write() {
    repo.save(name, shownIds, template?.id)
    onDone()
  }

  function save() {
    if (!canSave) return
    // The name identifies a template: ask before replacing a different one.
    if (repo.findByName(name, template?.id)) setOverwriting(true)
    else write()
  }

  function remove() {
    if (template) repo.remove(template.id)
    onDone()
  }

  return (
    <>
      <div className="card form">
        <label>
          Name
          <input
            value={name}
            placeholder="z. B. Push Tag"
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </div>

      <ul className="list template-exercises">
        {shownIds.map((id, i) => {
          const e = exerciseOf(id)!
          return (
            <li key={id} className="list-item">
              <div className="grow">
                <div>{e.name}</div>
                <div className="muted small">
                  {e.muscleGroup}
                  {e.hidden ? ' · ausgeblendet' : ''}
                </div>
              </div>
              <button
                type="button"
                className="btn"
                aria-label={`${e.name} nach oben`}
                disabled={i === 0}
                onClick={() => setIds(moveItem(shownIds, i, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn"
                aria-label={`${e.name} nach unten`}
                disabled={i === shownIds.length - 1}
                onClick={() => setIds(moveItem(shownIds, i, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-danger-text"
                aria-label={`${e.name} entfernen`}
                onClick={() => setIds(shownIds.filter((x) => x !== id))}
              >
                ✕
              </button>
            </li>
          )
        })}
      </ul>
      {shownIds.length === 0 && <p className="muted">Noch keine Übungen.</p>}

      <button type="button" className="btn wide" onClick={() => setPicking(true)}>
        + Übung hinzufügen
      </button>
      <button type="button" className="btn btn-primary wide" disabled={!canSave} onClick={save}>
        Speichern
      </button>
      {template && (
        <button type="button" className="btn btn-danger wide" onClick={() => setDeleting(true)}>
          Vorlage löschen
        </button>
      )}

      {picking && (
        <ExerciseSearchSheet
          exercises={data.exercises}
          recentIds={recentExerciseIds(data)}
          onPick={(e) => {
            setPicking(false)
            setIds((cur) => (cur.includes(e.id) ? cur : [...cur, e.id]))
          }}
          onClose={() => setPicking(false)}
        />
      )}
      {overwriting && (
        <ConfirmDialog
          title="Vorlage überschreiben?"
          confirmLabel="Überschreiben"
          danger
          onConfirm={write}
          onCancel={() => setOverwriting(false)}
        >
          Die Vorlage „{name.trim()}“ existiert bereits und wird überschrieben.
        </ConfirmDialog>
      )}
      {deleting && (
        <ConfirmDialog
          title="Vorlage löschen?"
          confirmLabel="Löschen"
          danger
          onConfirm={remove}
          onCancel={() => setDeleting(false)}
        >
          „{template?.name}“ wird gelöscht. Bereits gespeicherte Trainings bleiben unverändert.
        </ConfirmDialog>
      )}
    </>
  )
}
