import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { t } from '../../i18n'
import { muscleLabel } from '../../i18n/labels'
import { moveItem } from '../../lib/exerciseOrder'
import { exerciseName } from '../exercises/exerciseName'
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
          {t('tpl.name')}
          <input
            value={name}
            placeholder={t('workout.templateNamePlaceholder')}
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
                <div>{exerciseName(e)}</div>
                <div className="muted small">
                  {muscleLabel(e.muscleGroup)}
                  {e.hidden ? t('tpl.hiddenSuffix') : ''}
                </div>
              </div>
              <button
                type="button"
                className="btn"
                aria-label={t('block.moveUp', { name: exerciseName(e) })}
                disabled={i === 0}
                onClick={() => setIds(moveItem(shownIds, i, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn"
                aria-label={t('block.moveDown', { name: exerciseName(e) })}
                disabled={i === shownIds.length - 1}
                onClick={() => setIds(moveItem(shownIds, i, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-danger-text"
                aria-label={t('block.remove', { name: exerciseName(e) })}
                onClick={() => setIds(shownIds.filter((x) => x !== id))}
              >
                ✕
              </button>
            </li>
          )
        })}
      </ul>
      {shownIds.length === 0 && <p className="muted">{t('tpl.empty')}</p>}

      <button type="button" className="btn wide" onClick={() => setPicking(true)}>
        {t('workout.addExercise')}
      </button>
      <button type="button" className="btn btn-primary wide" disabled={!canSave} onClick={save}>
        {t('common.save')}
      </button>
      {template && (
        <button type="button" className="btn btn-danger wide" onClick={() => setDeleting(true)}>
          {t('tpl.delete')}
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
          title={t('workout.overwriteTitle')}
          confirmLabel={t('workout.overwriteConfirm')}
          danger
          onConfirm={write}
          onCancel={() => setOverwriting(false)}
        >
          {t('tpl.overwriteText', { name: name.trim() })}
        </ConfirmDialog>
      )}
      {deleting && (
        <ConfirmDialog
          title={t('tpl.deleteTitle')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={remove}
          onCancel={() => setDeleting(false)}
        >
          {t('tpl.deleteText', { name: template?.name ?? '' })}
        </ConfirmDialog>
      )}
    </>
  )
}
