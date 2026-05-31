import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { WorksheetMeta } from '../types/worksheet'
import { loadHeaderPresets, saveHeaderPreset, deleteHeaderPreset } from '../utils/storage'
import type { HeaderPreset } from '../utils/storage'

interface Props {
  meta: WorksheetMeta
  editMode?: boolean
  onChange?: (meta: WorksheetMeta) => void
  onClose?: () => void
}

export default function WorksheetHeader({ meta, editMode = false, onChange, onClose }: Props) {
  const update = (patch: Partial<WorksheetMeta>) => onChange?.({ ...meta, ...patch })

  const [presets, setPresets] = useState<HeaderPreset[]>([])

  useEffect(() => {
    if (editMode) setPresets(loadHeaderPresets())
  }, [editMode])

  const handleSavePreset = () => {
    const name = prompt('Nom du modèle d\'en-tête :')
    if (!name?.trim()) return
    const preset: HeaderPreset = {
      id: uuidv4(),
      name: name.trim(),
      meta: {
        title: meta.title,
        subject: meta.subject,
        level: meta.level,
        date: meta.date,
        duration: meta.duration,
        teacherName: meta.teacherName,
        className: meta.className,
        showScore: meta.showScore,
        showName: meta.showName,
        showDate: meta.showDate,
      },
      createdAt: new Date().toISOString(),
    }
    saveHeaderPreset(preset)
    setPresets(loadHeaderPresets())
  }

  const handleLoadPreset = (preset: HeaderPreset) => {
    onChange?.({ ...meta, ...preset.meta })
  }

  const handleDeletePreset = (id: string) => {
    deleteHeaderPreset(id)
    setPresets(loadHeaderPresets())
  }

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

  const inputCls = 'border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'

  return (
    <div
      className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-4 space-y-3"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 uppercase tracking-wide">En-tête de la fiche</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm px-2 py-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900">✕ Fermer</button>
        )}
      </div>

      {/* Header presets */}
      <div className="border border-indigo-200 dark:border-indigo-700 rounded-lg p-3 bg-white dark:bg-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Modèles d'en-tête</span>
          <button
            type="button"
            onClick={handleSavePreset}
            className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            💾 Sauvegarder
          </button>
        </div>
        {presets.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <div key={p.id} className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900 rounded-full px-2 py-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleLoadPreset(p)}
                  className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 font-medium"
                  title="Charger ce modèle"
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePreset(p.id)}
                  className="text-indigo-300 dark:text-indigo-600 hover:text-red-400 dark:hover:text-red-400 ml-0.5"
                  title="Supprimer ce modèle"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">Aucun modèle. Sauvegardez l'en-tête actuel pour le réutiliser.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Titre</span>
          <input className={inputCls} value={meta.title} onChange={e => update({ title: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Matière</span>
          <input className={inputCls} value={meta.subject} onChange={e => update({ subject: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Niveau</span>
          <input className={inputCls} value={meta.level} onChange={e => update({ level: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Durée</span>
          <input className={inputCls} value={meta.duration || ''} onChange={e => update({ duration: e.target.value })} placeholder="1h, 45min…" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Classe</span>
          <input className={inputCls} value={meta.className || ''} onChange={e => update({ className: e.target.value })} placeholder="3ème B…" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Date</span>
          <input className={inputCls} value={meta.date} onChange={e => update({ date: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={meta.showName} onChange={e => update({ showName: e.target.checked })} />
          Champ Nom
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={meta.showDate} onChange={e => update({ showDate: e.target.checked })} />
          Afficher la date
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={meta.showScore} onChange={e => update({ showScore: e.target.checked })} />
          Zone de note
        </label>
      </div>
    </div>
  )
}
