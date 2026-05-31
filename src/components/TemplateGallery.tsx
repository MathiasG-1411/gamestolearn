import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Worksheet } from '../types/worksheet'
import { TEMPLATES } from '../data/templates'

interface Props {
  worksheets: Worksheet[]
  onSelect: (ws: Worksheet) => void
  onDelete: (id: string) => void
}

const SUBJECT_COLORS: Record<string, string> = {
  'Mathématiques': 'bg-blue-100 text-blue-800',
  'Français': 'bg-pink-100 text-pink-800',
  'Histoire-Géographie': 'bg-amber-100 text-amber-800',
  'Sciences': 'bg-green-100 text-green-800',
  'Anglais': 'bg-purple-100 text-purple-800',
  'Physique-Chimie': 'bg-cyan-100 text-cyan-800',
  'SVT': 'bg-emerald-100 text-emerald-800',
}

function subjectColor(s: string) {
  return SUBJECT_COLORS[s] || 'bg-gray-100 text-gray-700'
}

export default function TemplateGallery({ worksheets, onSelect, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirmId === id) {
      onDelete(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
      // Auto-cancel after 3s if user does nothing
      setTimeout(() => setConfirmId(prev => prev === id ? null : prev), 3000)
    }
  }

  const createFromTemplate = (tpl: typeof TEMPLATES[number]) => {
    const ws: Worksheet = {
      ...tpl,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSelect(ws)
  }

  const createBlank = () => {
    const ws: Worksheet = {
      id: uuidv4(),
      meta: {
        title: 'Nouvelle fiche',
        subject: '',
        level: '',
        date: new Date().toLocaleDateString('fr-FR'),
        showScore: false,
        showName: true,
        showDate: true,
      },
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSelect(ws)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">F</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">FichesPro</h1>
            <p className="text-xs text-gray-500">Créateur de fiches enseignant</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={createBlank}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
            >
              + Nouvelle fiche
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 space-y-8">
        {/* Saved worksheets */}
        {worksheets.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Mes fiches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {worksheets.map(ws => (
                <div
                  key={ws.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
                  onClick={() => onSelect(ws)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">{ws.meta.title}</h3>
                      {confirmId === ws.id ? (
                        <button
                          type="button"
                          onClick={e => handleDeleteClick(e, ws.id)}
                          className="text-xs px-2 py-0.5 rounded-lg bg-red-500 text-white font-semibold flex-shrink-0 animate-pulse"
                        >Supprimer ?</button>
                      ) : (
                        <button
                          type="button"
                          onClick={e => handleDeleteClick(e, ws.id)}
                          className="text-gray-300 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition text-sm p-1 flex-shrink-0"
                          title="Supprimer"
                        >🗑</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ws.meta.subject && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subjectColor(ws.meta.subject)}`}>
                          {ws.meta.subject}
                        </span>
                      )}
                      {ws.meta.level && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{ws.meta.level}</span>
                      )}
                      {ws.version && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">Version {ws.version}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {ws.blocks.length} bloc{ws.blocks.length !== 1 ? 's' : ''} · modifié {new Date(ws.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Templates */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Modèles prêts à l'emploi</h2>
          <p className="text-sm text-gray-500 mb-3">Démarrez depuis un modèle et personnalisez-le.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => createFromTemplate(tpl)}
                className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition text-left p-4 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0 transition">
                    {tpl.meta.subject === 'Mathématiques' ? '∑' :
                     tpl.meta.subject === 'Français' ? '✍' :
                     tpl.meta.subject === 'Histoire-Géographie' ? '🗺' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{tpl.meta.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subjectColor(tpl.meta.subject)}`}>
                        {tpl.meta.subject}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tpl.meta.level}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{tpl.blocks.length} blocs prêts</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
          <h3 className="font-semibold text-indigo-900 mb-3 text-sm">💡 Ce que vous pouvez créer</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-indigo-800">
            {[
              '∑ Formules mathématiques',
              '½ Fractions complexes',
              '▦ Tableaux à remplir',
              '⊞ Texte en colonnes',
              '◆ Formes géométriques',
              '📝 Exercices numérotés',
              '___ Lignes de réponse',
              '• Listes structurées',
              '🖨 Export PDF / impression',
            ].map(tip => (
              <div key={tip} className="flex items-center gap-1.5">
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Install PWA hint */}
        <div className="text-center pb-6">
          <p className="text-xs text-gray-400">
            📱 Sur iPhone : Safari → Partager → «Sur l'écran d'accueil» pour installer l'application
          </p>
        </div>
      </div>
    </div>
  )
}
