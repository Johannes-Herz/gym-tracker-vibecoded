import { t } from '../../i18n'
import type { RangeSelection } from '../../storage/preferences'
import { RANGE_CHIPS } from './range'

interface Props {
  value: RangeSelection
  onChange: (range: RangeSelection) => void
}

export default function RangeFilter({ value, onChange }: Props) {
  return (
    <div className="range-filter">
      <div className="chips" role="group" aria-label={t('range.group')}>
        {RANGE_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={value.key === c.key ? 'chip active' : 'chip'}
            aria-pressed={value.key === c.key}
            onClick={() => onChange(c.key === 'custom' ? { ...value, key: 'custom' } : { key: c.key })}
          >
            {t(c.label)}
          </button>
        ))}
      </div>
      {value.key === 'custom' && (
        <div className="form range-dates">
          <label>
            {t('range.from')}
            <input
              type="date"
              value={value.from ?? ''}
              onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
            />
          </label>
          <label>
            {t('range.to')}
            <input
              type="date"
              value={value.to ?? ''}
              onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
            />
          </label>
        </div>
      )}
    </div>
  )
}
