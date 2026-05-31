import type { WorksheetMeta } from '../types/worksheet'

interface Props {
  meta: WorksheetMeta
  editMode?: boolean
  onChange?: (meta: WorksheetMeta) => void
}

export default function WorksheetHeader({ meta, editMode = false, onChange }: Props) {
  const update = (patch: Partial<WorksheetMeta>) => onChange?.({ ...meta, ...patch })

  if (!editMode) {
    return (
      <div className="worksheet-header mb-6">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{meta.title}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
              {meta.subject && <span>{meta.subject}</span>}
              {meta.level && <span>• {meta.level}</span>}
              {meta.duration && <span>• {meta.duration}</span>}
            </div>
          </div>
          {meta.showScore && (
            <div className="border-2 border-gray-800 px-4 py-2 text-sm font-medium text-center min-w-[80px]">
              Note :<br />
              <span className="text-lg">__ / 20</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          {meta.showName && (
            <div className="flex gap-2 items-center">
              <span className="font-medium">Nom :</span>
              <span className="border-b border-gray-400 min-w-[160px] inline-block">&nbsp;</span>
            </div>
          )}
          {meta.showDate && (
            <div className="flex gap-2 items-center">
              <span className="font-medium">Date :</span>
              <span className="text-gray-600">{meta.date}</span>
            </div>
          )}
          {meta.className && (
            <div className="flex gap-2 items-center">
              <span className="font-medium">Classe :</span>
              <span className="text-gray-600">{meta.className}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const inputCls = 'border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300'

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
      <h3 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">En-tête de la fiche</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Titre</span>
          <input className={inputCls} value={meta.title} onChange={e => update({ title: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Matière</span>
          <input className={inputCls} value={meta.subject} onChange={e => update({ subject: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Niveau</span>
          <input className={inputCls} value={meta.level} onChange={e => update({ level: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Durée</span>
          <input className={inputCls} value={meta.duration || ''} onChange={e => update({ duration: e.target.value })} placeholder="1h, 45min…" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Classe</span>
          <input className={inputCls} value={meta.className || ''} onChange={e => update({ className: e.target.value })} placeholder="3ème B…" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Date</span>
          <input className={inputCls} value={meta.date} onChange={e => update({ date: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={meta.showName} onChange={e => update({ showName: e.target.checked })} />
          Champ Nom
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={meta.showDate} onChange={e => update({ showDate: e.target.checked })} />
          Afficher la date
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={meta.showScore} onChange={e => update({ showScore: e.target.checked })} />
          Zone de note
        </label>
      </div>
    </div>
  )
}
