import type { Block, BaseBlock } from '../types/worksheet'
import MathRenderer from './MathRenderer'
import ShapeRenderer from './ShapeRenderer'

interface Props {
  block: Block
  editMode?: boolean
}

function blockContainerStyle(block: BaseBlock): React.CSSProperties {
  const style: React.CSSProperties = {}
  if (block.bg) style.backgroundColor = block.bg
  if (block.borderColor) {
    const w = block.borderWidth === 'thick' ? '3px' : block.borderWidth === 'medium' ? '2px' : '1px'
    style.border = `${w} ${block.borderStyle || 'solid'} ${block.borderColor}`
  }
  if (block.fontFamily) style.fontFamily = block.fontFamily
  return style
}

function blockContainerClass(block: BaseBlock): string {
  const pad = block.padding === 'lg' ? 'p-6' : block.padding === 'md' ? 'p-4' : block.padding === 'sm' ? 'p-2' : ''
  const rad = block.rounded === 'lg' ? 'rounded-xl' : block.rounded === 'md' ? 'rounded-lg' : block.rounded === 'sm' ? 'rounded' : ''
  return [pad, rad].filter(Boolean).join(' ')
}

function BlockWrapper({ block, children }: { block: Block; children: React.ReactNode }) {
  const style = blockContainerStyle(block)
  const cls = blockContainerClass(block)
  const hasWrapper = Object.keys(style).length > 0 || cls
  if (!hasWrapper) return <>{children}</>
  return <div style={style} className={cls}>{children}</div>
}

export default function BlockRenderer({ block, editMode = false }: Props) {
  const inner = renderInner(block, editMode)
  return <BlockWrapper block={block}>{inner}</BlockWrapper>
}

function renderInner(block: Block, editMode: boolean) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'
      const sizes = { 1: 'text-2xl font-bold', 2: 'text-xl font-semibold border-b border-gray-300 pb-1', 3: 'text-lg font-semibold' }
      return (
        <Tag
          className={`${sizes[block.level]} my-2 text-gray-900`}
          style={{ textAlign: block.align || 'left', fontFamily: block.fontFamily || undefined }}
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
          style={{ textAlign: block.align || 'left', fontFamily: block.fontFamily || undefined }}
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
          className="my-2 grid gap-4"
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
        <div className="my-2 flex flex-wrap gap-2">
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
      const styles = { solid: 'border-solid', dashed: 'border-dashed', dotted: 'border-dotted', double: 'border-double border-b-4' }
      return <div className={`my-3 border-t border-gray-400 ${styles[block.style || 'solid']}`} />
    }

    case 'exercise-header':
      return (
        <div className="my-3 flex items-start gap-3 bg-indigo-50 border-l-4 border-indigo-500 px-4 py-2 rounded-r">
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
            </div>
            {block.competency && <p className="text-xs text-gray-500 mt-0.5 italic">{block.competency}</p>}
          </div>
        </div>
      )

    case 'blank-lines': {
      const lines = Array.from({ length: block.count }, (_, i) => i)
      return (
        <div className="my-2 space-y-4">
          {lines.map(i => (
            <div key={i} className={`w-full ${block.lined ? 'border-b border-gray-400' : ''}`} style={{ minHeight: '1.8rem' }} />
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

    case 'qcm': {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F']
      return (
        <div className="my-2">
          <p className="font-medium text-gray-900 mb-2">{block.question || (editMode ? <span className="text-gray-300 italic">Question…</span> : '')}</p>
          <div className="space-y-1.5 pl-2">
            {block.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                {block.style === 'letters' ? (
                  <span className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {letters[i]}
                  </span>
                ) : (
                  <span className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0" />
                )}
                <span className="text-gray-800">{opt || <span className="text-gray-300 italic">Option {i + 1}…</span>}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'true-false':
      return (
        <div className="my-2">
          {block.instruction && <p className="text-sm text-gray-600 mb-2 italic">{block.instruction}</p>}
          <div className="space-y-2">
            {block.statements.map((stmt, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="flex-1 text-gray-800">{stmt}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <label className="flex items-center gap-1 text-sm">
                    <span className="w-5 h-5 border-2 border-gray-400 rounded-full inline-block" />
                    <span className="text-green-700 font-medium">Vrai</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <span className="w-5 h-5 border-2 border-gray-400 rounded-full inline-block" />
                    <span className="text-red-600 font-medium">Faux</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'fill-blank': {
      const parts = block.text.split('___')
      return (
        <div className="my-2">
          {block.instruction && <p className="text-sm text-gray-600 mb-2 italic">{block.instruction}</p>}
          <p className="text-gray-800 leading-loose">
            {parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < parts.length - 1 && (
                  <span className="inline-block border-b-2 border-gray-500 min-w-[80px] mx-1">&nbsp;</span>
                )}
              </span>
            ))}
          </p>
          {block.showWordBank && block.wordBank && block.wordBank.length > 0 && (
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
              <span className="text-xs font-semibold text-gray-500 uppercase mr-2">Mots :</span>
              {block.wordBank.map((w, i) => (
                <span key={i} className="inline-block mx-1 px-2 py-0.5 bg-white border border-gray-300 rounded text-sm">{w}</span>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'matching':
      return (
        <div className="my-2">
          {block.instruction && <p className="text-sm text-gray-600 mb-2 italic">{block.instruction}</p>}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="space-y-2">
              {block.leftItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 border-b border-gray-300 pb-0.5 text-gray-800">{item}</span>
                  <span className="text-gray-300">···</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {block.rightItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-300">···</span>
                  <span className="flex-1 border-b border-gray-300 pb-0.5 text-gray-800">{item}</span>
                  <span className="w-5 h-5 bg-gray-100 text-gray-500 rounded text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
