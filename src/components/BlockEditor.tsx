import { useState } from 'react'
import type { Block, TextBlock, HeadingBlock, MathBlock, TableBlock, ColumnsBlock, ShapeBlock, ExerciseHeaderBlock, BlankLinesBlock, ListBlock, ShapeVariant, QCMBlock, TrueFalseBlock, FillBlankBlock, MatchingBlock, ExerciseItemBlock, AnswerStyle, QuestionStyle, RubricBlock } from '../types/worksheet'
import { FONT_OPTIONS } from '../types/worksheet'
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
const BG_PRESETS = ['#fef9c3', '#dbeafe', '#dcfce7', '#fce7f3', '#f3f4f6', '#fff7ed', '#f0fdf4', '#ede9fe']

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

// Shared style section for all block types
function BlockStyleSection({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  const [open, setOpen] = useState(false)
  const update = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block)

  return (
    <div className="mt-4 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-full"
      >
        <span>🎨 Style du bloc</span>
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <Field label="Police">
            <select className={selectCls} value={block.fontFamily || ''} onChange={e => update({ fontFamily: e.target.value || undefined })}>
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Fond du cadre">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <button type="button" onClick={() => update({ bg: undefined })} className="w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center text-gray-400 text-xs hover:border-gray-500" title="Aucun fond">✕</button>
              {BG_PRESETS.map(c => (
                <button key={c} type="button" onClick={() => update({ bg: c })} className={`w-6 h-6 rounded border-2 transition ${block.bg === c ? 'border-indigo-500 scale-110' : 'border-gray-200'}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={block.bg || '#ffffff'} onChange={e => update({ bg: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-gray-200" title="Couleur personnalisée" />
            </div>
          </Field>
          <Field label="Bordure">
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => update({ borderColor: undefined, borderWidth: undefined, borderStyle: undefined })} className="w-6 h-6 border border-gray-200 rounded text-xs text-gray-400 hover:border-gray-400" title="Aucune bordure">✕</button>
                {COLORS.slice(0, 6).map(c => (
                  <button key={c} type="button" onClick={() => update({ borderColor: c, borderWidth: block.borderWidth || 'medium', borderStyle: block.borderStyle || 'solid' })} className={`w-5 h-5 rounded-full border-2 transition ${block.borderColor === c ? 'border-indigo-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={block.borderColor || '#000000'} onChange={e => update({ borderColor: e.target.value, borderWidth: block.borderWidth || 'medium', borderStyle: block.borderStyle || 'solid' })} className="w-5 h-5 rounded cursor-pointer" />
              </div>
            </div>
            {block.borderColor && (
              <div className="flex gap-2 mt-1">
                <select className={`${selectCls} flex-1`} value={block.borderWidth || 'medium'} onChange={e => update({ borderWidth: e.target.value as 'thin'|'medium'|'thick' })}>
                  <option value="thin">Fine</option>
                  <option value="medium">Moyenne</option>
                  <option value="thick">Épaisse</option>
                </select>
                <select className={`${selectCls} flex-1`} value={block.borderStyle || 'solid'} onChange={e => update({ borderStyle: e.target.value as 'solid'|'dashed'|'dotted' })}>
                  <option value="solid">Pleine</option>
                  <option value="dashed">Tirets</option>
                  <option value="dotted">Points</option>
                </select>
              </div>
            )}
          </Field>
          <div className="flex gap-2">
            <Field label="Espacement intérieur">
              <select className={selectCls} value={block.padding || 'none'} onChange={e => update({ padding: e.target.value as 'none'|'sm'|'md'|'lg' })}>
                <option value="none">Aucun</option>
                <option value="sm">Petit</option>
                <option value="md">Moyen</option>
                <option value="lg">Grand</option>
              </select>
            </Field>
            <Field label="Coins arrondis">
              <select className={selectCls} value={block.rounded || 'none'} onChange={e => update({ rounded: e.target.value as 'none'|'sm'|'md'|'lg' })}>
                <option value="none">Droits</option>
                <option value="sm">Léger</option>
                <option value="md">Moyen</option>
                <option value="lg">Très arrondi</option>
              </select>
            </Field>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BlockEditor({ block, onChange }: Props) {
  const update = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block)

  return (
    <div>
      {renderBlockSpecificEditor(block, update)}
      <BlockStyleSection block={block} onChange={onChange} />
      {/* Corrigé field — shared for all block types */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">✓ Réponse / Corrigé</span>
          <textarea
            className={`border border-green-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-300 bg-green-50`}
            rows={2}
            value={block.correction || ''}
            onChange={e => update({ correction: e.target.value || undefined })}
            placeholder="Réponse attendue (visible en mode corrigé)…"
          />
        </label>
      </div>
    </div>
  )
}

function renderBlockSpecificEditor(block: Block, update: (patch: Partial<Block>) => void) {
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
          <div className="flex gap-2">
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
            <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={!!b.bold} onChange={e => update({ bold: e.target.checked })} /><strong>Gras</strong></label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={!!b.italic} onChange={e => update({ italic: e.target.checked })} /><em>Italique</em></label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={!!b.underline} onChange={e => update({ underline: e.target.checked })} /><u>Souligné</u></label>
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
            <textarea className={`${inputCls} font-mono`} rows={3} value={b.latex} onChange={e => update({ latex: e.target.value })} placeholder="\frac{1}{2} + \frac{1}{3}" />
          </Field>
          <div className="flex flex-wrap gap-1">
            {MATH_SNIPPETS.map(s => (
              <button key={s.latex} type="button" onClick={() => update({ latex: b.latex + s.latex })} className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 font-mono" title={s.latex}>{s.label}</button>
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
        const rows = b.rows.map((row, r) => row.map((cell, c) => r === ri && c === ci ? { ...cell, content: value } : cell))
        update({ rows })
      }
      const addRow = () => update({ rows: [...b.rows, Array.from({ length: b.rows[0]?.length || 2 }, () => ({ content: '' }))] })
      const addCol = () => update({ rows: b.rows.map(row => [...row, { content: '' }]) })
      const removeRow = (ri: number) => { if (b.rows.length > 1) update({ rows: b.rows.filter((_, i) => i !== ri) }) }
      const removeCol = (ci: number) => { if (b.rows[0]?.length > 1) update({ rows: b.rows.map(row => row.filter((_, i) => i !== ci)) }) }
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
                        <input className="w-24 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded" value={cell.content} onChange={e => setCell(ri, ci, e.target.value)} placeholder={ri === 0 && b.hasHeader ? `Col ${ci+1}` : '…'} />
                      </td>
                    ))}
                    <td className="pl-1"><button type="button" onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button></td>
                  </tr>
                ))}
                <tr>{b.rows[0]?.map((_, ci) => (<td key={ci} className="text-center pt-1"><button type="button" onClick={() => removeCol(ci)} className="text-red-400 hover:text-red-600 text-xs">✕</button></td>))}</tr>
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
      const setColContent = (i: number, val: string) => update({ content: b.content.map((c, idx) => idx === i ? val : c) })
      const setColCount = (n: number) => update({ columns: n, content: Array.from({ length: n }, (_, i) => b.content[i] || '') })
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
                <button key={v.value} type="button" onClick={() => update({ variant: v.value })} className={`w-10 h-10 text-xl border-2 rounded flex items-center justify-center transition ${b.variant === v.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-400'}`} title={v.value}>{v.label}</button>
              ))}
            </div>
          </Field>
          <Field label="Couleur">
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => update({ color: c })} className={`w-7 h-7 rounded-full border-2 transition ${b.color === c ? 'border-indigo-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={b.color} onChange={e => update({ color: e.target.value })} className="w-7 h-7 rounded cursor-pointer" />
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
            <Field label="Durée (optionnel)">
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
          <Field label="Compétence visée (optionnel)">
            <input className={inputCls} value={b.competency || ''} onChange={e => update({ competency: e.target.value })} placeholder="Ex : Calculer avec des fractions" />
          </Field>
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
      const updateItem = (i: number, val: string) => update({ items: b.items.map((it, idx) => idx === i ? val : it) })
      const addItem = () => update({ items: [...b.items, ''] })
      const removeItem = (i: number) => { if (b.items.length > 1) update({ items: b.items.filter((_, idx) => idx !== i) }) }
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

    case 'qcm': {
      const b = block as QCMBlock
      const updateOption = (i: number, val: string) => update({ options: b.options.map((o, idx) => idx === i ? val : o) })
      const addOption = () => update({ options: [...b.options, ''] })
      const removeOption = (i: number) => { if (b.options.length > 2) update({ options: b.options.filter((_, idx) => idx !== i) }) }
      const letters = ['A', 'B', 'C', 'D', 'E', 'F']
      return (
        <div className="space-y-3">
          <Field label="Question">
            <textarea className={inputCls} rows={2} value={b.question} onChange={e => update({ question: e.target.value })} placeholder="Quelle est la réponse ?" />
          </Field>
          <Field label="Style des options">
            <select className={selectCls} value={b.style} onChange={e => update({ style: e.target.value as 'letters'|'circles' })}>
              <option value="letters">Lettres (A, B, C, D)</option>
              <option value="circles">Cercles simples</option>
            </select>
          </Field>
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Options</span>
            {b.options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-gray-500 text-xs font-bold min-w-[1.2rem]">{letters[i]}</span>
                <input className={`${inputCls} flex-1`} value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${letters[i]}…`} />
                <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ))}
            {b.options.length < 6 && (
              <button type="button" onClick={addOption} className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Option</button>
            )}
          </div>
        </div>
      )
    }

    case 'true-false': {
      const b = block as TrueFalseBlock
      const updateStmt = (i: number, val: string) => update({ statements: b.statements.map((s, idx) => idx === i ? val : s) })
      const addStmt = () => update({ statements: [...b.statements, ''] })
      const removeStmt = (i: number) => { if (b.statements.length > 1) update({ statements: b.statements.filter((_, idx) => idx !== i) }) }
      return (
        <div className="space-y-3">
          <Field label="Consigne (optionnel)">
            <input className={inputCls} value={b.instruction || ''} onChange={e => update({ instruction: e.target.value })} placeholder="Coche Vrai ou Faux…" />
          </Field>
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Affirmations</span>
            {b.statements.map((stmt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={`${inputCls} flex-1`} value={stmt} onChange={e => updateStmt(i, e.target.value)} placeholder={`Affirmation ${i+1}…`} />
                <button type="button" onClick={() => removeStmt(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ))}
            <button type="button" onClick={addStmt} className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Affirmation</button>
          </div>
        </div>
      )
    }

    case 'fill-blank': {
      const b = block as FillBlankBlock
      return (
        <div className="space-y-3">
          <Field label="Consigne (optionnel)">
            <input className={inputCls} value={b.instruction || ''} onChange={e => update({ instruction: e.target.value })} placeholder="Complète les phrases…" />
          </Field>
          <Field label="Texte (utilise ___ pour les trous)">
            <textarea className={`${inputCls} font-mono`} rows={4} value={b.text} onChange={e => update({ text: e.target.value })} placeholder="Le soleil ___ au lever du ___." />
          </Field>
          <p className="text-xs text-gray-400">Tape <code className="bg-gray-100 px-1 rounded">___</code> (3 tirets bas) pour créer un trou.</p>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={b.showWordBank} onChange={e => update({ showWordBank: e.target.checked })} />
            Afficher une banque de mots
          </label>
          {b.showWordBank && (
            <Field label="Mots à proposer (séparés par des virgules)">
              <input className={inputCls} value={(b.wordBank || []).join(', ')} onChange={e => update({ wordBank: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="soleil, lune, étoile…" />
            </Field>
          )}
        </div>
      )
    }

    case 'matching': {
      const b = block as MatchingBlock
      const updateLeft = (i: number, val: string) => update({ leftItems: b.leftItems.map((s, idx) => idx === i ? val : s) })
      const updateRight = (i: number, val: string) => update({ rightItems: b.rightItems.map((s, idx) => idx === i ? val : s) })
      const addPair = () => update({ leftItems: [...b.leftItems, ''], rightItems: [...b.rightItems, ''] })
      const removePair = (i: number) => {
        if (b.leftItems.length > 2) {
          update({ leftItems: b.leftItems.filter((_, idx) => idx !== i), rightItems: b.rightItems.filter((_, idx) => idx !== i) })
        }
      }
      return (
        <div className="space-y-3">
          <Field label="Consigne (optionnel)">
            <input className={inputCls} value={b.instruction || ''} onChange={e => update({ instruction: e.target.value })} placeholder="Relie chaque élément…" />
          </Field>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Colonne gauche</span>
              <span>Colonne droite</span>
            </div>
            {b.leftItems.map((_, i) => (
              <div key={i} className="flex gap-1 items-center">
                <input className={`${inputCls} flex-1 text-xs`} value={b.leftItems[i]} onChange={e => updateLeft(i, e.target.value)} placeholder={`Gauche ${i+1}…`} />
                <span className="text-gray-300 text-xs">↔</span>
                <input className={`${inputCls} flex-1 text-xs`} value={b.rightItems[i]} onChange={e => updateRight(i, e.target.value)} placeholder={`Droite ${i+1}…`} />
                <button type="button" onClick={() => removePair(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            ))}
            <button type="button" onClick={addPair} className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Paire</button>
          </div>
          <p className="text-xs text-gray-400 italic">💡 La colonne droite sera mélangée automatiquement à l'impression.</p>
        </div>
      )
    }

    case 'exercise-item': {
      const b = block as ExerciseItemBlock
      const ANSWER_STYLES: { value: AnswerStyle; label: string; icon: string }[] = [
        { value: 'lines',        label: 'Lignes',           icon: '≡' },
        { value: 'dotted-lines', label: 'Pointillés',       icon: '⋯' },
        { value: 'box',          label: 'Cadre vide',       icon: '□' },
        { value: 'grid',         label: 'Quadrillé',        icon: '⊞' },
        { value: 'qcm',          label: 'QCM',              icon: '🔘' },
        { value: 'true-false',   label: 'Vrai / Faux',      icon: '✓✗' },
        { value: 'short',        label: 'Case courte',      icon: '▭' },
        { value: 'none',         label: 'Aucune',           icon: '—' },
      ]
      const Q_STYLES: { value: QuestionStyle; label: string }[] = [
        { value: 'plain',  label: 'Texte simple' },
        { value: 'shaded', label: 'Fond coloré' },
        { value: 'boxed',  label: 'Encadré' },
      ]
      const updateOpt = (i: number, val: string) => update({ qcmOptions: b.qcmOptions.map((o, idx) => idx === i ? val : o) })
      const addOpt = () => update({ qcmOptions: [...b.qcmOptions, ''] })
      const removeOpt = (i: number) => { if (b.qcmOptions.length > 2) update({ qcmOptions: b.qcmOptions.filter((_, idx) => idx !== i) }) }
      const letters = ['A', 'B', 'C', 'D', 'E', 'F']

      return (
        <div className="space-y-4">
          {/* Question zone */}
          <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zone question</p>
            <Field label="Texte de la question">
              <textarea className={inputCls} rows={3} value={b.questionText} onChange={e => update({ questionText: e.target.value })} placeholder="Quelle est la capitale de la France ?" />
            </Field>
            <Field label="Style d'affichage">
              <div className="flex gap-2">
                {Q_STYLES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => update({ questionStyle: s.value })}
                    className={`flex-1 py-1.5 text-xs rounded border transition ${b.questionStyle === s.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
            {(b.questionStyle === 'shaded' || b.questionStyle === 'boxed') && (
              <Field label={b.questionStyle === 'shaded' ? 'Couleur de fond' : 'Couleur du cadre'}>
                <div className="flex flex-wrap gap-1.5">
                  {['#fef9c3', '#dbeafe', '#dcfce7', '#fce7f3', '#f3f4f6', '#fff7ed', '#ede9fe'].map(c => (
                    <button key={c} type="button"
                      onClick={() => b.questionStyle === 'shaded' ? update({ questionBg: c }) : update({ questionBorderColor: c })}
                      className={`w-6 h-6 rounded border-2 transition ${(b.questionStyle === 'shaded' ? b.questionBg : b.questionBorderColor) === c ? 'border-indigo-500 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color"
                    value={(b.questionStyle === 'shaded' ? b.questionBg : b.questionBorderColor) || '#ffffff'}
                    onChange={e => b.questionStyle === 'shaded' ? update({ questionBg: e.target.value }) : update({ questionBorderColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  />
                </div>
              </Field>
            )}
          </div>

          {/* Answer zone */}
          <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zone réponse</p>
            <Field label="Type de zone réponse">
              <div className="grid grid-cols-4 gap-1">
                {ANSWER_STYLES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => update({ answerStyle: s.value })}
                    className={`flex flex-col items-center gap-0.5 py-1.5 px-1 text-xs rounded border transition ${b.answerStyle === s.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                  >
                    <span className="text-base leading-none">{s.icon}</span>
                    <span className="leading-tight text-center" style={{ fontSize: '10px' }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            {(b.answerStyle === 'lines' || b.answerStyle === 'dotted-lines') && (
              <Field label="Nombre de lignes">
                <input type="number" min={1} max={15} className={inputCls} value={b.lineCount} onChange={e => update({ lineCount: parseInt(e.target.value) || 1 })} />
              </Field>
            )}

            {(b.answerStyle === 'box' || b.answerStyle === 'grid') && (
              <Field label="Hauteur du cadre">
                <select className={selectCls} value={b.boxHeight} onChange={e => update({ boxHeight: e.target.value as 'sm'|'md'|'lg'|'xl' })}>
                  <option value="sm">Petite (48px)</option>
                  <option value="md">Moyenne (80px)</option>
                  <option value="lg">Grande (120px)</option>
                  <option value="xl">Très grande (180px)</option>
                </select>
              </Field>
            )}

            {b.answerStyle === 'qcm' && (
              <div className="space-y-2">
                <Field label="Style des options">
                  <select className={selectCls} value={b.qcmOptionStyle} onChange={e => update({ qcmOptionStyle: e.target.value as 'letters'|'circles' })}>
                    <option value="letters">Lettres (A, B, C…)</option>
                    <option value="circles">Cercles simples</option>
                  </select>
                </Field>
                <div className="space-y-1.5">
                  {b.qcmOptions.map((opt, i) => (
                    <div key={i} className="flex gap-1.5 items-center">
                      <span className="text-xs font-bold text-gray-400 min-w-[1rem]">{letters[i]}</span>
                      <input className={`${inputCls} flex-1 text-xs`} value={opt} onChange={e => updateOpt(i, e.target.value)} placeholder={`Option ${letters[i]}…`} />
                      <button type="button" onClick={() => removeOpt(i)} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                  {b.qcmOptions.length < 6 && (
                    <button type="button" onClick={addOpt} className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Option</button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Layout */}
          <Field label="Disposition">
            <div className="flex gap-2">
              <button type="button" onClick={() => update({ layout: 'stacked' })}
                className={`flex-1 py-1.5 text-xs rounded border transition ${b.layout !== 'side-by-side' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                ↕ Empilé
              </button>
              <button type="button" onClick={() => update({ layout: 'side-by-side' })}
                className={`flex-1 py-1.5 text-xs rounded border transition ${b.layout === 'side-by-side' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                ↔ Côte à côte
              </button>
            </div>
          </Field>
        </div>
      )
    }

    case 'rubric': {
      const b = block as RubricBlock
      const updateCritName = (ci: number, val: string) => update({ criteria: b.criteria.map((c, i) => i === ci ? { ...c, name: val } : c) })
      const updateCritDesc = (ci: number, li: number, val: string) => update({
        criteria: b.criteria.map((c, i) => i === ci ? { ...c, descriptions: c.descriptions.map((d, j) => j === li ? val : d) } : c)
      })
      const addCrit = () => update({ criteria: [...b.criteria, { name: '', descriptions: b.levels.map(() => '') }] })
      const removeCrit = (ci: number) => { if (b.criteria.length > 1) update({ criteria: b.criteria.filter((_, i) => i !== ci) }) }
      const updateLevel = (li: number, val: string) => update({ levels: b.levels.map((l, i) => i === li ? val : l) })
      const updatePoints = (li: number, val: string) => update({ levelPoints: (b.levelPoints || b.levels.map(() => 0)).map((p, i) => i === li ? (parseInt(val) || 0) : p) })
      return (
        <div className="space-y-3">
          <Field label="Titre (optionnel)">
            <input className={inputCls} value={b.title || ''} onChange={e => update({ title: e.target.value })} placeholder="Grille d'évaluation…" />
          </Field>
          <Field label="Niveaux (colonnes)">
            {b.levels.map((lvl, li) => (
              <div key={li} className="flex gap-1 items-center mb-1">
                <input className={`${inputCls} flex-1 text-xs`} value={lvl} onChange={e => updateLevel(li, e.target.value)} placeholder={`Niveau ${li+1}…`} />
                {b.showPoints && (
                  <input type="number" min={0} className={`${inputCls} w-14 text-xs`} value={b.levelPoints?.[li] ?? 0} onChange={e => updatePoints(li, e.target.value)} placeholder="pts" />
                )}
              </div>
            ))}
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={b.showPoints} onChange={e => update({ showPoints: e.target.checked, levelPoints: e.target.checked ? b.levels.map((_, i) => i) : undefined })} />
            Afficher les points par niveau
          </label>
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Critères (lignes)</span>
            {b.criteria.map((crit, ci) => (
              <div key={ci} className="border border-gray-200 rounded p-2 space-y-1.5 bg-gray-50">
                <div className="flex gap-1 items-center">
                  <input className={`${inputCls} flex-1 text-xs font-medium`} value={crit.name} onChange={e => updateCritName(ci, e.target.value)} placeholder={`Critère ${ci+1}…`} />
                  <button type="button" onClick={() => removeCrit(ci)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
                {b.levels.map((lvl, li) => (
                  <input key={li} className={`${inputCls} text-xs`} value={crit.descriptions[li] || ''} onChange={e => updateCritDesc(ci, li, e.target.value)} placeholder={`${lvl} : description…`} />
                ))}
              </div>
            ))}
            <button type="button" onClick={addCrit} className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200">+ Critère</button>
          </div>
        </div>
      )
    }

    default:
      return <p className="text-sm text-gray-400 italic">Ce bloc n'a pas d'options.</p>
  }
}
