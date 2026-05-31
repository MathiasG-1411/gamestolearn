import type { Worksheet } from '../types/worksheet'

const KEY = 'fichespro_worksheets'

export function loadWorksheets(): Worksheet[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveWorksheet(ws: Worksheet): void {
  const all = loadWorksheets()
  const idx = all.findIndex(w => w.id === ws.id)
  if (idx >= 0) {
    all[idx] = ws
  } else {
    all.unshift(ws)
  }
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteWorksheet(id: string): void {
  const all = loadWorksheets().filter(w => w.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}
