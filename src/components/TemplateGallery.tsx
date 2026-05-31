import { useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Worksheet } from '../types/worksheet'
import { TEMPLATES } from '../data/templates'

interface Props {
  worksheets: Worksheet[]
  onSelect: (ws: Worksheet) => void
  onDelete: (id: string) => void
  onDuplicate: (ws: Worksheet) => void
  onRename: (id: string, title: string) => void
  onImport: (worksheets: Worksheet[]) => void
  darkMode: boolean
  onToggleDark: () => void
}

const SUBJECT_COLORS: Record<string, string> = {
  'Mathématiques': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Français': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Histoire-Géographie': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'Sciences': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Anglais': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Physique-Chimie': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'SVT': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
}

function subjectColor(s: string) {
  return SUBJECT_COLORS[s] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

export default function TemplateGallery({ worksheets, onSelect, onDelete, onDuplicate, onRename, onImport, darkMode, onToggleDark }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirmId === id) {
      onDelete(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
      setTimeout(() => setConfirmId(prev => prev === id ? null : prev), 3000)
    }
  }

  const handleDuplicateClick = (e: React.MouseEvent, ws: Worksheet) => {
    e.stopPropagation()
    onDuplicate(ws)
  }

  const startRename = (e: React.MouseEvent, ws: Worksheet) => {
    e.stopPropagation()
    setRenamingId(ws.id)
    setRenameValue(ws.meta.title)
  }

  const commitRename = (id: string) => {
    const trimmed = renameValue.trim()
    if (trimmed) onRename(id, trimmed)
    setRenamingId(null)
  }

  const cancelRename = () => setRenamingId(null)

  const createFromTemplate = (tpl: typeof TEMPLATES[number]) => {
    const ws: Worksheet = {
      ...tpl,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSelect(ws)
  }

  const createBlank = () => {
    const ws: Worksheet = {
      id: uuidv4(),
      meta: {
        title: 'Nouvelle fiche',
        subject: '',
        level: '',
        date: new Date().toLocaleDateString('fr-FR'),
        showScore: false,
        showName: true,
        showDate: true,
      },
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSelect(ws)
  }

  // Export all worksheets as JSON
  const handleExport = () => {
    const data = JSON.stringify(worksheets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const today = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `fichespro-backup-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import worksheets from JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string)
        const imported = Array.isArray(data) ? data : [data]
        onImport(imported as Worksheet[])
      } catch {
        alert('Fichier JSON invalide')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Compute available subjects from current worksheets
  const availableSubjects = Array.from(new Set(worksheets.map(ws => ws.meta.subject).filter(Boolean)))

  // Filter worksheets
  const filteredWorksheets = worksheets.filter(ws => {
    const matchesSearch = !searchQuery || ws.meta.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = !activeSubject || ws.meta.subject === activeSubject
    return matchesSearch && matchesSubject
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">F</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">FichesPro</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Créateur de fiches enseignant</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Export */}
            {worksheets.length > 0 && (
              <button
                onClick={handleExport}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Exporter toutes les fiches (JSON)"
              >⬇</button>
            )}
            {/* Import */}
            <button
              onClick={() => importRef.current?.click()}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Importer des fiches (JSON)"
            >⬆</button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={createBlank}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm min-h-[36px]"
            >
              + Nouvelle fiche
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 space-y-8">
        {/* Saved worksheets */}
        {worksheets.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Mes fiches</h2>

            {/* Search + subject filters */}
            <div className="mb-3 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une fiche…"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
                  >✕</button>
                )}
              </div>
              {availableSubjects.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {availableSubjects.map(subj => (
                    <button
                      key={subj}
                      onClick={() => setActiveSubject(activeSubject === subj ? null : subj)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition min-h-[28px] ${
                        activeSubject === subj
                          ? 'bg-indigo-600 text-white'
                          : subjectColor(subj)
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWorksheets.map(ws => (
                <div
                  key={ws.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition cursor-pointer group"
                  onClick={() => onSelect(ws)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {/* Inline rename */}
                      {renamingId === ws.id ? (
                        <input
                          autoFocus
                          className="flex-1 text-sm font-semibold border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(ws.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename(ws.id)
                            if (e.key === 'Escape') cancelRename()
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <h3
                          className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 flex-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-text"
                          onClick={e => startRename(e, ws)}
                          title="Cliquer pour renommer"
                        >
                          {ws.meta.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {confirmId === ws.id ? (
                          <button
                            type="button"
                            onClick={e => handleDeleteClick(e, ws.id)}
                            className="text-xs px-2 py-0.5 rounded-lg bg-red-500 text-white font-semibold animate-pulse min-h-[28px]"
                          >Supprimer ?</button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={e => handleDuplicateClick(e, ws)}
                              className="text-gray-300 dark:text-gray-600 hover:text-indigo-400 sm:opacity-0 sm:group-hover:opacity-100 transition text-sm p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                              title="Dupliquer"
                            >⧉</button>
                            <button
                              type="button"
                              onClick={e => handleDeleteClick(e, ws.id)}
                              className="text-gray-300 dark:text-gray-600 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition text-sm p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                              title="Supprimer"
                            >🗑</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ws.meta.subject && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subjectColor(ws.meta.subject)}`}>
                          {ws.meta.subject}
                        </span>
                      )}
                      {ws.meta.level && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{ws.meta.level}</span>
                      )}
                      {ws.version && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-semibold">Version {ws.version}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {ws.blocks.length} bloc{ws.blocks.length !== 1 ? 's' : ''} · modifié {new Date(ws.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
              {filteredWorksheets.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 col-span-full py-4 text-center">Aucune fiche ne correspond à la recherche.</p>
              )}
            </div>
          </section>
        )}

        {/* Templates */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Modèles prêts à l'emploi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Démarrez depuis un modèle et personnalisez-le.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => createFromTemplate(tpl)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition text-left p-4 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800 rounded-lg flex items-center justify-center text-xl flex-shrink-0 transition">
                    {tpl.meta.subject === 'Mathématiques' ? '∑' :
                     tpl.meta.subject === 'Français' ? '✍' :
                     tpl.meta.subject === 'Histoire-Géographie' ? '🗺' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">{tpl.meta.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subjectColor(tpl.meta.subject)}`}>
                        {tpl.meta.subject}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tpl.meta.level}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{tpl.blocks.length} blocs prêts</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="bg-indigo-50 dark:bg-indigo-950 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3 text-sm">💡 Ce que vous pouvez créer</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-indigo-800 dark:text-indigo-300">
            {[
              '∑ Formules mathématiques',
              '½ Fractions complexes',
              '▦ Tableaux à remplir',
              '⊞ Texte en colonnes',
              '◆ Formes géométriques',
              '📝 Exercices numérotés',
              '___ Lignes de réponse',
              '• Listes structurées',
              '🖨 Export PDF / impression',
            ].map(tip => (
              <div key={tip} className="flex items-center gap-1.5">
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Install PWA hint */}
        <div className="text-center pb-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            📱 Sur iPhone : Safari → Partager → «Sur l'écran d'accueil» pour installer l'application
          </p>
        </div>
      </div>
    </div>
  )
}
