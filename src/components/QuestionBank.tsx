import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Block } from '../types/worksheet'
import { loadBank, removeFromBank } from '../utils/storage'
import BlockRenderer from './BlockRenderer'

interface Props {
  onInsert: (block: Block) => void
  onClose: () => void
}

const BLOCK_LABELS: Record<string, string> = {
  'exercise-item': '❓ Question/Réponse',
  'qcm': '🔘 QCM',
  'true-false': '✓✗ Vrai/Faux',
  'fill-blank': '___ Texte à trous',
  'matching': '↔ Relier',
  'text': '¶ Texte',
  'heading': 'T Titre',
  'math': '∑ Formule',
  'table': '▦ Tableau',
  'rubric': '📋 Grille',
}

export default function QuestionBank({ onInsert, onClose }: Props) {
  const [bank, setBank] = useState<Block[]>([])
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => { setBank(loadBank()) }, [])

  const insert = (block: Block) => {
    onInsert({ ...block, id: uuidv4() })
  }

  const remove = (id: string) => {
    removeFromBank(id)
    setBank(loadBank())
    if (preview === id) setPreview(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end print:hidden" onClick={onClose}>
      <div className="w-80 bg-white shadow-2xl border-l border-gray-200 flex flex-col h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">📚 Banque de questions</h2>
            <p className="text-xs text-gray-400">{bank.length} élément{bank.length !== 1 ? 's' : ''} sauvegardé{bank.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        {bank.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium">Banque vide</p>
            <p className="text-xs mt-1">Sauvegardez des blocs depuis l'éditeur avec le bouton ⭐</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {bank.map(block => (
              <div key={block.id} className="border-b border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 truncate">
                      {block.bankLabel || BLOCK_LABELS[block.type] || block.type}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {getBlockPreview(block)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreview(preview === block.id ? null : block.id)}
                    className="text-xs text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100"
                    title="Aperçu"
                  >👁</button>
                  <button
                    type="button"
                    onClick={() => insert(block)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded font-medium"
                  >Insérer</button>
                  <button
                    type="button"
                    onClick={() => remove(block.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >✕</button>
                </div>
                {preview === block.id && (
                  <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Aperçu :</div>
                    <div className="scale-90 origin-top-left bg-white rounded border border-gray-100 p-2 overflow-hidden max-h-48">
                      <BlockRenderer block={block} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getBlockPreview(block: Block): string {
  switch (block.type) {
    case 'exercise-item': return (block as { questionText?: string }).questionText?.slice(0, 60) || '…'
    case 'qcm': return (block as { question?: string }).question?.slice(0, 60) || '…'
    case 'text': return (block as { content?: string }).content?.slice(0, 60) || '…'
    case 'heading': return (block as { content?: string }).content?.slice(0, 60) || '…'
    case 'true-false': { const b = block as { statements?: string[] }; return b.statements?.[0]?.slice(0, 60) || '…' }
    case 'fill-blank': return (block as { text?: string }).text?.slice(0, 60) || '…'
    default: return block.type
  }
}
