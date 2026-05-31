import { useState, useRef } from 'react'
import type { OfficialAttendu } from '../utils/referential'
import { loadReferential, saveReferential, addAttendu, deleteAttendu } from '../utils/referential'
import { SUBJECTS, LEVELS } from '../types/worksheet'

interface Props {
  onClose: () => void
}

const TYPE_LABELS: Record<'S' | 'SF' | 'C', string> = {
  S: 'Savoir',
  SF: 'Savoir-faire',
  C: 'Compétence',
}

const TYPE_BADGE: Record<'S' | 'SF' | 'C', string> = {
  S: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
  SF: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200',
  C: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
}

const emptyForm = {
  subject: SUBJECTS[0],
  levels: [] as string[],
  uaa: '',
  type: 'SF' as 'S' | 'SF' | 'C',
  text: '',
}

export default function ReferentialManager({ onClose }: Props) {
  const [attendus, setAttendus] = useState<OfficialAttendu[]>(loadReferential)
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const filtered = filterSubject ? attendus.filter(a => a.subject === filterSubject) : attendus

  const reload = () => setAttendus(loadReferential())

  const handleDelete = (id: string) => {
    deleteAttendu(id)
    reload()
  }

  const toggleLevel = (lvl: string) => {
    setForm(f => ({
      ...f,
      levels: f.levels.includes(lvl) ? f.levels.filter(l => l !== lvl) : [...f.levels, lvl],
    }))
  }

  const handleSave = () => {
    if (!form.text.trim()) { setFormError('Le texte de l\'attendu est obligatoire.'); return }
    if (form.levels.length === 0) { setFormError('Sélectionne au moins un niveau.'); return }
    setFormError(null)
    addAttendu({
      subject: form.subject,
      levels: form.levels,
      uaa: form.uaa.trim(),
      type: form.type,
      text: form.text.trim(),
    })
    setForm(emptyForm)
    setShowForm(false)
    reload()
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string)
        if (!Array.isArray(data)) throw new Error('Le fichier doit être un tableau JSON.')
        const valid: Omit<OfficialAttendu, 'id'>[] = []
        for (const item of data) {
          if (
            typeof item.subject !== 'string' ||
            !Array.isArray(item.levels) ||
            typeof item.text !== 'string' ||
            !['S', 'SF', 'C'].includes(item.type)
          ) {
            throw new Error('Format invalide : chaque élément doit avoir { subject, levels, uaa, type, text }.')
          }
          valid.push({
            subject: item.subject,
            levels: item.levels,
            uaa: item.uaa ?? '',
            type: item.type,
            text: item.text,
          })
        }
        // Merge with existing
        const current = loadReferential()
        const merged = [...current, ...valid.map(v => ({ ...v, id: crypto.randomUUID() }))]
        saveReferential(merged)
        reload()
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : 'Erreur lors de l\'import.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📚</span> Référentiel CPC FWB
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >✕</button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-950">
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Toutes les matières</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setShowForm(v => !v); setFormError(null) }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
            >
              ➕ Ajouter
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              📋 Importer (JSON)
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          </div>
        </div>

        {importError && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border-b border-red-100 dark:border-red-800 flex-shrink-0">
            ⚠ {importError}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 flex-shrink-0 space-y-3">
            <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Nouvel attendu CPC</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Matière */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Matière</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* UAA */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">UAA (ex: UAA 3.1 — Opérations)</label>
                <input
                  type="text"
                  value={form.uaa}
                  onChange={e => setForm(f => ({ ...f, uaa: e.target.value }))}
                  placeholder="UAA 3.1 — Opérations"
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {/* Niveaux */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Niveaux</label>
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition border ${
                      form.levels.includes(lvl)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Type</label>
              <div className="flex gap-4">
                {(['S', 'SF', 'C'] as const).map(t => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={form.type === t}
                      onChange={() => setForm(f => ({ ...f, type: t }))}
                      className="accent-indigo-600"
                    />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[t]}`}>{t}</span>
                    <span>{TYPE_LABELS[t]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Texte */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Texte de l'attendu</label>
              <textarea
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Texte exact de l'attendu CPC…"
                rows={3}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            {formError && <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>}

            <div className="flex gap-2">
              <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
                Sauvegarder
              </button>
              <button onClick={() => { setShowForm(false); setFormError(null) }} className="px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
              <span className="text-5xl">📋</span>
              <div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Aucun attendu dans le référentiel</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                  Importez vos attendus officiels CPC depuis les documents FWB pour que l'IA les utilise dans la génération d'exercices.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left max-w-lg w-full">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Comment importer ?</p>
                <ol className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                  <li>Copiez les attendus officiels depuis les documents CPC FWB</li>
                  <li>Créez un fichier <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.json</code> avec le format suivant</li>
                  <li>Cliquez sur "📋 Importer (JSON)" ci-dessus</li>
                </ol>
                <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                  <pre>{`[
  {
    "subject": "Mathématiques",
    "levels": ["P3", "P4"],
    "uaa": "UAA 3.1 — Nombres et opérations",
    "type": "SF",
    "text": "Effectuer des additions et des soustractions..."
  }
]`}</pre>
                </div>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Matière</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Niveaux</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">UAA</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Texte</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{a.subject}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.levels.map(l => (
                          <span key={l} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden md:table-cell max-w-[180px] truncate">{a.uaa || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[a.type]}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs">
                      <span className="line-clamp-2">{a.text}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        title="Supprimer"
                      >🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {attendus.length > 0 && (
          <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {filtered.length} attendu{filtered.length !== 1 ? 's' : ''}{filterSubject ? ` en ${filterSubject}` : ''} · {attendus.length} au total
          </div>
        )}
      </div>
    </div>
  )
}
