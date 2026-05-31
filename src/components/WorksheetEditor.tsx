import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Worksheet, Block, BlockType } from '../types/worksheet'
import { saveToBank } from '../utils/storage'
import { worksheetToURL } from '../utils/share'
import BlockRenderer from './BlockRenderer'
import BlockEditor from './BlockEditor'
import WorksheetHeader from './WorksheetHeader'
import QuestionBank from './QuestionBank'
import PresentationMode from './PresentationMode'
import AIGenerator from './AIGenerator'
import { printWorksheet } from '../utils/export'

interface Props {
  worksheet: Worksheet
  onChange: (ws: Worksheet) => void
  onBack: () => void
  onDifferentiate: (ws: Worksheet) => void
  darkMode?: boolean
  onToggleDark?: () => void
}

const BLOCK_MENU: { type: BlockType; label: string; icon: string; desc: string; group: string }[] = [
  { type: 'exercise-header', label: 'Exercice', icon: '📝', desc: 'En-tête numéroté avec points', group: 'Structure' },
  { type: 'heading', label: 'Titre', icon: 'T', desc: 'Titre de section H1/H2/H3', group: 'Structure' },
  { type: 'divider', label: 'Séparateur', icon: '—', desc: 'Ligne de séparation', group: 'Structure' },
  { type: 'text', label: 'Texte', icon: '¶', desc: 'Paragraphe de texte libre', group: 'Contenu' },
  { type: 'math', label: 'Formule maths', icon: '∑', desc: 'Expression LaTeX (fractions…)', group: 'Contenu' },
  { type: 'numbered-list', label: 'Liste numérotée', icon: '1.', desc: 'Liste avec numéros', group: 'Contenu' },
  { type: 'bullet-list', label: 'Liste à puces', icon: '•', desc: 'Liste avec puces', group: 'Contenu' },
  { type: 'image', label: 'Image', icon: '🖼', desc: 'Image depuis URL', group: 'Contenu' },
  { type: 'exercise-item', label: 'Question / Réponse', icon: '❓', desc: 'Zone question + réponse flexible', group: 'Exercices' },
  { type: 'qcm', label: 'QCM', icon: '🔘', desc: 'Questions à choix multiples', group: 'Exercices' },
  { type: 'true-false', label: 'Vrai / Faux', icon: '✓✗', desc: 'Affirmations à cocher', group: 'Exercices' },
  { type: 'fill-blank', label: 'Texte à trous', icon: '___', desc: 'Texte avec trous à compléter', group: 'Exercices' },
  { type: 'matching', label: 'Relier', icon: '↔', desc: 'Relier deux colonnes', group: 'Exercices' },
  { type: 'blank-lines', label: 'Lignes réponse', icon: '≡', desc: 'Lignes pour écrire', group: 'Exercices' },
  { type: 'rubric', label: 'Grille d\'évaluation', icon: '📋', desc: 'Critères avec niveaux', group: 'Exercices' },
  { type: 'table', label: 'Tableau', icon: '▦', desc: 'Tableau lignes/colonnes', group: 'Mise en page' },
  { type: 'columns', label: 'Colonnes', icon: '⊞', desc: 'Texte en colonnes', group: 'Mise en page' },
  { type: 'shape', label: 'Formes', icon: '◆', desc: 'Formes géométriques colorées', group: 'Mise en page' },
]

const GROUPS = ['Structure', 'Contenu', 'Exercices', 'Mise en page']
const MAX_HISTORY = 50

// Page border presets
const BORDER_PRESETS = [
  { label: 'Classique fin', color: '#374151', width: 1, style: 'solid' as const, offset: 8 },
  { label: 'Double trait', color: '#1e1b4b', width: 3, style: 'double' as const, offset: 10 },
  { label: 'Pointillés', color: '#6366f1', width: 2, style: 'dashed' as const, offset: 10 },
  { label: 'Sans cadre', color: '', width: 0, style: 'solid' as const, offset: 8 },
]

function createDefaultBlock(type: BlockType): Block {
  const id = uuidv4()
  switch (type) {
    case 'text': return { id, type, content: '' }
    case 'heading': return { id, type, content: '', level: 2 }
    case 'math': return { id, type, latex: '\\frac{a}{b}', display: 'block' }
    case 'table': return { id, type, hasHeader: true, rows: [
      [{ content: 'Colonne 1', bold: true }, { content: 'Colonne 2', bold: true }],
      [{ content: '' }, { content: '' }],
      [{ content: '' }, { content: '' }],
    ]}
    case 'columns': return { id, type, columns: 2, content: ['', ''] }
    case 'numbered-list': return { id, type, items: ['Premier élément', 'Deuxième élément'] }
    case 'bullet-list': return { id, type, items: ['Premier élément', 'Deuxième élément'] }
    case 'blank-lines': return { id, type, count: 4, lined: true }
    case 'shape': return { id, type, variant: 'rectangle', color: '#4f46e5', size: 'md', count: 1 }
    case 'divider': return { id, type, style: 'solid' }
    case 'exercise-header': return { id, type, number: 1, title: 'Exercice', points: 4 }
    case 'image': return { id, type, src: '', alt: '', width: 'full', align: 'center' }
    case 'qcm': return { id, type, question: '', options: ['', '', '', ''], style: 'letters', multipleAnswers: false }
    case 'true-false': return { id, type, instruction: 'Coche Vrai ou Faux.', statements: ['Affirmation 1', 'Affirmation 2', 'Affirmation 3'] }
    case 'fill-blank': return { id, type, instruction: 'Complète les phrases suivantes.', text: 'Le ___ se lève à l\'___.', wordBank: [], showWordBank: false }
    case 'matching': return { id, type, instruction: 'Relie chaque élément à sa définition.', leftItems: ['Élément 1', 'Élément 2', 'Élément 3'], rightItems: ['Définition A', 'Définition B', 'Définition C'] }
    case 'exercise-item': return { id, type, questionText: '', questionStyle: 'plain', answerStyle: 'lines', lineCount: 3, boxHeight: 'md', qcmOptions: ['', '', '', ''], qcmOptionStyle: 'letters', layout: 'stacked' }
    case 'rubric': return { id, type, title: 'Grille d\'évaluation', levels: ['Insuffisant', 'Satisfaisant', 'Bien', 'Très bien'], criteria: [
      { name: 'Critère 1', descriptions: ['', '', '', ''] },
      { name: 'Critère 2', descriptions: ['', '', '', ''] },
    ], showPoints: false }
    default: return { id, type: 'text', content: '' } as Block
  }
}

function blockPreviewLabel(block: Block): string {
  const menuItem = BLOCK_MENU.find(m => m.type === block.type)
  const icon = menuItem?.icon ?? '·'
  switch (block.type) {
    case 'text': return `${icon} ${(block.content || '').slice(0, 30) || 'Texte vide'}`
    case 'heading': return `${icon} ${(block.content || '').slice(0, 30) || 'Titre vide'}`
    case 'exercise-header': return `${icon} Ex. ${block.number} — ${block.title}`
    case 'qcm': return `${icon} ${(block.question || '').slice(0, 28) || 'QCM'}`
    case 'true-false': return `${icon} Vrai/Faux (${block.statements.length})`
    case 'fill-blank': return `${icon} ${(block.instruction || 'Texte à trous').slice(0, 28)}`
    case 'matching': return `${icon} Relier (${block.leftItems.length})`
    case 'exercise-item': return `${icon} ${(block.questionText || '').slice(0, 28) || 'Question'}`
    case 'table': return `${icon} Tableau ${block.rows[0]?.length ?? 0}×${block.rows.length}`
    case 'columns': return `${icon} Colonnes ×${block.columns}`
    case 'math': return `${icon} ${block.latex.slice(0, 25)}`
    case 'image': return `${icon} Image`
    case 'divider': return `${icon} Séparateur`
    case 'blank-lines': return `${icon} Lignes ×${block.count}`
    case 'rubric': return `${icon} Grille (${block.criteria.length} critères)`
    case 'shape': return `${icon} ${block.variant} ×${block.count ?? 1}`
    default: return menuItem?.label ?? 'Bloc'
  }
}

// --- Left Sidebar ---
interface SidebarProps {
  blocks: Block[]
  selectedId: string | null
  onAddBlock: (type: BlockType) => void
  onSelectBlock: (id: string) => void
  onReorderBlocks: (blocks: Block[]) => void
  collapsed: boolean
  onToggle: () => void
  sidebarTab: 'palette' | 'nav'
  onTabChange: (t: 'palette' | 'nav') => void
}

function EditorSidebar({ blocks, selectedId, onAddBlock, onSelectBlock, onReorderBlocks, collapsed, onToggle, sidebarTab, onTabChange }: SidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const dragNavRef = useRef<number | null>(null)
  const [navDragOver, setNavDragOver] = useState<number | null>(null)

  const toggleGroup = (g: string) => setCollapsedGroups(prev => ({ ...prev, [g]: !prev[g] }))

  const handleNavDragStart = (idx: number) => { dragNavRef.current = idx }
  const handleNavDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (navDragOver !== idx) setNavDragOver(idx)
  }
  const handleNavDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    const dragIdx = dragNavRef.current
    if (dragIdx === null || dragIdx === dropIdx) { dragNavRef.current = null; setNavDragOver(null); return }
    const newBlocks = [...blocks]
    const [item] = newBlocks.splice(dragIdx, 1)
    newBlocks.splice(dropIdx, 0, item)
    onReorderBlocks(newBlocks)
    dragNavRef.current = null
    setNavDragOver(null)
  }

  const blockRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (selectedId && sidebarTab === 'nav') {
      const el = document.getElementById(`nav-block-${selectedId}`)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedId, sidebarTab])

  return (
    <>
      {/* Overlay backdrop on mobile when open */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel */}
      <div
        ref={blockRef}
        className={[
          'flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 print:hidden transition-all duration-200 overflow-hidden',
          'fixed md:relative z-40 md:z-auto top-0 bottom-0 left-0',
          collapsed ? 'w-0 md:w-0' : 'w-64 md:w-64',
        ].join(' ')}
        style={{ height: '100%' }}
      >
        {!collapsed && (
          <>
            {/* Tab header */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => onTabChange('palette')}
                className={`flex-1 py-2.5 text-xs font-semibold transition ${sidebarTab === 'palette' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                + Palette
              </button>
              <button
                onClick={() => onTabChange('nav')}
                className={`flex-1 py-2.5 text-xs font-semibold transition ${sidebarTab === 'nav' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                ☰ Blocs
              </button>
              <button onClick={onToggle} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm">✕</button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === 'palette' && (
                <div className="p-2 space-y-1">
                  {GROUPS.map(group => (
                    <div key={group}>
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200 transition rounded"
                      >
                        <span>{group}</span>
                        <span className="text-gray-300 dark:text-gray-600">{collapsedGroups[group] ? '▶' : '▼'}</span>
                      </button>
                      {!collapsedGroups[group] && (
                        <div className="space-y-0.5 mb-1">
                          {BLOCK_MENU.filter(m => m.group === group).map(item => (
                            <button
                              key={item.type}
                              onClick={() => onAddBlock(item.type)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-left transition group"
                            >
                              <span className="w-6 h-6 bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800 rounded flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 flex-shrink-0">{item.icon}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight">{item.label}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {sidebarTab === 'nav' && (
                <div className="p-2 space-y-0.5">
                  {blocks.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">Aucun bloc dans la fiche.</p>
                  )}
                  {blocks.map((block, idx) => (
                    <div
                      id={`nav-block-${block.id}`}
                      key={block.id}
                      draggable
                      onDragStart={() => handleNavDragStart(idx)}
                      onDragOver={e => handleNavDragOver(e, idx)}
                      onDrop={e => handleNavDrop(e, idx)}
                      onDragEnd={() => { dragNavRef.current = null; setNavDragOver(null) }}
                      onClick={() => {
                        onSelectBlock(block.id)
                        const el = document.getElementById(`block-${block.id}`)
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                      className={[
                        'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition text-xs',
                        selectedId === block.id
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                        navDragOver === idx ? 'border-t-2 border-blue-400' : '',
                      ].join(' ')}
                    >
                      <span className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 flex items-center justify-center text-xs font-mono flex-shrink-0 cursor-grab">{idx + 1}</span>
                      <span className="truncate flex-1 font-medium leading-snug">{blockPreviewLabel(block)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// --- Page Border Panel ---
interface PageBorderPanelProps {
  meta: { pageBorderColor?: string; pageBorderWidth?: number; pageBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'ridge' | 'groove'; pageBorderOffset?: number }
  onChange: (patch: { pageBorderColor?: string; pageBorderWidth?: number; pageBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'ridge' | 'groove'; pageBorderOffset?: number }) => void
  onClose: () => void
}

function PageBorderPanel({ meta, onChange, onClose }: PageBorderPanelProps) {
  const color = meta.pageBorderColor ?? '#374151'
  const width = meta.pageBorderWidth ?? 0
  const style = meta.pageBorderStyle ?? 'solid'
  const offset = meta.pageBorderOffset ?? 8

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-80 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">📄 Cadre de page</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">✕</button>
        </div>

        {/* Presets */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Présets</p>
          <div className="grid grid-cols-2 gap-2">
            {BORDER_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => onChange({ pageBorderColor: p.color, pageBorderWidth: p.width, pageBorderStyle: p.style, pageBorderOffset: p.offset })}
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Couleur du cadre</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={e => onChange({ pageBorderColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
            />
            <input
              type="text"
              value={color}
              onChange={e => onChange({ pageBorderColor: e.target.value })}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
            />
          </div>
        </label>

        {/* Width */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Épaisseur : {width} mm</span>
          <input
            type="range"
            min={0}
            max={8}
            value={width}
            onChange={e => onChange({ pageBorderWidth: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </label>

        {/* Style */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Style</span>
          <select
            value={style}
            onChange={e => onChange({ pageBorderStyle: e.target.value as 'solid' | 'dashed' | 'dotted' | 'double' | 'ridge' | 'groove' })}
            className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="solid">Trait plein</option>
            <option value="dashed">Tirets</option>
            <option value="dotted">Pointillés</option>
            <option value="double">Double trait</option>
            <option value="ridge">Relief</option>
            <option value="groove">Gravé</option>
          </select>
        </label>

        {/* Offset */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Marge intérieure : {offset} mm</span>
          <input
            type="range"
            min={5}
            max={20}
            value={offset}
            onChange={e => onChange({ pageBorderOffset: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </label>

        {/* Remove border */}
        <button
          onClick={() => onChange({ pageBorderWidth: 0, pageBorderColor: '' })}
          className="w-full text-xs py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
        >
          Retirer le cadre
        </button>
      </div>
    </div>
  )
}

export default function WorksheetEditor({ worksheet, onChange, onBack, onDifferentiate, darkMode, onToggleDark }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [correctionMode, setCorrectionMode] = useState(false)
  const [editingHeader, setEditingHeader] = useState(false)
  const [showBank, setShowBank] = useState(false)
  const [showPresentation, setShowPresentation] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showPageBorder, setShowPageBorder] = useState(false)

  // Feature 3: Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('fichespro_sidebar_collapsed') === 'true' } catch { return false }
  })
  const [sidebarTab, setSidebarTab] = useState<'palette' | 'nav'>('palette')

  const toggleSidebar = () => {
    setSidebarCollapsed(v => {
      const next = !v
      try { localStorage.setItem('fichespro_sidebar_collapsed', String(next)) } catch { /* ignore */ }
      return next
    })
  }

  // Feature 3: Save indicator
  const [savedBadge, setSavedBadge] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Feature 6: Undo/Redo history
  const historyRef = useRef<Block[][]>([worksheet.blocks])
  const historyIndexRef = useRef(0)
  const [, forceRender] = useState(0)
  const skipHistoryPushRef = useRef(false)

  // Feature 7: Drag and drop
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const showSavedBadge = useCallback(() => {
    setSavedBadge(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSavedBadge(false), 2000)
  }, [])

  const pushHistory = useCallback((blocks: Block[]) => {
    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false
      return
    }
    const idx = historyIndexRef.current
    const newHistory = historyRef.current.slice(0, idx + 1)
    newHistory.push(blocks)
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    historyRef.current = newHistory
    historyIndexRef.current = newHistory.length - 1
    forceRender(n => n + 1)
  }, [])

  const updateBlocks = useCallback((blocks: Block[]) => {
    pushHistory(blocks)
    onChange({ ...worksheet, blocks, updatedAt: new Date().toISOString() })
    showSavedBadge()
  }, [onChange, worksheet, pushHistory, showSavedBadge])

  const updateBlock = useCallback((id: string, block: Block) => {
    updateBlocks(worksheet.blocks.map(b => b.id === id ? block : b))
  }, [updateBlocks, worksheet.blocks])

  // Feature 6: Undo
  const undo = useCallback(() => {
    const idx = historyIndexRef.current
    if (idx <= 0) return
    const newIdx = idx - 1
    skipHistoryPushRef.current = true
    historyIndexRef.current = newIdx
    forceRender(n => n + 1)
    const blocks = historyRef.current[newIdx]
    onChange({ ...worksheet, blocks, updatedAt: new Date().toISOString() })
    showSavedBadge()
  }, [onChange, worksheet, showSavedBadge])

  // Feature 6: Redo
  const redo = useCallback(() => {
    const idx = historyIndexRef.current
    if (idx >= historyRef.current.length - 1) return
    const newIdx = idx + 1
    skipHistoryPushRef.current = true
    historyIndexRef.current = newIdx
    forceRender(n => n + 1)
    const blocks = historyRef.current[newIdx]
    onChange({ ...worksheet, blocks, updatedAt: new Date().toISOString() })
    showSavedBadge()
  }, [onChange, worksheet, showSavedBadge])

  // Feature 6: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isInput) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const addBlock = (type: BlockType) => {
    const newBlock = createDefaultBlock(type)
    const idx = selectedId ? worksheet.blocks.findIndex(b => b.id === selectedId) + 1 : worksheet.blocks.length
    const blocks = [...worksheet.blocks]
    blocks.splice(idx, 0, newBlock)
    updateBlocks(blocks)
    setSelectedId(newBlock.id)
    setShowAddMenu(false)
  }

  const insertBlock = (block: Block) => {
    const idx = selectedId ? worksheet.blocks.findIndex(b => b.id === selectedId) + 1 : worksheet.blocks.length
    const blocks = [...worksheet.blocks]
    blocks.splice(idx, 0, block)
    updateBlocks(blocks)
    setSelectedId(block.id)
    setShowBank(false)
    showToast('Bloc inséré depuis la banque')
  }

  const deleteBlock = (id: string) => {
    updateBlocks(worksheet.blocks.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const moveBlock = (id: string, dir: -1 | 1) => {
    const blocks = [...worksheet.blocks]
    const idx = blocks.findIndex(b => b.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= blocks.length) return
    ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
    updateBlocks(blocks)
  }

  const duplicateBlock = (id: string) => {
    const block = worksheet.blocks.find(b => b.id === id)
    if (!block) return
    const clone = { ...block, id: uuidv4() }
    const idx = worksheet.blocks.findIndex(b => b.id === id)
    const blocks = [...worksheet.blocks]
    blocks.splice(idx + 1, 0, clone)
    updateBlocks(blocks)
    setSelectedId(clone.id)
  }

  const saveToBankAndNotify = (block: Block) => {
    saveToBank(block)
    showToast('⭐ Sauvegardé dans la banque')
  }

  const shareWorksheet = async () => {
    const url = worksheetToURL(worksheet)
    try {
      await navigator.clipboard.writeText(url)
      showToast('🔗 Lien copié dans le presse-papiers !')
    } catch {
      prompt('Copiez ce lien :', url)
    }
  }

  // Feature 5: Total points
  const totalPoints = worksheet.blocks
    .filter(b => b.type === 'exercise-header')
    .reduce((sum, b) => {
      const pts = (b as { points?: number }).points
      return sum + (typeof pts === 'number' ? pts : 0)
    }, 0)

  const copyPoints = async () => {
    try {
      await navigator.clipboard.writeText(`${totalPoints} pts`)
      showToast(`📋 "${totalPoints} pts" copié !`)
    } catch { /* ignore */ }
  }

  // Feature 7: Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation()
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) {
      dragIndexRef.current = null
      setDragOverIndex(null)
      setIsDragging(false)
      return
    }
    const blocks = [...worksheet.blocks]
    const [dragged] = blocks.splice(dragIndex, 1)
    blocks.splice(dropIndex, 0, dragged)
    updateBlocks(blocks)
    dragIndexRef.current = null
    setDragOverIndex(null)
    setIsDragging(false)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragOverIndex(null)
    setIsDragging(false)
  }

  const selected = worksheet.blocks.find(b => b.id === selectedId)

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  // Build page border style
  const borderW = worksheet.meta.pageBorderWidth ?? 0
  const borderColor = worksheet.meta.pageBorderColor ?? ''
  const borderStyle = worksheet.meta.pageBorderStyle ?? 'solid'
  const borderOffset = worksheet.meta.pageBorderOffset ?? 8
  const hasBorder = borderW > 0 && borderColor

  const printAreaStyle: React.CSSProperties = hasBorder
    ? {
        border: `${borderW}mm ${borderStyle} ${borderColor}`,
        padding: `${borderOffset}mm`,
        boxSizing: 'border-box',
      }
    : {}

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg shadow-lg print:hidden">
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-1.5 sticky top-0 z-30 print:hidden flex-wrap">
        {/* Sidebar toggle */}
        {!previewMode && (
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 flex-shrink-0"
            title={sidebarCollapsed ? 'Ouvrir le panneau' : 'Fermer le panneau'}
          >
            {sidebarCollapsed ? '☰' : '⊲'}
          </button>
        )}
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 flex-shrink-0" title="Retour">←</button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {worksheet.meta.title}
            {worksheet.version && <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">Version {worksheet.version}</span>}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{worksheet.meta.subject} · {worksheet.meta.level}</p>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Feature 3: Saved badge */}
          {savedBadge && (
            <span className="text-xs text-gray-400 dark:text-gray-500 px-1.5 py-1 select-none">✓ Enregistré</span>
          )}

          {/* Feature 5: Points badge */}
          {totalPoints > 0 && (
            <button
              onClick={copyPoints}
              className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition min-h-[28px]"
              title="Cliquer pour copier le total des points"
            >
              {totalPoints} pts
            </button>
          )}

          {/* Feature 6: Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-xs disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="Annuler (Ctrl+Z)"
          >↩</button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-xs disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="Rétablir (Ctrl+Y)"
          >↪</button>

          {/* Feature 1: Page border button */}
          {!previewMode && (
            <button
              onClick={() => setShowPageBorder(true)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition border border-slate-200 dark:border-slate-600"
              title="Cadre de page"
            >
              📄 Page
            </button>
          )}

          <button onClick={() => setShowAI(true)} className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-xs font-bold transition shadow-sm" title="Générer avec l'IA">✨ IA</button>
          <button onClick={() => setShowBank(!showBank)} className="px-2 py-1.5 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium transition border border-amber-200 dark:border-amber-700" title="Banque de questions">📚</button>
          <button onClick={() => setShowPresentation(true)} className="px-2 py-1.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium transition border border-purple-200 dark:border-purple-700" title="Mode présentation">🎯</button>
          <button onClick={shareWorksheet} className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium transition border border-blue-200 dark:border-blue-700" title="Partager par lien">📤</button>
          <button onClick={() => onDifferentiate(worksheet)} className="px-2 py-1.5 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 rounded-lg text-xs font-medium transition border border-teal-200 dark:border-teal-700" title="Créer une version différenciée">⊕ Version B</button>
          <button
            onClick={() => setCorrectionMode(!correctionMode)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition border ${correctionMode ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50'}`}
            title="Mode corrigé"
          >
            {correctionMode ? '✓ Corrigé' : '✓ Corrigé'}
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition border ${previewMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            {previewMode ? '✏️' : '👁'}
          </button>
          <button onClick={printWorksheet} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition">
            🖨 Imprimer
          </button>
          {/* Feature 10: Dark mode toggle */}
          {onToggleDark && (
            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar */}
        {!previewMode && (
          <EditorSidebar
            blocks={worksheet.blocks}
            selectedId={selectedId}
            onAddBlock={addBlock}
            onSelectBlock={id => setSelectedId(id)}
            onReorderBlocks={updateBlocks}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            sidebarTab={sidebarTab}
            onTabChange={setSidebarTab}
          />
        )}

        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-[210mm] mx-auto">
            <div
              id="worksheet-print"
              className="bg-white shadow-lg rounded-lg min-h-[297mm]"
              style={hasBorder ? { ...printAreaStyle, padding: `${borderOffset}mm` } : { padding: '2rem' }}
            >
              <WorksheetHeader
                meta={worksheet.meta}
                editMode={!previewMode && editingHeader}
                onChange={meta => onChange({ ...worksheet, meta, updatedAt: new Date().toISOString() })}
                onClose={() => setEditingHeader(false)}
              />

              {!previewMode && !editingHeader && (
                <button onClick={() => setEditingHeader(true)} className="text-xs text-indigo-500 hover:text-indigo-700 mb-4 print:hidden underline">
                  ✏️ Modifier l'en-tête
                </button>
              )}

              <div className="space-y-1">
                {worksheet.blocks.map((block, index) => {
                  const isDragSource = isDragging && dragIndexRef.current === index
                  const isDropTarget = dragOverIndex === index && dragIndexRef.current !== null && dragIndexRef.current !== index
                  return (
                    <div
                      key={block.id}
                      id={`block-${block.id}`}
                      draggable={!previewMode}
                      onDragStart={e => handleDragStart(e, index)}
                      onDragOver={e => handleDragOver(e, index)}
                      onDrop={e => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => !previewMode && setSelectedId(block.id)}
                      className={[
                        'relative group rounded transition',
                        !previewMode ? 'hover:ring-2 hover:ring-indigo-200 cursor-pointer' : '',
                        selectedId === block.id && !previewMode ? 'ring-2 ring-indigo-400 bg-indigo-50/30' : '',
                        isDragSource ? 'opacity-40' : '',
                        isDropTarget ? 'border-t-2 border-blue-500' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {!previewMode && (
                        <div className="absolute -right-1 -top-1 hidden group-hover:flex gap-1 z-10 print:hidden">
                          {/* Feature 7: Drag handle */}
                          <span
                            className="w-6 h-6 bg-white border border-gray-200 rounded shadow text-xs flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 select-none"
                            title="Glisser pour réordonner"
                            onMouseDown={e => e.stopPropagation()}
                          >⠿</span>
                          <button type="button" onClick={e => { e.stopPropagation(); moveBlock(block.id, -1) }} className="w-6 h-6 bg-white border border-gray-200 rounded shadow text-xs flex items-center justify-center hover:bg-gray-50" title="Monter">↑</button>
                          <button type="button" onClick={e => { e.stopPropagation(); moveBlock(block.id, 1) }} className="w-6 h-6 bg-white border border-gray-200 rounded shadow text-xs flex items-center justify-center hover:bg-gray-50" title="Descendre">↓</button>
                          <button type="button" onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }} className="w-6 h-6 bg-white border border-gray-200 rounded shadow text-xs flex items-center justify-center hover:bg-gray-50" title="Dupliquer">⧉</button>
                          <button type="button" onClick={e => { e.stopPropagation(); saveToBankAndNotify(block) }} className="w-6 h-6 bg-white border border-amber-200 rounded shadow text-xs text-amber-500 flex items-center justify-center hover:bg-amber-50" title="Sauvegarder dans la banque">⭐</button>
                          <button type="button" onClick={e => { e.stopPropagation(); deleteBlock(block.id) }} className="w-6 h-6 bg-white border border-red-200 rounded shadow text-xs text-red-500 flex items-center justify-center hover:bg-red-50" title="Supprimer">✕</button>
                        </div>
                      )}
                      <div className="px-1 py-0.5">
                        <BlockRenderer block={block} editMode={!previewMode} correctionMode={correctionMode} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {!previewMode && (
                <div className="mt-4 print:hidden">
                  {/* Mobile: show "+" add button. Desktop: hidden since sidebar has palette */}
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-400 hover:text-indigo-600 rounded-lg py-3 text-sm font-medium transition"
                  >
                    + Ajouter un bloc
                  </button>
                  {showAddMenu && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
                      {GROUPS.map(group => (
                        <div key={group} className="mb-4 last:mb-0">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {BLOCK_MENU.filter(m => m.group === group).map(item => (
                              <button
                                key={item.type}
                                onClick={() => addBlock(item.type)}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-50 text-left transition group"
                              >
                                <span className="w-7 h-7 bg-gray-100 group-hover:bg-indigo-100 rounded flex items-center justify-center text-xs font-bold text-gray-600 group-hover:text-indigo-700 flex-shrink-0">{item.icon}</span>
                                <div>
                                  <div className="text-xs font-medium text-gray-800 leading-tight">{item.label}</div>
                                  <div className="text-xs text-gray-400 leading-tight hidden sm:block">{item.desc}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        {!previewMode && selected && (
          <div className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0 print:hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {BLOCK_MENU.find(m => m.type === selected.type)?.label || 'Bloc'}
                </h3>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm">✕</button>
              </div>
              <BlockEditor block={selected} onChange={block => updateBlock(selected.id, block)} />
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                <button onClick={() => duplicateBlock(selected.id)} className="flex-1 text-xs py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600">⧉ Dupliquer</button>
                <button onClick={() => saveToBankAndNotify(selected)} className="flex-1 text-xs py-2 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-700">⭐ Banque</button>
                <button onClick={() => deleteBlock(selected.id)} className="flex-1 text-xs py-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-700">✕</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question bank drawer */}
      {showBank && <QuestionBank onInsert={insertBlock} onClose={() => setShowBank(false)} />}

      {/* Presentation mode */}
      {showPresentation && <PresentationMode worksheet={worksheet} onClose={() => setShowPresentation(false)} />}

      {/* AI Generator */}
      {showAI && (
        <AIGenerator
          defaultSubject={worksheet.meta.subject}
          defaultLevel={worksheet.meta.level}
          onInsert={blocks => {
            const idx = selectedId ? worksheet.blocks.findIndex(b => b.id === selectedId) + 1 : worksheet.blocks.length
            const newBlocks = [...worksheet.blocks]
            newBlocks.splice(idx, 0, ...blocks)
            updateBlocks(newBlocks)
            showToast(`✨ ${blocks.length} blocs insérés depuis l'IA`)
          }}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Page border panel */}
      {showPageBorder && (
        <PageBorderPanel
          meta={worksheet.meta}
          onChange={patch => onChange({ ...worksheet, meta: { ...worksheet.meta, ...patch }, updatedAt: new Date().toISOString() })}
          onClose={() => setShowPageBorder(false)}
        />
      )}
    </div>
  )
}
