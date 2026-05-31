import { useState, useRef, useEffect } from 'react'
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
import { exportPDF } from '../utils/export-pdf'
import { exportDOCX } from '../utils/export-docx'

interface Props {
  worksheet: Worksheet
  onChange: (ws: Worksheet) => void
  onBack: () => void
  onDifferentiate: (ws: Worksheet) => void
  onToggleDark?: () => void
  darkMode?: boolean
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

export default function WorksheetEditor({ worksheet, onChange, onBack, onDifferentiate, onToggleDark, darkMode }: Props) {
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
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingDOCX, setExportingDOCX] = useState(false)

  const handleExportPDF = async () => {
    setExportingPDF(true)
    setShowMoreMenu(false)
    try { await exportPDF(worksheet) } catch (e) { showToast('Erreur export PDF') }
    setExportingPDF(false)
  }

  const handleExportDOCX = async () => {
    setExportingDOCX(true)
    setShowMoreMenu(false)
    try { await exportDOCX(worksheet) } catch (e) { showToast('Erreur export DOCX') }
    setExportingDOCX(false)
  }
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Sidebar state — collapsed by default on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('fichespro_sidebar_collapsed')
      if (stored !== null) return stored === 'true'
      return typeof window !== 'undefined' && window.innerWidth < 768
    } catch { return true }
  })
  const [sidebarTab, setSidebarTab] = useState<'palette' | 'nav'>('palette')

  const toggleSidebar = () => {
    setSidebarCollapsed(v => {
      const next = !v
      try { localStorage.setItem('fichespro_sidebar_collapsed', String(next)) } catch { /* ignore */ }
      return next
    })
  }

  // Close ⋮ menu on outside click
  useEffect(() => {
    if (!showMoreMenu) return
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setShowMoreMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMoreMenu])

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

  const updateBlocks = (blocks: Block[]) => onChange({ ...worksheet, blocks, updatedAt: new Date().toISOString() })
  const updateBlock = (id: string, block: Block) => updateBlocks(worksheet.blocks.map(b => b.id === id ? block : b))

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

  // Total points across exercise headers
  const totalPoints = worksheet.blocks.reduce((sum, b) => {
    if (b.type === 'exercise-header' && typeof b.points === 'number') return sum + b.points
    return sum
  }, 0)

  const copyPoints = async () => {
    const lines = worksheet.blocks
      .filter(b => b.type === 'exercise-header' && typeof (b as { points?: number }).points === 'number')
      .map(b => `Exercice ${(b as { number?: number }).number ?? ''}: ${(b as { points?: number }).points}pt`)
    const text = `Total: ${totalPoints}pt\n` + lines.join('\n')
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    showToast(`📋 Points copiés (${totalPoints}pt)`)
  }

  // Undo / Redo
  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  const undo = () => {
    if (!canUndo) return
    historyIndexRef.current -= 1
    skipHistoryPushRef.current = true
    onChange({ ...worksheet, blocks: historyRef.current[historyIndexRef.current] })
    forceRender(n => n + 1)
  }

  const redo = () => {
    if (!canRedo) return
    historyIndexRef.current += 1
    skipHistoryPushRef.current = true
    onChange({ ...worksheet, blocks: historyRef.current[historyIndexRef.current] })
    forceRender(n => n + 1)
  }

  const selected = worksheet.blocks.find(b => b.id === selectedId)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg print:hidden">
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-2 py-1.5 flex items-center gap-1 sticky top-0 z-30 print:hidden">
        {/* Back */}
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex-shrink-0 transition" title="Retour">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 pl-1">
          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
            {worksheet.meta.title}
            {worksheet.version && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium align-middle">v{worksheet.version}</span>}
          </p>
          <p className="text-[11px] text-gray-400 leading-tight hidden sm:block">{worksheet.meta.subject}{worksheet.meta.level ? ` · ${worksheet.meta.level}` : ''}</p>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg disabled:opacity-25 hover:bg-gray-100 text-gray-500 transition flex-shrink-0" title="Annuler (Ctrl+Z)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h13a5 5 0 010 10h-1"/></svg>
        </button>
        <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg disabled:opacity-25 hover:bg-gray-100 text-gray-500 transition flex-shrink-0" title="Rétablir (Ctrl+Y)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H8a5 5 0 000 10h1"/></svg>
        </button>

        {/* Points badge */}
        {totalPoints > 0 && (
          <button onClick={copyPoints} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold border border-indigo-200 flex-shrink-0 hidden sm:flex items-center gap-1 hover:bg-indigo-100 transition" title="Copier les points">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
            {totalPoints}pt
          </button>
        )}

        {/* Saved badge */}
        {savedBadge && (
          <span className="text-[11px] text-green-600 font-medium px-1 select-none hidden sm:inline-flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            Sauvegardé
          </span>
        )}

        {/* Header edit button */}
        {!previewMode && (
          <button
            onClick={() => setEditingHeader(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${editingHeader ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Modifier l'en-tête"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8"/></svg>
            <span className="hidden md:inline">En-tête</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Preview toggle */}
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${previewMode ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          title={previewMode ? 'Mode édition' : 'Aperçu'}
        >
          {previewMode ? (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg><span className="hidden md:inline">Éditer</span></>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg><span className="hidden md:inline">Aperçu</span></>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* Export group */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <button onClick={printWorksheet} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition border border-gray-200" title="Imprimer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span className="hidden lg:inline">Imprimer</span>
          </button>
          <button onClick={handleExportPDF} disabled={exportingPDF} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white transition shadow-sm" title="Exporter en PDF">
            {exportingPDF ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            )}
            PDF
          </button>
          <button onClick={handleExportDOCX} disabled={exportingDOCX} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition shadow-sm" title="Exporter en Word">
            {exportingDOCX ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><text x="2" y="17" fontSize="14" fontWeight="bold" fill="white">W</text></svg>
            )}
            Word
          </button>
        </div>

        {/* Tools group — desktop */}
        {!previewMode && (
          <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0 ml-1">
            <div className="h-6 w-px bg-gray-200 mr-1" />
            <button onClick={() => setShowAI(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white transition shadow-sm">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              IA
            </button>
            <button onClick={() => setShowBank(!showBank)} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition" title="Banque de questions">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </button>
            <button onClick={() => setShowPresentation(true)} className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition" title="Mode présentation">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
            </button>
            <button onClick={shareWorksheet} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition" title="Partager par lien">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            </button>
            <button onClick={() => onDifferentiate(worksheet)} className="p-2 rounded-lg text-teal-600 hover:bg-teal-50 transition" title="Version différenciée">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button
              onClick={() => setCorrectionMode(!correctionMode)}
              className={`p-2 rounded-lg transition ${correctionMode ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Mode corrigé"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
            <button onClick={() => setShowPageBorder(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition" title="Cadre de page">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </button>
            {onToggleDark && (
              <button onClick={onToggleDark} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition" title={darkMode ? 'Mode clair' : 'Mode sombre'}>
                {darkMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                )}
              </button>
            )}
          </div>
        )}

        {/* Mobile ⋮ overflow menu */}
        <div ref={moreMenuRef} className="relative sm:hidden flex-shrink-0">
          <button
            onClick={() => setShowMoreMenu(v => !v)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 min-w-[220px]" onClick={() => setShowMoreMenu(false)}>
              <p className="px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Export</p>
              <button onClick={printWorksheet} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Imprimer
              </button>
              <button onClick={handleExportPDF} disabled={exportingPDF} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                {exportingPDF ? 'Export PDF…' : 'Exporter en PDF'}
              </button>
              <button onClick={handleExportDOCX} disabled={exportingDOCX} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                {exportingDOCX ? 'Export Word…' : 'Exporter en Word'}
              </button>
              <div className="border-t border-gray-100 my-1" />
              <p className="px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Outils</p>
              <button onClick={() => setShowAI(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                Générer avec l'IA
              </button>
              <button onClick={() => setShowBank(!showBank)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                Banque de questions
              </button>
              <button onClick={() => setShowPresentation(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
                Mode présentation
              </button>
              <button onClick={shareWorksheet} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                Partager par lien
              </button>
              <button onClick={() => onDifferentiate(worksheet)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                Créer une version B
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => setCorrectionMode(!correctionMode)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {correctionMode ? 'Masquer le corrigé' : 'Afficher le corrigé'}
              </button>
              <button onClick={() => setShowPageBorder(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                Cadre de page
              </button>
              {totalPoints > 0 && (
                <button onClick={copyPoints} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  Copier les points ({totalPoints}pt)
                </button>
              )}
              {onToggleDark && (
                <button onClick={onToggleDark} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                  {darkMode ? 'Mode clair' : 'Mode sombre'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header editor — slide-down panel above the canvas */}
      {editingHeader && !previewMode && (
        <div className="bg-gray-50 border-b border-gray-200 print:hidden overflow-y-auto" style={{ maxHeight: '55vh' }}>
          <div className="max-w-2xl mx-auto px-4 py-4">
            <WorksheetHeader
              meta={worksheet.meta}
              editMode
              onChange={meta => onChange({ ...worksheet, meta, updatedAt: new Date().toISOString() })}
              onClose={() => setEditingHeader(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-[210mm] mx-auto">
            <div id="worksheet-print" className="bg-white shadow-lg rounded-lg p-8 min-h-[297mm]">
              {/* Header — always view-only inside the sheet */}
              {!previewMode && !editingHeader ? (
                <div
                  onClick={() => setEditingHeader(true)}
                  className="group relative rounded-xl cursor-pointer -mx-2 -mt-2 px-2 pt-2 pb-1 mb-2 hover:bg-violet-50/60 transition print:hidden"
                  title="Cliquer pour modifier l'en-tête"
                >
                  <WorksheetHeader meta={worksheet.meta} />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-violet-600 text-white text-xs px-2 py-1 rounded-lg shadow">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    Modifier l'en-tête
                  </div>
                </div>
              ) : (
                <WorksheetHeader meta={worksheet.meta} />
              )}

              <div className="space-y-1">
                {worksheet.blocks.map(block => (
                  <div
                    key={block.id}
                    onClick={() => !previewMode && setSelectedId(block.id)}
                    className={`relative group rounded transition ${!previewMode ? 'hover:ring-2 hover:ring-indigo-200 cursor-pointer' : ''} ${selectedId === block.id && !previewMode ? 'ring-2 ring-indigo-400 bg-indigo-50/30' : ''}`}
                  >
                    {!previewMode && (
                      <div className="absolute -right-1 -top-1 hidden group-hover:flex gap-1 z-10 print:hidden">
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
                ))}
              </div>

              {!previewMode && (
                <div className="mt-4 print:hidden">
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
          <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 print:hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {BLOCK_MENU.find(m => m.type === selected.type)?.label || 'Bloc'}
                </h3>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
              <BlockEditor block={selected} onChange={block => updateBlock(selected.id, block)} />
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button onClick={() => duplicateBlock(selected.id)} className="flex-1 text-xs py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200">⧉ Dupliquer</button>
                <button onClick={() => saveToBankAndNotify(selected)} className="flex-1 text-xs py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200">⭐ Banque</button>
                <button onClick={() => deleteBlock(selected.id)} className="flex-1 text-xs py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200">✕</button>
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
    </div>
  )
}
