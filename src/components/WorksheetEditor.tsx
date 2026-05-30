import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Worksheet, Block, BlockType } from '../types/worksheet'
import BlockRenderer from './BlockRenderer'
import BlockEditor from './BlockEditor'
import WorksheetHeader from './WorksheetHeader'
import { printWorksheet } from '../utils/export'

interface Props {
  worksheet: Worksheet
  onChange: (ws: Worksheet) => void
  onBack: () => void
}

const BLOCK_MENU: { type: BlockType; label: string; icon: string; desc: string }[] = [
  { type: 'exercise-header', label: 'Exercice', icon: '📝', desc: 'En-tête numéroté avec points' },
  { type: 'text', label: 'Texte', icon: '¶', desc: 'Paragraphe de texte libre' },
  { type: 'heading', label: 'Titre', icon: 'T', desc: 'Titre de section (H1/H2/H3)' },
  { type: 'math', label: 'Formule', icon: '∑', desc: 'Expression mathématique (LaTeX)' },
  { type: 'table', label: 'Tableau', icon: '▦', desc: 'Tableau avec lignes et colonnes' },
  { type: 'columns', label: 'Colonnes', icon: '⊞', desc: 'Mise en page multi-colonnes' },
  { type: 'numbered-list', label: 'Liste numérotée', icon: '1.', desc: 'Liste avec numéros' },
  { type: 'bullet-list', label: 'Liste à puces', icon: '•', desc: 'Liste avec puces' },
  { type: 'blank-lines', label: 'Lignes réponse', icon: '___', desc: 'Lignes pour réponses élèves' },
  { type: 'shape', label: 'Formes', icon: '◆', desc: 'Formes géométriques colorées' },
  { type: 'divider', label: 'Séparateur', icon: '—', desc: 'Ligne de séparation' },
  { type: 'image', label: 'Image', icon: '🖼', desc: 'Image depuis URL' },
]

function createDefaultBlock(type: BlockType): Block {
  const id = uuidv4()
  switch (type) {
    case 'text': return { id, type, content: '' }
    case 'heading': return { id, type, content: '', level: 2 }
    case 'math': return { id, type, latex: '\\frac{a}{b}', display: 'block' }
    case 'table': return {
      id, type, hasHeader: true,
      rows: [
        [{ content: 'Colonne 1', bold: true }, { content: 'Colonne 2', bold: true }],
        [{ content: '' }, { content: '' }],
        [{ content: '' }, { content: '' }],
      ]
    }
    case 'columns': return { id, type, columns: 2, content: ['', ''] }
    case 'numbered-list': return { id, type, items: ['Premier élément', 'Deuxième élément'] }
    case 'bullet-list': return { id, type, items: ['Premier élément', 'Deuxième élément'] }
    case 'blank-lines': return { id, type, count: 4, lined: true }
    case 'shape': return { id, type, variant: 'rectangle', color: '#4f46e5', size: 'md', count: 1 }
    case 'divider': return { id, type, style: 'solid' }
    case 'exercise-header': return { id, type, number: 1, title: 'Exercice', points: 4 }
    case 'image': return { id, type, src: '', alt: '', width: 'full', align: 'center' }
    default: return { id, type: 'text', content: '' } as Block
  }
}

export default function WorksheetEditor({ worksheet, onChange, onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [editingHeader, setEditingHeader] = useState(false)

  const updateBlocks = (blocks: Block[]) => {
    onChange({ ...worksheet, blocks, updatedAt: new Date().toISOString() })
  }

  const updateBlock = (id: string, block: Block) => {
    updateBlocks(worksheet.blocks.map(b => b.id === id ? block : b))
  }

  const addBlock = (type: BlockType) => {
    const newBlock = createDefaultBlock(type)
    const idx = selectedId ? worksheet.blocks.findIndex(b => b.id === selectedId) + 1 : worksheet.blocks.length
    const blocks = [...worksheet.blocks]
    blocks.splice(idx, 0, newBlock)
    updateBlocks(blocks)
    setSelectedId(newBlock.id)
    setShowAddMenu(false)
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

  const selected = worksheet.blocks.find(b => b.id === selectedId)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 sticky top-0 z-30 print:hidden">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Retour">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{worksheet.meta.title}</p>
          <p className="text-xs text-gray-400">{worksheet.meta.subject} · {worksheet.meta.level}</p>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${previewMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {previewMode ? '✏️ Éditer' : '👁 Aperçu'}
        </button>
        <button
          onClick={printWorksheet}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
        >
          Imprimer
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-[210mm] mx-auto">
            {/* Sheet paper */}
            <div
              id="worksheet-print"
              className={`bg-white shadow-lg rounded-lg p-8 min-h-[297mm] ${previewMode ? '' : 'cursor-default'}`}
            >
              {/* Header */}
              <div onClick={() => !previewMode && setEditingHeader(!editingHeader)}>
                <WorksheetHeader
                  meta={worksheet.meta}
                  editMode={!previewMode && editingHeader}
                  onChange={meta => onChange({ ...worksheet, meta, updatedAt: new Date().toISOString() })}
                />
              </div>

              {!previewMode && !editingHeader && (
                <button
                  onClick={() => setEditingHeader(true)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 mb-4 print:hidden"
                >
                  ✏️ Modifier l'en-tête
                </button>
              )}

              {/* Blocks */}
              <div className="space-y-1">
                {worksheet.blocks.map(block => (
                  <div
                    key={block.id}
                    onClick={() => !previewMode && setSelectedId(block.id)}
                    className={`relative group rounded transition ${!previewMode ? 'hover:ring-2 hover:ring-indigo-200 cursor-pointer' : ''} ${selectedId === block.id && !previewMode ? 'ring-2 ring-indigo-400 bg-indigo-50/30' : ''}`}
                  >
                    {!previewMode && (
                      <div className="absolute -right-1 -top-1 hidden group-hover:flex gap-1 z-10 print:hidden">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); moveBlock(block.id, -1) }}
                          className="w-6 h-6 bg-white border border-gray-200 rounded shadow text-xs flex items-center justify-center hover:bg-gray-50"
                          title="Monter"
                        >↑</button>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); moveBlock(block.id, 1) }}
                          className="w-6 h-6 bg-white border border-gray-200 rounded shadow text-xs flex items-center justify-center hover:bg-gray-50"
                          title="Descendre"
                        >↓</button>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }}
                          className="w-6 h-6 bg-white border border-gray-200 rounded shadow text-xs flex items-center justify-center hover:bg-gray-50"
                          title="Dupliquer"
                        >⧉</button>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); deleteBlock(block.id) }}
                          className="w-6 h-6 bg-white border border-red-200 rounded shadow text-xs text-red-500 flex items-center justify-center hover:bg-red-50"
                          title="Supprimer"
                        >✕</button>
                      </div>
                    )}
                    <div className="px-1 py-0.5">
                      <BlockRenderer block={block} editMode={!previewMode} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add block button */}
              {!previewMode && (
                <div className="mt-4 print:hidden">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-400 hover:text-indigo-600 rounded-lg py-3 text-sm font-medium transition"
                  >
                    + Ajouter un bloc
                  </button>

                  {showAddMenu && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {BLOCK_MENU.map(item => (
                          <button
                            key={item.type}
                            onClick={() => addBlock(item.type)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 text-left transition group"
                          >
                            <span className="w-8 h-8 bg-gray-100 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center text-sm font-mono font-bold text-gray-600 group-hover:text-indigo-700 flex-shrink-0">
                              {item.icon}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-800">{item.label}</div>
                              <div className="text-xs text-gray-400 leading-tight">{item.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — block editor */}
        {!previewMode && selected && (
          <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 print:hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {BLOCK_MENU.find(m => m.type === selected.type)?.label || 'Bloc'}
                </h3>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
              <BlockEditor
                block={selected}
                onChange={block => updateBlock(selected.id, block)}
              />
              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => duplicateBlock(selected.id)}
                  className="flex-1 text-xs py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                >
                  ⧉ Dupliquer
                </button>
                <button
                  onClick={() => deleteBlock(selected.id)}
                  className="flex-1 text-xs py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200"
                >
                  ✕ Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
