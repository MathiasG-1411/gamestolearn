import type { Worksheet, WorksheetMeta } from '../types/worksheet'
import type { Block } from '../types/worksheet'

const KEY = 'fichespro_worksheets'
const BANK_KEY = 'fichespro_bank'
const HEADER_PRESETS_KEY = 'fichespro_header_presets'

export interface HeaderPreset {
  id: string
  name: string
  meta: Partial<WorksheetMeta>
  createdAt: string
}

export function loadHeaderPresets(): HeaderPreset[] {
  try {
    const raw = localStorage.getItem(HEADER_PRESETS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHeaderPreset(preset: HeaderPreset): void {
  const all = loadHeaderPresets()
  const idx = all.findIndex(p => p.id === preset.id)
  if (idx >= 0) all[idx] = preset
  else all.unshift(preset)
  localStorage.setItem(HEADER_PRESETS_KEY, JSON.stringify(all))
}

export function deleteHeaderPreset(id: string): void {
  localStorage.setItem(HEADER_PRESETS_KEY, JSON.stringify(loadHeaderPresets().filter(p => p.id !== id)))
}

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
  if (idx >= 0) all[idx] = ws
  else all.unshift(ws)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteWorksheet(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(loadWorksheets().filter(w => w.id !== id)))
}

// --- Question bank ---

export function loadBank(): Block[] {
  try {
    const raw = localStorage.getItem(BANK_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToBank(block: Block): void {
  const bank = loadBank()
  bank.unshift({ ...block })
  localStorage.setItem(BANK_KEY, JSON.stringify(bank))
}

export function removeFromBank(id: string): void {
  localStorage.setItem(BANK_KEY, JSON.stringify(loadBank().filter(b => b.id !== id)))
}
