import { useState, useEffect } from 'react'
import type { Block } from '../types/worksheet'
import { SUBJECTS, LEVELS } from '../types/worksheet'
import { loadAIConfig, saveAIConfig, generateExercises } from '../utils/ai'
import type { AIConfig, AIProvider } from '../utils/ai'
import { loadAITemplates, deleteAITemplate } from '../utils/storage'
import type { AITemplate } from '../utils/storage'
import BlockRenderer from './BlockRenderer'

interface Props {
  defaultSubject: string
  defaultLevel: string
  onInsert: (blocks: Block[]) => void
  onClose: () => void
}

const EXERCISE_TYPES = [
  { id: 'open',        label: 'Question ouverte',    icon: '📝' },
  { id: 'qcm',         label: 'QCM',                 icon: '🔘' },
  { id: 'true-false',  label: 'Vrai / Faux',         icon: '✓✗' },
  { id: 'fill-blank',  label: 'Texte à trous',       icon: '___' },
  { id: 'matching',    label: 'Relier',              icon: '↔' },
  { id: 'computation', label: 'Calcul / Problème',   icon: '🔢' },
]

export default function AIGenerator({ defaultSubject, defaultLevel, onInsert, onClose }: Props) {
  const [cfg, setCfg] = useState<AIConfig>({ provider: 'gemini', apiKey: '' })
  const [showKeySetup, setShowKeySetup] = useState(false)
  const [subject, setSubject] = useState(defaultSubject || 'Mathématiques')
  const [level, setLevel] = useState(defaultLevel || 'P4')
  const [topic, setTopic] = useState('')
  const [types, setTypes] = useState<string[]>(['open', 'qcm'])
  const [difficulty, setDifficulty] = useState<1|2|3>(2)
  const [count, setCount] = useState(3)
  const [extra, setExtra] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'preview' | 'error'>('idle')
  const [generated, setGenerated] = useState<Block[]>([])
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState<AITemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  useEffect(() => {
    const saved = loadAIConfig()
    if (saved) {
      setCfg(saved)
    } else {
      setShowKeySetup(true)
    }
  }, [])

  useEffect(() => setTemplates(loadAITemplates()), [])

  // Auto-save whenever provider or key changes so user never has to re-enter
  useEffect(() => {
    if (cfg.apiKey.trim()) {
      saveAIConfig(cfg)
    }
  }, [cfg.apiKey, cfg.provider])

  const toggleType = (t: string) => {
    setTypes(prev => prev.includes(t) ? prev.length > 1 ? prev.filter(x => x !== t) : prev : [...prev, t])
  }

  const saveCfg = () => {
    if (cfg.apiKey.trim()) saveAIConfig(cfg)
    setShowKeySetup(false)
  }

  const generate = async () => {
    if (!cfg.apiKey) { setShowKeySetup(true); return }
    if (!topic.trim()) { setError('Veuillez indiquer un thème ou chapitre.'); return }
    setState('loading')
    setError('')
    try {
      const blocks = await generateExercises(cfg, { subject, level, topic, exerciseTypes: types, difficulty, count, additionalInstructions: extra || undefined, templateBlockTypes: selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.blockTypes : undefined })
      setGenerated(blocks)
      setState('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setState('error')
    }
  }

  const insert = () => {
    onInsert(generated)
    onClose()
  }

  const providerLabel: Record<AIProvider, string> = {
    gemini: 'Google Gemini 2.5 Flash',
    groq: 'Groq — Llama 3.3 (gratuit)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center print:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <h2 className="font-bold text-gray-900">Générer avec l'IA</h2>
              <p className="text-xs text-gray-400">Référentiels FWB — Tronc commun</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* API Key setup */}
          {showKeySetup ? (
            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-amber-800 mb-2">🔑 Clé API nécessaire</p>
                <p className="text-amber-700 mb-3">L'IA fonctionne avec votre propre clé API (gratuite, stockée uniquement sur votre appareil).</p>
                <div className="space-y-2 text-amber-800">
                  <p><strong>Google Gemini (recommandé) :</strong><br />
                  → <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline text-blue-700">aistudio.google.com</a> → <em>Get API key</em><br />
                  Gratuit · Sans carte bancaire · 1 500 req/jour</p>
                  <p><strong>Groq (ultra-rapide) :</strong><br />
                  → <a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="underline text-blue-700">console.groq.com</a> → <em>API Keys</em><br />
                  Gratuit · Llama 3.3 70B · 14 400 req/jour</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Fournisseur</span>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    value={cfg.provider}
                    onChange={e => setCfg(c => ({ ...c, provider: e.target.value as AIProvider }))}
                  >
                    {(Object.keys(providerLabel) as AIProvider[]).map(p => (
                      <option key={p} value={p}>{providerLabel[p]}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Clé API</span>
                  <input
                    type="password"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={cfg.apiKey}
                    onChange={e => setCfg(c => ({ ...c, apiKey: e.target.value }))}
                    placeholder="AIza… ou gsk_…"
                    autoComplete="current-password"
                    name="api-key"
                  />
                  {cfg.apiKey.trim() && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      Clé sauvegardée automatiquement
                    </p>
                  )}
                </label>
                <button
                  onClick={saveCfg}
                  disabled={!cfg.apiKey.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium rounded-xl text-sm transition"
                >
                  Confirmer et continuer
                </button>
              </div>
            </div>
          ) : state === 'preview' ? (
            /* Preview */
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">✅ {generated.length} blocs générés</p>
                <button onClick={() => setState('idle')} className="text-xs text-indigo-500 hover:text-indigo-700">← Modifier</button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-200">Aperçu (mode corrigé activé)</div>
                <div className="p-4 space-y-2 max-h-72 overflow-y-auto bg-white">
                  {generated.map(block => (
                    <div key={block.id} className="text-sm">
                      <BlockRenderer block={block} correctionMode />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400">💡 Les corrections (en vert) seront cachées en mode élève. Vous pourrez les modifier après insertion.</p>
            </div>
          ) : (
            /* Config form */
            <div className="p-5 space-y-4">
              {/* API key info */}
              {!showKeySetup && cfg.apiKey && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
                  <span>✓ {providerLabel[cfg.provider]}</span>
                  <button onClick={() => setShowKeySetup(true)} className="text-indigo-500 hover:text-indigo-700 underline">Changer</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600">Matière</span>
                  <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" value={subject} onChange={e => setSubject(e.target.value)}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600">Niveau FWB</span>
                  <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" value={level} onChange={e => setLevel(e.target.value)}>
                    {['M1','M2','M3','P1','P2','P3','P4','P5','P6','S1','S2','S3','S4','S5','S6'].map(l => <option key={l}>{l}</option>)}
                    {LEVELS.filter(l => !['CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','2nde','1ère','Terminale'].includes(l)).map(l => <option key={l}>{l}</option>)}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Thème / Chapitre <span className="text-red-400">*</span></span>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Ex : les fractions, la Première Guerre mondiale, le présent de l'indicatif…"
                />
              </label>

              <div>
                <span className="text-xs font-medium text-gray-600 block mb-1.5">Types d'exercices</span>
                <div className="flex flex-wrap gap-1.5">
                  {EXERCISE_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleType(t.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${types.includes(t.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                    >
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-600 block mb-1.5">Difficulté</span>
                  <div className="flex gap-1.5">
                    {([1,2,3] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs border font-medium transition ${difficulty === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                      >
                        {'★'.repeat(d)}{'☆'.repeat(3-d)}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600">Nb d'exercices</span>
                  <input
                    type="number" min={1} max={8}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
                    value={count}
                    onChange={e => setCount(Math.min(8, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Instructions supplémentaires (optionnel)</span>
                <textarea
                  rows={2}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  value={extra}
                  onChange={e => setExtra(e.target.value)}
                  placeholder="Ex : inclure un exercice de remédiation, contexte olympique, vocabulaire spécifique…"
                />
              </label>

              {templates.length > 0 && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600">Modèle IA (optionnel)</span>
                  <select
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">Aucun modèle</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>
              )}

              {state === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          {state === 'preview' ? (
            <>
              <button onClick={() => { setState('idle'); setGenerated([]) }} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition">
                ↺ Regénérer
              </button>
              <button onClick={insert} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md">
                ✓ Insérer dans la fiche
              </button>
            </>
          ) : showKeySetup ? null : (
            <button
              onClick={generate}
              disabled={state === 'loading' || !topic.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              {state === 'loading' ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Génération en cours…
                </>
              ) : '✨ Générer les exercices'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
