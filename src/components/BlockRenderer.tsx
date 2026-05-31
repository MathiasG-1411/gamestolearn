import type { Block, BaseBlock, RubricBlock } from '../types/worksheet'
import MathRenderer from './MathRenderer'
import ShapeRenderer from './ShapeRenderer'

interface Props {
  block: Block
  editMode?: boolean
  correctionMode?: boolean
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

export default function BlockRenderer({ block, editMode = false, correctionMode = false }: Props) {
  const inner = renderInner(block, editMode)
  return (
    <BlockWrapper block={block}>
      {inner}
      {correctionMode && block.correction && (
        <div className="mt-2 px-3 py-2 bg-green-50 border-l-4 border-green-500 rounded-r print:bg-white print:border-green-600">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">✓ Corrigé : </span>
          <span className="text-sm text-green-800 whitespace-pre-wrap">{block.correction}</span>
        </div>
      )}
    </BlockWrapper>
  )
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
        <div className="my-2 flex flex-wrap gap-3 items-end">
          {items.map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <ShapeRenderer
                variant={block.variant}
                color={block.color}
                size={block.size}
                sizeN={block.sizeN}
                filled={block.filled !== false}
              />
              {block.label && (
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
      const style = block.paperStyle || (block.lined ? 'lines' : 'none')
      const lineH = block.lineHeight ?? 36
      const spacing = block.gridSpacing ?? 20

      if (style === 'grid') {
        const gridH = block.gridHeight ?? 160
        return (
          <div className="my-2 w-full overflow-hidden rounded" style={{ height: gridH }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`grid-${block.id}`} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
                  <path d={`M ${spacing} 0 L 0 0 0 ${spacing}`} fill="none" stroke="#9ca3af" strokeWidth="0.7" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${block.id})`} />
              <rect width="100%" height="100%" fill="none" stroke="#9ca3af" strokeWidth="0.7" />
            </svg>
          </div>
        )
      }

      const lines = Array.from({ length: block.count }, (_, i) => i)
      return (
        <div className="my-2">
          {lines.map(i => (
            <div
              key={i}
              className="w-full"
              style={{
                height: lineH,
                borderBottom: style === 'lines' ? '1px solid #9ca3af'
                  : style === 'dotted' ? '1px dashed #9ca3af'
                  : 'none',
              }}
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

    case 'exercise-item': {
      const b = block

      // Question zone
      const questionZone = (() => {
        const text = b.questionText || (editMode ? '(Question…)' : '')
        const base = 'text-gray-900 text-sm leading-relaxed'
        switch (b.questionStyle) {
          case 'shaded':
            return (
              <div className="px-3 py-2 rounded" style={{ backgroundColor: b.questionBg || '#f1f5f9' }}>
                <p className={base}>{text}</p>
              </div>
            )
          case 'boxed':
            return (
              <div className="px-3 py-2 rounded border-2" style={{ borderColor: b.questionBorderColor || '#4f46e5', backgroundColor: b.questionBg || 'transparent' }}>
                <p className={base}>{text}</p>
              </div>
            )
          default:
            return <p className={base}>{text}</p>
        }
      })()

      // Answer zone
      const answerZone = (() => {
        const boxHeightPx = { sm: 48, md: 80, lg: 120, xl: 180 }[b.boxHeight]
        const letters = ['A', 'B', 'C', 'D', 'E', 'F']

        switch (b.answerStyle) {
          case 'lines':
            return (
              <div className="mt-2 space-y-5">
                {Array.from({ length: b.lineCount }).map((_, i) => (
                  <div key={i} className="border-b border-gray-400 w-full" style={{ minHeight: '1px' }} />
                ))}
              </div>
            )
          case 'dotted-lines':
            return (
              <div className="mt-2 space-y-5">
                {Array.from({ length: b.lineCount }).map((_, i) => (
                  <div key={i} className="border-b border-dashed border-gray-400 w-full" style={{ minHeight: '1px' }} />
                ))}
              </div>
            )
          case 'box':
            return (
              <div className="mt-2 border-2 border-gray-400 rounded w-full" style={{ height: boxHeightPx }} />
            )
          case 'grid':
            return (
              <div
                className="mt-2 border-2 border-gray-400 rounded w-full"
                style={{
                  height: boxHeightPx,
                  backgroundImage:
                    'linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)',
                  backgroundSize: '10mm 10mm',
                }}
              />
            )
          case 'qcm': {
            const opts = b.qcmOptions.filter(o => o.trim())
            return (
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5">
                {opts.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {b.qcmOptionStyle === 'letters' ? (
                      <span className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">{letters[i]}</span>
                    ) : (
                      <span className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-800">{opt}</span>
                  </div>
                ))}
              </div>
            )
          }
          case 'true-false':
            return (
              <div className="mt-2 flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                  <span className="text-sm font-medium text-green-700">Vrai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                  <span className="text-sm font-medium text-red-600">Faux</span>
                </div>
              </div>
            )
          case 'short':
            return (
              <div className="mt-2 border-2 border-gray-400 rounded px-2 py-1 min-h-[2rem] w-full max-w-xs" />
            )
          case 'none':
          default:
            return null
        }
      })()

      if (b.layout === 'side-by-side') {
        return (
          <div className="my-2 flex gap-4 items-start">
            <div className="flex-1">{questionZone}</div>
            <div className="flex-1">{answerZone}</div>
          </div>
        )
      }

      return (
        <div className="my-2">
          {questionZone}
          {answerZone}
        </div>
      )
    }

    case 'rubric': {
      const b = block as RubricBlock
      return (
        <div className="my-2 overflow-x-auto">
          {b.title && <p className="font-semibold text-gray-800 mb-2">{b.title}</p>}
          <table className="border-collapse w-full text-sm">
            <thead>
              <tr>
                <th className="border border-gray-300 px-3 py-2 bg-gray-100 text-left font-semibold text-gray-700 min-w-[120px]">Critère</th>
                {b.levels.map((lvl, li) => (
                  <th key={li} className="border border-gray-300 px-3 py-2 bg-indigo-50 text-center font-semibold text-indigo-800">
                    {lvl}
                    {b.showPoints && b.levelPoints?.[li] !== undefined && (
                      <span className="block text-xs font-normal text-indigo-500">{b.levelPoints[li]} pt{(b.levelPoints[li] ?? 0) > 1 ? 's' : ''}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.criteria.map((crit, ci) => (
                <tr key={ci} className={ci % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-2 font-medium text-gray-800">{crit.name}</td>
                  {b.levels.map((_, li) => (
                    <td key={li} className="border border-gray-300 px-3 py-2 text-gray-600 text-xs">
                      {crit.descriptions[li] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    default:
      return null
  }
}
