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

const SUBJECT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Mathématiques':       { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-800 dark:text-blue-200',    dot: 'bg-blue-500' },
  'Français':            { bg: 'bg-pink-100 dark:bg-pink-900/40',    text: 'text-pink-800 dark:text-pink-200',    dot: 'bg-pink-500' },
  'Histoire-Géographie': { bg: 'bg-amber-100 dark:bg-amber-900/40',  text: 'text-amber-800 dark:text-amber-200',  dot: 'bg-amber-500' },
  'Sciences':            { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-800 dark:text-green-200',  dot: 'bg-green-500' },
  'Anglais':             { bg: 'bg-purple-100 dark:bg-purple-900/40',text: 'text-purple-800 dark:text-purple-200',dot: 'bg-purple-500' },
  'Espagnol':            { bg: 'bg-orange-100 dark:bg-orange-900/40',text: 'text-orange-800 dark:text-orange-200',dot: 'bg-orange-500' },
  'Physique-Chimie':     { bg: 'bg-cyan-100 dark:bg-cyan-900/40',    text: 'text-cyan-800 dark:text-cyan-200',    dot: 'bg-cyan-500' },
  'SVT':                 { bg: 'bg-emerald-100 dark:bg-emerald-900/40',text: 'text-emerald-800 dark:text-emerald-200',dot: 'bg-emerald-500' },
  'Informatique':        { bg: 'bg-violet-100 dark:bg-violet-900/40',text: 'text-violet-800 dark:text-violet-200',dot: 'bg-violet-500' },
}

function subjectStyle(s: string) {
  return SUBJECT_COLORS[s] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-400' }
}

function subjectEmoji(s: string) {
  const map: Record<string, string> = {
    'Mathématiques': '∑', 'Français': '✍', 'Histoire-Géographie': '🗺',
    'Sciences': '🔬', 'Anglais': '🇬🇧', 'Espagnol': '🇪🇸', 'Allemand': '🇩🇪',
    'Physique-Chimie': '⚗', 'SVT': '🌱', 'Informatique': '💻',
    'Arts plastiques': '🎨', 'Musique': '🎵', 'EPS': '⚽', 'Philosophie': '💭',
  }
  return map[s] || '📄'
}

function isRecent(updatedAt: string) {
  return Date.now() - new Date(updatedAt).getTime() < 24 * 60 * 60 * 1000
}

export default function TemplateGallery({ worksheets, onSelect, onDelete, onDuplicate, onRename, onImport, darkMode, onToggleDark }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string | null>(null)
  const [activeVersion, setActiveVersion] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    const ws: Worksheet = { ...tpl, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    onSelect(ws)
  }

  const createBlank = () => {
    const ws: Worksheet = {
      id: uuidv4(),
      meta: { title: 'Nouvelle fiche', subject: '', level: '', date: new Date().toLocaleDateString('fr-FR'), showScore: false, showName: true, showDate: true },
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSelect(ws)
  }

  const handleExport = () => {
    const data = JSON.stringify(worksheets, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fichespro-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string)
        onImport((Array.isArray(data) ? data : [data]) as Worksheet[])
      } catch { alert('Fichier JSON invalide') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Derived data
  const availableSubjects = Array.from(new Set(worksheets.map(ws => ws.meta.subject).filter(Boolean)))
  const availableLevels = Array.from(new Set(worksheets.map(ws => ws.meta.level).filter(Boolean)))
  const availableVersions = Array.from(new Set(worksheets.map(ws => ws.version).filter(Boolean))) as string[]
  const totalBlocks = worksheets.reduce((sum, ws) => sum + ws.blocks.length, 0)

  const filteredWorksheets = worksheets.filter(ws => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery ||
      ws.meta.title.toLowerCase().includes(q) ||
      ws.meta.subject.toLowerCase().includes(q) ||
      ws.meta.level.toLowerCase().includes(q)
    const matchesSubject = !activeSubject || ws.meta.subject === activeSubject
    const matchesLevel = !activeLevel || ws.meta.level === activeLevel
    const matchesVersion = !activeVersion || ws.version === activeVersion
    return matchesSearch && matchesSubject && matchesLevel && matchesVersion
  })

  const clearFilters = () => { setActiveSubject(null); setActiveLevel(null); setActiveVersion(null); setSearchQuery('') }
  const hasFilters = !!(activeSubject || activeLevel || activeVersion || searchQuery)

  // Sidebar content (shared between drawer on mobile and fixed on desktop)
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-5 flex-1">
        {/* Stats */}
        {worksheets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Vue d'ensemble</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-2.5 text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{worksheets.length}</p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400">fiche{worksheets.length > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-2.5 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalBlocks}</p>
                <p className="text-xs text-purple-500 dark:text-purple-400">blocs total</p>
              </div>
            </div>
          </div>
        )}

        {/* Subject filter */}
        {availableSubjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Matières</p>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveSubject(null)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition ${!activeSubject ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <span className="text-xs w-4">✦</span>
                <span className="flex-1 text-left">Toutes</span>
                <span className="text-xs text-gray-400">{worksheets.length}</span>
              </button>
              {availableSubjects.map(subj => {
                const style = subjectStyle(subj)
                const count = worksheets.filter(w => w.meta.subject === subj).length
                return (
                  <button
                    key={subj}
                    onClick={() => setActiveSubject(activeSubject === subj ? null : subj)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition ${activeSubject === subj ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                    <span className="flex-1 text-left truncate">{subj}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Level filter */}
        {availableLevels.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Niveaux</p>
            <div className="flex flex-wrap gap-1.5">
              {availableLevels.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(activeLevel === lvl ? null : lvl)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition ${activeLevel === lvl ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Version filter */}
        {availableVersions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Versions</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveVersion(null)}
                className={`text-xs px-2 py-1 rounded-lg font-medium transition ${!activeVersion ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >Toutes</button>
              {availableVersions.map(v => (
                <button
                  key={v}
                  onClick={() => setActiveVersion(activeVersion === v ? null : v)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition ${activeVersion === v ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  Version {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500">📱 Safari → Partager → «Sur l'écran d'accueil» pour installer</p>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-gray-950 overflow-hidden">
      {/* ─── Navbar ─── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 h-14 flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Filtres"
          >☰</button>

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base">F</div>
            <div className="hidden sm:block">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">FichesPro</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">Créateur de fiches</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xl mx-auto relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher une fiche…"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white dark:focus:bg-gray-800"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">✕</button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {worksheets.length > 0 && (
              <button onClick={handleExport} className="hidden sm:flex p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center justify-center" title="Exporter (JSON)">⬇</button>
            )}
            <button onClick={() => importRef.current?.click()} className="hidden sm:flex p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition items-center justify-center" title="Importer (JSON)">⬆</button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            <button onClick={onToggleDark} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-center" title={darkMode ? 'Mode clair' : 'Mode sombre'}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={createBlank} className="px-3 py-2 sm:px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition shadow-sm whitespace-nowrap">
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ Nouvelle fiche</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-72 bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Filtres</span>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">✕</button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

            {/* Stats bar */}
            {worksheets.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredWorksheets.length} fiche{filteredWorksheets.length > 1 ? 's' : ''}</span>
                {availableSubjects.length > 0 && <span>· {availableSubjects.length} matière{availableSubjects.length > 1 ? 's' : ''}</span>}
                {totalBlocks > 0 && <span>· {totalBlocks} blocs au total</span>}
                {hasFilters && (
                  <button onClick={clearFilters} className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    Effacer les filtres ✕
                  </button>
                )}
              </div>
            )}

            {/* Worksheets section */}
            {worksheets.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mes fiches</h2>
                  <button onClick={createBlank} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">+ Nouvelle fiche</button>
                </div>

                {filteredWorksheets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredWorksheets.map(ws => {
                      const style = subjectStyle(ws.meta.subject)
                      const recent = isRecent(ws.updatedAt)
                      return (
                        <div
                          key={ws.id}
                          className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition cursor-pointer flex flex-col"
                          onClick={() => onSelect(ws)}
                        >
                          {/* Card top bar */}
                          <div className={`h-1.5 rounded-t-2xl ${style.dot}`} />

                          <div className="p-4 flex flex-col flex-1 gap-3">
                            {/* Title row */}
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                {renamingId === ws.id ? (
                                  <input
                                    autoFocus
                                    className="w-full text-sm font-semibold border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    onBlur={() => commitRename(ws.id)}
                                    onKeyDown={e => { if (e.key === 'Enter') commitRename(ws.id); if (e.key === 'Escape') cancelRename() }}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ) : (
                                  <h3
                                    className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400"
                                    onClick={e => startRename(e, ws)}
                                    title="Cliquer pour renommer"
                                  >
                                    {ws.meta.title}
                                  </h3>
                                )}
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-0.5 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                {confirmId === ws.id ? (
                                  <button
                                    type="button"
                                    onClick={e => handleDeleteClick(e, ws.id)}
                                    className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white font-semibold animate-pulse"
                                  >Supprimer ?</button>
                                ) : (
                                  <>
                                    <button type="button" onClick={e => handleDuplicateClick(e, ws)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition" title="Dupliquer">⧉</button>
                                    <button type="button" onClick={e => handleDeleteClick(e, ws.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition" title="Supprimer">🗑</button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5">
                              {ws.meta.subject && (
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
                                  <span>{subjectEmoji(ws.meta.subject)}</span>
                                  {ws.meta.subject}
                                </span>
                              )}
                              {ws.meta.level && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{ws.meta.level}</span>
                              )}
                              {ws.version && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold">V{ws.version}</span>
                              )}
                              {recent && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">Récent</span>
                              )}
                            </div>

                            {/* Footer meta */}
                            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-auto pt-1 border-t border-gray-100 dark:border-gray-800">
                              <span>{ws.blocks.length} bloc{ws.blocks.length !== 1 ? 's' : ''}</span>
                              <span>{new Date(ws.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune fiche ne correspond</p>
                    <button onClick={clearFilters} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Effacer les filtres</button>
                  </div>
                )}
              </section>
            ) : (
              /* Empty state */
              <div className="py-20 text-center space-y-4">
                <div className="text-6xl">📋</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Créez votre première fiche</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fiches d'exercices, évaluations, supports de cours — tout en quelques clics.</p>
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button onClick={createBlank} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow">+ Créer une fiche vierge</button>
                  <button onClick={() => importRef.current?.click()} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">⬆ Importer</button>
                </div>
              </div>
            )}

            {/* Templates section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">✨</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Modèles prêts à l'emploi</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Démarrez depuis un modèle et personnalisez-le librement.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {TEMPLATES.map((tpl, i) => {
                  const style = subjectStyle(tpl.meta.subject)
                  return (
                    <button
                      key={i}
                      onClick={() => createFromTemplate(tpl)}
                      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition text-left overflow-hidden"
                    >
                      <div className={`h-1.5 ${style.dot}`} />
                      <div className="p-4 flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${style.bg}`}>
                          {subjectEmoji(tpl.meta.subject)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{tpl.meta.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>{tpl.meta.subject}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{tpl.meta.level}</span>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{tpl.blocks.length} blocs prêts · Utiliser →</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Capabilities */}
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm flex items-center gap-2">
                <span>💡</span> Ce que vous pouvez créer
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                {['∑ Formules mathématiques', '½ Fractions complexes', '▦ Tableaux à remplir', '⊞ Texte en colonnes', '◆ Formes géométriques', '📝 Exercices numérotés', '___ Lignes de réponse', '• Listes structurées', '🖨 Export PDF / impression'].map(tip => (
                  <div key={tip} className="flex items-center gap-1.5 py-1">{tip}</div>
                ))}
              </div>
            </section>

            {/* Mobile import/export */}
            <div className="flex sm:hidden items-center justify-center gap-3 pb-6">
              {worksheets.length > 0 && <button onClick={handleExport} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5">⬇ Exporter</button>}
              <button onClick={() => importRef.current?.click()} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5">⬆ Importer</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
