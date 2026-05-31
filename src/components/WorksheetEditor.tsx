import { useState } from 'react'
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

export default function WorksheetEditor({ worksheet, onChange, onBack, onDifferentiate }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [correctionMode, setCorrectionMode] = useState(false)
  const [editingHeader, setEditingHeader] = useState(false)
  const [showBank, setShowBank] = useState(false)
  const [showPresentation, setShowPresentation] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 sticky top-0 z-30 print:hidden flex-wrap">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex-shrink-0" title="Retour">←</button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {worksheet.meta.title}
            {worksheet.version && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">Version {worksheet.version}</span>}
          </p>
          <p className="text-xs text-gray-400">{worksheet.meta.subject} · {worksheet.meta.level}</p>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setShowAI(true)} className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-xs font-bold transition shadow-sm" title="Générer avec l'IA">✨ IA</button>
          <button onClick={() => setShowBank(!showBank)} className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition border border-amber-200" title="Banque de questions">📚</button>
          <button onClick={() => setShowPresentation(true)} className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition border border-purple-200" title="Mode présentation">🎯</button>
          <button onClick={shareWorksheet} className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition border border-blue-200" title="Partager par lien">📤</button>
          <button onClick={() => onDifferentiate(worksheet)} className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-medium transition border border-teal-200" title="Créer une version différenciée">⊕ Version B</button>
          <button
            onClick={() => setCorrectionMode(!correctionMode)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition border ${correctionMode ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
            title="Mode corrigé"
          >
            {correctionMode ? '✓ Corrigé' : '✓ Corrigé'}
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition border ${previewMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
          >
            {previewMode ? '✏️' : '👁'}
          </button>
          <button onClick={printWorksheet} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition">
            🖨 Imprimer
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-[210mm] mx-auto">
            <div id="worksheet-print" className="bg-white shadow-lg rounded-lg p-8 min-h-[297mm]">
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
