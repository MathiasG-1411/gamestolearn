import type { Block } from '../types/worksheet'
import MathRenderer from './MathRenderer'
import ShapeRenderer from './ShapeRenderer'

interface Props {
  block: Block
  editMode?: boolean
}

export default function BlockRenderer({ block, editMode = false }: Props) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'
      const sizes = { 1: 'text-2xl font-bold', 2: 'text-xl font-semibold border-b border-gray-300 pb-1', 3: 'text-lg font-semibold' }
      return (
        <Tag
          className={`${sizes[block.level]} my-2 text-gray-900`}
          style={{ textAlign: block.align || 'left' }}
        >
          {block.content || <span className="text-gray-300 italic">Titre…</span>}
        </Tag>
      )
    }

    case 'text':
      return (
        <p
          className={`text-gray-800 leading-relaxed ${
            block.fontSize === 'sm' ? 'text-sm' :
            block.fontSize === 'lg' ? 'text-lg' :
            block.fontSize === 'xl' ? 'text-xl' : 'text-base'
          } ${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''}`}
          style={{ textAlign: block.align || 'left' }}
        >
          {block.content || (editMode ? <span className="text-gray-300 italic">Texte…</span> : '')}
        </p>
      )

    case 'math':
      return (
        <div className={`my-2 ${block.display === 'block' ? 'flex items-center gap-4 py-2' : 'inline'}`}>
          {block.label && (
            <span className="font-medium text-gray-700 min-w-[2rem]">{block.label}</span>
          )}
          <MathRenderer
            latex={block.latex || '?'}
            display={block.display === 'block'}
            className={block.display === 'block' ? 'py-1' : ''}
          />
        </div>
      )

    case 'table': {
      const alignClass = (a?: string) =>
        a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left'
      return (
        <div className="my-2 overflow-x-auto">
          <table className="border-collapse w-full text-sm">
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className={ri === 0 && block.hasHeader ? 'bg-indigo-50' : ri % 2 === 0 ? '' : 'bg-gray-50'}>
                  {row.map((cell, ci) => {
                    const Tag = ri === 0 && block.hasHeader ? 'th' : 'td'
                    return (
                      <Tag
                        key={ci}
                        className={`border border-gray-300 px-3 py-2 ${alignClass(cell.align)} ${cell.bold ? 'font-semibold' : ''}`}
                        style={cell.bg ? { backgroundColor: cell.bg } : undefined}
                      >
                        {cell.content}
                      </Tag>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && (
            <p className="text-xs text-gray-500 text-center mt-1 italic">{block.caption}</p>
          )}
        </div>
      )
    }

    case 'columns':
      return (
        <div
          className={`my-2 grid gap-${block.gap === 'sm' ? '2' : block.gap === 'lg' ? '8' : '4'}`}
          style={{ gridTemplateColumns: `repeat(${block.columns}, 1fr)` }}
        >
          {block.content.map((col, i) => (
            <div key={i} className="border-l-2 border-gray-200 pl-3 min-h-[60px]">
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {col || (editMode ? <span className="text-gray-300 italic">Colonne {i + 1}…</span> : '')}
              </p>
            </div>
          ))}
        </div>
      )

    case 'shape': {
      const count = block.count || 1
      const items = Array.from({ length: count }, (_, i) => i)
      return (
        <div className={`my-2 flex flex-wrap gap-2 ${block.arrangement === 'grid' ? 'flex-wrap' : ''}`}>
          {items.map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <ShapeRenderer variant={block.variant} color={block.color} size={block.size} />
              {block.label && count === 1 && (
                <span className="text-xs text-gray-600">{block.label}</span>
              )}
            </div>
          ))}
        </div>
      )
    }

    case 'image':
      return (
        <div className={`my-2 ${block.align === 'center' ? 'flex justify-center' : block.align === 'right' ? 'flex justify-end' : ''}`}>
          <div className={block.width === 'third' ? 'w-1/3' : block.width === 'half' ? 'w-1/2' : 'w-full'}>
            <img src={block.src} alt={block.alt || ''} className="max-w-full rounded border border-gray-200" />
            {block.caption && (
              <p className="text-xs text-gray-500 text-center mt-1 italic">{block.caption}</p>
            )}
          </div>
        </div>
      )

    case 'divider': {
      const styles = {
        solid: 'border-solid',
        dashed: 'border-dashed',
        dotted: 'border-dotted',
        double: 'border-double border-b-4',
      }
      return (
        <div className={`my-3 border-t border-gray-400 ${styles[block.style || 'solid']}`} />
      )
    }

    case 'exercise-header': {
      const attenduBadge: Record<string, { bg: string; text: string; label: string }> = {
        S:  { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Savoir' },
        SF: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Savoir-faire' },
        C:  { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Compétence' },
      }
      const badge = block.attenduType ? attenduBadge[block.attenduType] : null
      return (
        <div className="my-3 bg-indigo-50 border-l-4 border-indigo-500 px-4 py-3 rounded-r">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {block.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900">{block.title || 'Exercice'}</span>
                {block.points !== undefined && (
                  <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
                    {block.points} pt{block.points > 1 ? 's' : ''}
                  </span>
                )}
                {block.duration && <span className="text-xs text-gray-500">⏱ {block.duration}</span>}
                {block.difficulty && (
                  <span className="text-xs">{'★'.repeat(block.difficulty)}{'☆'.repeat(3 - block.difficulty)}</span>
                )}
                {badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.bg} ${badge.text}`}>
                    {block.attenduType} — {badge.label}
                  </span>
                )}
              </div>
              {/* Attendu FWB */}
              {block.attendu && (
                <div className="mt-1.5 flex items-start gap-1.5">
                  <span className="text-xs font-semibold text-indigo-500 mt-0.5 flex-shrink-0">Attendu :</span>
                  <p className="text-xs text-indigo-700 italic leading-snug">{block.attendu}</p>
                </div>
              )}
              {block.attenduCode && (
                <p className="text-xs text-gray-400 mt-0.5">{block.attenduCode}</p>
              )}
              {/* Legacy competency */}
              {!block.attendu && block.competency && (
                <p className="text-xs text-gray-500 mt-0.5 italic">{block.competency}</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    case 'blank-lines': {
      const lines = Array.from({ length: block.count }, (_, i) => i)
      return (
        <div className="my-2 space-y-4">
          {lines.map(i => (
            <div
              key={i}
              className={`w-full h-px ${block.lined ? 'border-b border-gray-400' : 'border-b border-transparent'}`}
              style={{ marginBottom: '1.5rem' }}
            />
          ))}
        </div>
      )
    }

    case 'numbered-list':
      return (
        <ol className="my-2 pl-6 list-decimal space-y-1">
          {block.items.map((item, i) => (
            <li key={i} className="text-gray-800 leading-relaxed">{item}</li>
          ))}
        </ol>
      )

    case 'bullet-list':
      return (
        <ul className="my-2 pl-6 list-disc space-y-1">
          {block.items.map((item, i) => (
            <li key={i} className="text-gray-800 leading-relaxed">{item}</li>
          ))}
        </ul>
      )

    default:
      return null
  }
}
