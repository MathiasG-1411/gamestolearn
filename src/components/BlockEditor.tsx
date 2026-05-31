import { useState } from 'react'
import type { Block, TextBlock, HeadingBlock, MathBlock, TableBlock, ColumnsBlock, ShapeBlock, ExerciseHeaderBlock, BlankLinesBlock, ListBlock, ShapeVariant } from '../types/worksheet'
import MathRenderer from './MathRenderer'

interface Props {
  block: Block
  onChange: (block: Block) => void
}

const MATH_SNIPPETS = [
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Racine', latex: '\\sqrt{x}' },
  { label: 'Puissance', latex: 'x^{n}' },
  { label: 'Indice', latex: 'x_{n}' },
  { label: 'Somme', latex: '\\sum_{i=0}^{n}' },
  { label: '≤', latex: '\\leq' },
  { label: '≥', latex: '\\geq' },
  { label: '≠', latex: '\\neq' },
  { label: '∞', latex: '\\infty' },
  { label: 'π', latex: '\\pi' },
  { label: '×', latex: '\\times' },
  { label: '÷', latex: '\\div' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: '°', latex: '^{\\circ}' },
]

const SHAPE_VARIANTS: { value: ShapeVariant; label: string }[] = [
  { value: 'rectangle', label: '▭' },
  { value: 'circle', label: '●' },
  { value: 'triangle', label: '▲' },
  { value: 'star', label: '★' },
  { value: 'diamond', label: '◆' },
  { value: 'arrow-right', label: '→' },
  { value: 'arrow-left', label: '←' },
  { value: 'cloud', label: '☁' },
  { value: 'heart', label: '♥' },
  { value: 'speech-bubble', label: '💬' },
]

const COLORS = ['#4f46e5', '#dc2626', '#16a34a', '#d97706', '#db2777', '#0891b2', '#7c3aed', '#000000', '#6b7280']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

const inputCls = 'border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300'
const selectCls = 'border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white'

export default function BlockEditor({ block, onChange }: Props) {
  const update = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block)

  switch (block.type) {
    case 'heading': {
      const b = block as HeadingBlock
      return (
        <div className="space-y-3">
          <Field label="Texte du titre">
            <input className={inputCls} value={b.content} onChange={e => update({ content: e.target.value })} placeholder="Titre…" />
          </Field>
          <div className="flex gap-3">
            <Field label="Niveau">
              <select className={selectCls} value={b.level} onChange={e => update({ level: parseInt(e.target.value) as 1|2|3 })}>
                <option value={1}>H1 — Grand titre</option>
                <option value={2}>H2 — Sous-titre</option>
                <option value={3}>H3 — Petit titre</option>
              </select>
            </Field>
            <Field label="Alignement">
              <select className={selectCls} value={b.align || 'left'} onChange={e => update({ align: e.target.value as 'left'|'center'|'right' })}>
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </Field>
          </div>
        </div>
      )
    }

    case 'text': {
      const b = block as TextBlock
      return (
        <div className="space-y-3">
          <Field label="Contenu">
            <textarea className={inputCls} rows={3} value={b.content} onChange={e => update({ content: e.target.value })} placeholder="Votre texte…" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Field label="Taille">
              <select className={selectCls} value={b.fontSize || 'base'} onChange={e => update({ fontSize: e.target.value as 'sm'|'base'|'lg'|'xl' })}>
                <option value="sm">Petit</option>
                <option value="base">Normal</option>
                <option value="lg">Grand</option>
                <option value="xl">Très grand</option>
              </select>
            </Field>
            <Field label="Alignement">
              <select className={selectCls} value={b.align || 'left'} onChange={e => update({ align: e.target.value as 'left'|'center'|'right' })}>
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={!!b.bold} onChange={e => update({ bold: e.target.checked })} className="rounded" />
              <strong>Gras</strong>
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={!!b.italic} onChange={e => update({ italic: e.target.checked })} />
              <em>Italique</em>
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={!!b.underline} onChange={e => update({ underline: e.target.checked })} />
              <u>Souligné</u>
            </label>
          </div>
        </div>
      )
    }

    case 'math': {
      const b = block as MathBlock
      return (
        <div className="space-y-3">
          <Field label="Label (optionnel)">
            <input className={inputCls} value={b.label || ''} onChange={e => update({ label: e.target.value })} placeholder="a) b) 1. …" />
          </Field>
          <Field label="Formule LaTeX">
            <textarea
              className={`${inputCls} font-mono`}
              rows={3}
              value={b.latex}
              onChange={e => update({ latex: e.target.value })}
              placeholder="\frac{1}{2} + \frac{1}{3}"
            />
          </Field>
          <div className="flex flex-wrap gap-1">
            {MATH_SNIPPETS.map(s => (
              <button
                key={s.latex}
                type="button"
                onClick={() => update({ latex: b.latex + s.latex })}
                className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 font-mono"
                title={s.latex}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Field label="Affichage">
            <select className={selectCls} value={b.display} onChange={e => update({ display: e.target.value as 'inline'|'block' })}>
              <option value="block">Centré sur sa ligne</option>
              <option value="inline">Dans le texte</option>
            </select>
          </Field>
          {b.latex && (
            <div className="border rounded p-3 bg-gray-50">
              <p className="text-xs text-gray-400 mb-1">Aperçu :</p>
              <MathRenderer latex={b.latex} display={b.display === 'block'} />
            </div>
          )}
        </div>
      )
    }

    case 'table': {
      const b = block as TableBlock
      const setCell = (ri: number, ci: number, value: string) => {
        const rows = b.rows.map((row, r) =>
          row.map((cell, c) => r === ri && c === ci ? { ...cell, content: value } : cell)
        )
        update({ rows })
      }
      const addRow = () => {
        const cols = b.rows[0]?.length || 2
        update({ rows: [...b.rows, Array.from({ length: cols }, () => ({ content: '' }))] })
      }
      const addCol = () => {
        update({ rows: b.rows.map(row => [...row, { content: '' }]) })
      }
      const removeRow = (ri: number) => {
        if (b.rows.length <= 1) return
        update({ rows: b.rows.filter((_, i) => i !== ri) })
      }
      const removeCol = (ci: number) => {
        if (b.rows[0]?.length <= 1) return
        update({ rows: b.rows.map(row => row.filter((_, i) => i !== ci)) })
      }
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={b.hasHeader} onChange={e => update({ hasHeader: e.target.checked })} />
            Première ligne = en-tête
          </label>
          <div className="overflow-x-auto">
            <table className="border-collapse text-sm">
              <tbody>
                {b.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-gray-200 p-1">
                        <input
                          className="w-24 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded"
                          value={cell.content}
                          onChange={e => setCell(ri, ci, e.target.value)}
                          placeholder={ri === 0 && b.hasHeader ? `Col ${ci+1}` : '…'}
                        />
                      </td>
                    ))}
                    <td className="pl-1">
                      <button type="button" onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                    </td>
                  </tr>
                ))}
                <tr>
                  {b.rows[0]?.map((_, ci) => (
                    <td key={ci} className="text-center pt-1">
                      <button type="button" onClick={() => removeCol(ci)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addRow} className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Ligne</button>
            <button type="button" onClick={addCol} className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Colonne</button>
          </div>
          <Field label="Légende (optionnel)">
            <input className={inputCls} value={b.caption || ''} onChange={e => update({ caption: e.target.value })} placeholder="Tableau 1 — …" />
          </Field>
        </div>
      )
    }

    case 'columns': {
      const b = block as ColumnsBlock
      const setColContent = (i: number, val: string) => {
        const content = b.content.map((c, idx) => idx === i ? val : c)
        update({ content })
      }
      const setColCount = (n: number) => {
        const content = Array.from({ length: n }, (_, i) => b.content[i] || '')
        update({ columns: n, content })
      }
      return (
        <div className="space-y-3">
          <Field label="Nombre de colonnes">
            <select className={selectCls} value={b.columns} onChange={e => setColCount(parseInt(e.target.value))}>
              <option value={2}>2 colonnes</option>
              <option value={3}>3 colonnes</option>
              <option value={4}>4 colonnes</option>
            </select>
          </Field>
          {b.content.map((col, i) => (
            <Field key={i} label={`Colonne ${i + 1}`}>
              <textarea className={inputCls} rows={3} value={col} onChange={e => setColContent(i, e.target.value)} placeholder={`Contenu de la colonne ${i+1}…`} />
            </Field>
          ))}
        </div>
      )
    }

    case 'shape': {
      const b = block as ShapeBlock
      return (
        <div className="space-y-3">
          <Field label="Forme">
            <div className="flex flex-wrap gap-2">
              {SHAPE_VARIANTS.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => update({ variant: v.value })}
                  className={`w-10 h-10 text-xl border-2 rounded flex items-center justify-center transition ${b.variant === v.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-400'}`}
                  title={v.value}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Couleur">
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition ${b.color === c ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input type="color" value={b.color} onChange={e => update({ color: e.target.value })} className="w-7 h-7 rounded cursor-pointer" title="Couleur personnalisée" />
            </div>
          </Field>
          <div className="flex gap-3">
            <Field label="Taille">
              <select className={selectCls} value={b.size} onChange={e => update({ size: e.target.value as 'sm'|'md'|'lg' })}>
                <option value="sm">Petit</option>
                <option value="md">Moyen</option>
                <option value="lg">Grand</option>
              </select>
            </Field>
            <Field label="Quantité">
              <input type="number" min={1} max={20} className={inputCls} value={b.count || 1} onChange={e => update({ count: parseInt(e.target.value) || 1 })} />
            </Field>
          </div>
          <Field label="Étiquette (optionnel)">
            <input className={inputCls} value={b.label || ''} onChange={e => update({ label: e.target.value })} placeholder="Ex : pommes" />
          </Field>
        </div>
      )
    }

    case 'exercise-header': {
      const b = block as ExerciseHeaderBlock
      return (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Field label="Numéro">
              <input type="number" min={1} className={inputCls} value={b.number} onChange={e => update({ number: parseInt(e.target.value) || 1 })} />
            </Field>
            <Field label="Points">
              <input type="number" min={0} className={inputCls} value={b.points ?? ''} onChange={e => update({ points: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="—" />
            </Field>
          </div>
          <Field label="Titre de l'exercice">
            <input className={inputCls} value={b.title} onChange={e => update({ title: e.target.value })} placeholder="Ex : Calculer les expressions…" />
          </Field>
          <div className="flex gap-3">
            <Field label="Durée">
              <input className={inputCls} value={b.duration || ''} onChange={e => update({ duration: e.target.value })} placeholder="10 min" />
            </Field>
            <Field label="Difficulté">
              <select className={selectCls} value={b.difficulty ?? ''} onChange={e => update({ difficulty: e.target.value ? parseInt(e.target.value) as 1|2|3 : undefined })}>
                <option value="">—</option>
                <option value={1}>★ Facile</option>
                <option value={2}>★★ Moyen</option>
                <option value={3}>★★★ Difficile</option>
              </select>
            </Field>
          </div>

          {/* FWB — Attendu */}
          <div className="border border-indigo-100 rounded-lg p-3 bg-indigo-50 space-y-2">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Attendu FWB (référentiel CPC)</p>
            <Field label="Type d'attendu">
              <div className="flex gap-2">
                {([
                  { v: 'S',  label: 'S — Savoir',         cls: 'bg-blue-100 text-blue-800 border-blue-300' },
                  { v: 'SF', label: 'SF — Savoir-faire',  cls: 'bg-orange-100 text-orange-800 border-orange-300' },
                  { v: 'C',  label: 'C — Compétence',     cls: 'bg-purple-100 text-purple-800 border-purple-300' },
                ] as const).map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => update({ attenduType: b.attenduType === opt.v ? undefined : opt.v })}
                    className={`flex-1 py-1 text-xs font-semibold rounded border transition ${b.attenduType === opt.v ? opt.cls + ' ring-2 ring-offset-1 ring-indigo-400' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}
                  >
                    {opt.v === 'S' ? 'S' : opt.v}
                    <span className="hidden sm:inline"> — {opt.v === 'S' ? 'Savoir' : opt.v === 'SF' ? 'Savoir-faire' : 'Compétence'}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Texte de l'attendu">
              <textarea
                className={`${inputCls} bg-white`}
                rows={3}
                value={b.attendu || ''}
                onChange={e => update({ attendu: e.target.value || undefined })}
                placeholder="Ex : L'élève est capable de résoudre des problèmes faisant appel aux quatre opérations…"
              />
            </Field>
            <Field label="Référence UAA (optionnel)">
              <input
                className={`${inputCls} bg-white`}
                value={b.attenduCode || ''}
                onChange={e => update({ attenduCode: e.target.value || undefined })}
                placeholder="Ex : UAA 3.2 — Mathématiques P4"
              />
            </Field>
          </div>
        </div>
      )
    }

    case 'blank-lines': {
      const b = block as BlankLinesBlock
      return (
        <div className="space-y-3">
          <Field label="Nombre de lignes">
            <input type="number" min={1} max={20} className={inputCls} value={b.count} onChange={e => update({ count: parseInt(e.target.value) || 1 })} />
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={b.lined} onChange={e => update({ lined: e.target.checked })} />
            Afficher les lignes de réponse
          </label>
        </div>
      )
    }

    case 'numbered-list':
    case 'bullet-list': {
      const b = block as ListBlock
      const updateItem = (i: number, val: string) => {
        const items = b.items.map((it, idx) => idx === i ? val : it)
        update({ items })
      }
      const addItem = () => update({ items: [...b.items, ''] })
      const removeItem = (i: number) => {
        if (b.items.length <= 1) return
        update({ items: b.items.filter((_, idx) => idx !== i) })
      }
      return (
        <div className="space-y-2">
          {b.items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm min-w-[1.5rem]">{block.type === 'numbered-list' ? `${i+1}.` : '•'}</span>
              <input className={`${inputCls} flex-1`} value={item} onChange={e => updateItem(i, e.target.value)} placeholder={`Élément ${i+1}…`} />
              <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Élément</button>
        </div>
      )
    }

    case 'divider':
      return (
        <Field label="Style de séparateur">
          <select className={selectCls} value={(block as { style?: string }).style || 'solid'} onChange={e => update({ style: e.target.value as 'solid'|'dashed'|'dotted'|'double' })}>
            <option value="solid">Ligne pleine</option>
            <option value="dashed">Pointillés</option>
            <option value="dotted">Points</option>
            <option value="double">Double</option>
          </select>
        </Field>
      )

    default:
      return <p className="text-sm text-gray-400 italic">Ce bloc n'a pas d'options.</p>
  }
}
