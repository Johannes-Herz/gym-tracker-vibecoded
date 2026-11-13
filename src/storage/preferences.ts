// Device-local UI preferences. Kept separate from app data: no schema
// version, not part of export/import, untouched by "delete all data".

export const PREFS_KEY = 'gymtracker:prefs'

export type HistoryView = 'list' | 'calendar'

interface Prefs {
  historyView?: HistoryView
}

function read(storage: Storage): Prefs {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(PREFS_KEY) ?? '{}')
    return typeof parsed === 'object' && parsed !== null ? (parsed as Prefs) : {}
  } catch {
    return {}
  }
}

export function loadHistoryView(storage: Storage = localStorage): HistoryView {
  return read(storage).historyView === 'calendar' ? 'calendar' : 'list'
}

export function saveHistoryView(view: HistoryView, storage: Storage = localStorage): void {
  try {
    storage.setItem(PREFS_KEY, JSON.stringify({ ...read(storage), historyView: view }))
  } catch {
    // Preferences are a convenience; ignore storage failures.
  }
}
