import { v4 as uuidv4 } from 'uuid'

const REFERENTIAL_KEY = 'fichespro_fwb_referential'

export interface OfficialAttendu {
  id: string
  subject: string      // "Mathématiques", "Français", etc.
  levels: string[]     // ["P3","P4"] niveaux auxquels il s'applique
  uaa: string          // "UAA 3.2 — Nombres et opérations" (peut être vide)
  type: 'S' | 'SF' | 'C'
  text: string         // texte exact de l'attendu
}

export function loadReferential(): OfficialAttendu[] {
  try {
    const raw = localStorage.getItem(REFERENTIAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveReferential(attendus: OfficialAttendu[]): void {
  localStorage.setItem(REFERENTIAL_KEY, JSON.stringify(attendus))
}

export function addAttendu(a: Omit<OfficialAttendu, 'id'>): OfficialAttendu {
  const attendu: OfficialAttendu = { ...a, id: uuidv4() }
  const current = loadReferential()
  current.push(attendu)
  saveReferential(current)
  return attendu
}

export function deleteAttendu(id: string): void {
  const current = loadReferential()
  saveReferential(current.filter(a => a.id !== id))
}

export function getAttendusForContext(subject: string, level: string): OfficialAttendu[] {
  const all = loadReferential()
  return all.filter(a => a.subject === subject && a.levels.includes(level))
}
