import { useState, useEffect, useCallback } from 'react'
import type { Block, Worksheet } from '../types/worksheet'
import BlockRenderer from './BlockRenderer'

interface Props {
  worksheet: Worksheet
  onClose: () => void
}

const SKIP_TYPES = new Set(['divider'])

export default function PresentationMode({ worksheet, onClose }: Props) {
  const slides = worksheet.blocks.filter(b => !SKIP_TYPES.has(b.type))
  const [idx, setIdx] = useState(0)

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIdx(i => Math.min(slides.length - 1, i + 1)), [slides.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, next, prev])

  const block: Block | undefined = slides[idx]

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="text-gray-300 text-sm font-medium truncate">{worksheet.meta.title}</div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{idx + 1} / {slides.length}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition">
            ✕ Fermer
          </button>
        </div>
      </div>

      {/* Slide */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        {block ? (
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-10 max-h-full overflow-y-auto">
            <BlockRenderer block={block} />
          </div>
        ) : (
          <p className="text-gray-500 text-lg">Aucun bloc à afficher</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 py-4 bg-gray-900 border-t border-gray-800">
        <button
          onClick={prev}
          disabled={idx === 0}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
        >
          ← Précédent
        </button>

        {/* Dots */}
        <div className="flex gap-1.5 overflow-x-auto max-w-xs">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full flex-shrink-0 transition ${i === idx ? 'bg-indigo-400 w-4' : 'bg-gray-600 hover:bg-gray-400'}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={idx === slides.length - 1}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
        >
          Suivant →
        </button>
      </div>

      <p className="text-center text-xs text-gray-600 pb-2">← → flèches · Espace · Échap pour fermer</p>
    </div>
  )
}
