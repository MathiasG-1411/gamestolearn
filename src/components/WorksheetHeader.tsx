import type { WorksheetMeta } from '../types/worksheet'

interface Props {
  meta: WorksheetMeta
  editMode?: boolean
  onChange?: (meta: WorksheetMeta) => void
  onClose?: () => void
}

const LAYOUTS = [
  { id: 'classic', label: 'Classique', desc: 'Titre + encadré note' },
  { id: 'centered', label: 'Centré', desc: 'Titre centré avec bandeau' },
  { id: 'modern', label: 'Moderne', desc: 'Accent coloré latéral' },
  { id: 'compact', label: 'Compact', desc: 'Une seule ligne' },
  { id: 'school', label: 'École', desc: 'Logo + entête formel' },
] as const

// ─── View renderers ──────────────────────────────────────────────

function ClassicHeader({ meta }: { meta: WorksheetMeta }) {
  const accent = meta.accentColor || '#1e293b'
  return (
    <div className="worksheet-header mb-6">
      <div className="flex justify-between items-start pb-3 mb-3" style={{ borderBottom: `2px solid ${accent}` }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: accent }}>{meta.title}</h1>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
            {meta.subject && <span>{meta.subject}</span>}
            {meta.level && <span>• {meta.level}</span>}
            {meta.duration && <span>• {meta.duration}</span>}
            {meta.teacherName && <span>• {meta.teacherName}</span>}
          </div>
        </div>
        {meta.showScore && (
          <div className="border-2 px-4 py-2 text-sm font-medium text-center min-w-[90px] shrink-0" style={{ borderColor: accent, color: accent }}>
            Note :<br />
            <span className="text-lg font-bold">__ / 20</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-6 text-sm">
        {meta.showName && (
          <span>Nom : <span className="inline-block border-b border-gray-400 min-w-[160px]">&nbsp;</span></span>
        )}
        {meta.showDate && (
          <span>Date : <span className="text-gray-500">{meta.date}</span></span>
        )}
        {meta.className && (
          <span>Classe : <span className="text-gray-500">{meta.className}</span></span>
        )}
      </div>
    </div>
  )
}

function CenteredHeader({ meta }: { meta: WorksheetMeta }) {
  const accent = meta.accentColor || '#4f46e5'
  return (
    <div className="worksheet-header mb-6 text-center">
      <h1 className="text-2xl font-bold mb-1" style={{ color: accent }}>{meta.title}</h1>
      <div className="flex flex-wrap justify-center gap-3 text-sm py-2 px-4 rounded-lg mb-3" style={{ backgroundColor: accent + '15' }}>
        {meta.subject && <span className="font-medium" style={{ color: accent }}>{meta.subject}</span>}
        {meta.level && <span className="text-gray-600">• {meta.level}</span>}
        {meta.duration && <span className="text-gray-600">• {meta.duration}</span>}
        {meta.teacherName && <span className="text-gray-600">• {meta.teacherName}</span>}
        {meta.date && <span className="text-gray-600">• {meta.date}</span>}
      </div>
      <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ borderTop: `1px solid ${accent}40`, paddingTop: '0.5rem' }}>
        {meta.showName && (
          <span>Nom : <span className="inline-block border-b border-gray-400 min-w-[160px]">&nbsp;</span></span>
        )}
        {meta.showScore && (
          <span>Note : <span className="inline-block border-b border-gray-400 min-w-[60px]">&nbsp;</span> / 20</span>
        )}
        {meta.className && <span>Classe : {meta.className}</span>}
      </div>
    </div>
  )
}

function ModernHeader({ meta }: { meta: WorksheetMeta }) {
  const accent = meta.accentColor || '#0ea5e9'
  return (
    <div className="worksheet-header mb-6 flex gap-4 items-stretch">
      <div className="w-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{meta.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm mb-2">
          {meta.subject && <span className="font-semibold" style={{ color: accent }}>{meta.subject}</span>}
          {meta.level && <span className="text-gray-500">{meta.level}</span>}
          {meta.duration && <span className="text-gray-400">· {meta.duration}</span>}
          {meta.teacherName && <span className="text-gray-400">· {meta.teacherName}</span>}
        </div>
        <div className="flex flex-wrap gap-6 text-sm pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
          {meta.showName && (
            <span>Nom : <span className="inline-block border-b border-gray-400 min-w-[140px]">&nbsp;</span></span>
          )}
          {meta.showDate && <span className="text-gray-500">Date : {meta.date}</span>}
          {meta.className && <span className="text-gray-500">Classe : {meta.className}</span>}
          {meta.showScore && (
            <span className="ml-auto font-medium" style={{ color: accent }}>/ 20</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CompactHeader({ meta }: { meta: WorksheetMeta }) {
  const accent = meta.accentColor || '#374151'
  return (
    <div className="worksheet-header mb-4">
      <div className="flex items-center justify-between gap-4 pb-2" style={{ borderBottom: `1.5px solid ${accent}` }}>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-lg font-bold" style={{ color: accent }}>{meta.title}</h1>
          {meta.subject && <span className="text-sm text-gray-500">{meta.subject}</span>}
          {meta.level && <span className="text-sm text-gray-400">{meta.level}</span>}
          {meta.duration && <span className="text-sm text-gray-400">· {meta.duration}</span>}
        </div>
        <div className="flex gap-4 text-sm shrink-0">
          {meta.showName && <span>Nom : <span className="inline-block border-b border-gray-400 min-w-[100px]">&nbsp;</span></span>}
          {meta.showDate && <span>{meta.date}</span>}
          {meta.showScore && <span>/ 20</span>}
        </div>
      </div>
    </div>
  )
}

function SchoolHeader({ meta }: { meta: WorksheetMeta }) {
  const accent = meta.accentColor || '#1e3a5f'
  return (
    <div className="worksheet-header mb-6">
      <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: `3px double ${accent}` }}>
        <div className="flex items-center gap-3">
          {meta.logo ? (
            <img src={meta.logo} alt="Logo" className="h-12 w-12 object-contain" />
          ) : (
            <div className="h-12 w-12 border-2 rounded flex items-center justify-center text-xs text-gray-400 shrink-0" style={{ borderColor: accent + '40' }}>Logo</div>
          )}
          <div>
            {meta.teacherName && <div className="text-xs text-gray-500 uppercase tracking-wide">{meta.teacherName}</div>}
            <div className="text-xs text-gray-400">{meta.subject} — {meta.level}</div>
          </div>
        </div>
        <div className="text-right">
          {meta.date && <div className="text-xs text-gray-500">{meta.date}</div>}
          {meta.duration && <div className="text-xs text-gray-400">Durée : {meta.duration}</div>}
        </div>
      </div>
      <h1 className="text-xl font-bold text-center mb-3 uppercase tracking-wide" style={{ color: accent }}>{meta.title}</h1>
      <div className="grid grid-cols-3 gap-2 text-sm">
        {meta.showName && (
          <div>Nom : <span className="inline-block border-b border-gray-400 min-w-[120px]">&nbsp;</span></div>
        )}
        {meta.className && <div>Classe : {meta.className}</div>}
        {meta.showScore && (
          <div className="text-right">Note : <span className="inline-block border-b border-gray-400 min-w-[40px]">&nbsp;</span> / 20</div>
        )}
      </div>
    </div>
  )
}

// ─── Layout preview thumbnails ────────────────────────────────────

function LayoutPreview({ id, accent }: { id: string; accent: string }) {
  const a = accent || '#4f46e5'
  if (id === 'classic') return (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="2" y="6" width="48" height="4" rx="1" fill={a} opacity=".9" />
      <rect x="2" y="13" width="28" height="2" rx="1" fill="#9ca3af" />
      <rect x="2" y="26" width="60" height="1.5" rx=".5" fill={a} />
      <rect x="2" y="30" width="30" height="2" rx="1" fill="#d1d5db" />
      <rect x="60" y="5" width="18" height="14" rx="1.5" fill="none" stroke={a} strokeWidth="1.5" />
      <text x="69" y="14" textAnchor="middle" fontSize="5" fill={a}>__/20</text>
    </svg>
  )
  if (id === 'centered') return (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="15" y="4" width="50" height="4" rx="1" fill={a} opacity=".9" />
      <rect x="10" y="11" width="60" height="6" rx="2" fill={a} opacity=".12" />
      <rect x="18" y="13" width="16" height="2" rx="1" fill={a} opacity=".7" />
      <rect x="38" y="13" width="12" height="2" rx="1" fill="#9ca3af" opacity=".7" />
      <rect x="54" y="13" width="10" height="2" rx="1" fill="#9ca3af" opacity=".7" />
      <rect x="10" y="22" width="60" height="1" rx=".5" fill={a} opacity=".25" />
      <rect x="15" y="26" width="25" height="2" rx="1" fill="#d1d5db" />
      <rect x="44" y="26" width="18" height="2" rx="1" fill="#d1d5db" />
    </svg>
  )
  if (id === 'modern') return (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="2" y="3" width="3" height="34" rx="1.5" fill={a} />
      <rect x="9" y="5" width="44" height="5" rx="1" fill="#1e293b" opacity=".85" />
      <rect x="9" y="13" width="18" height="2.5" rx="1" fill={a} opacity=".8" />
      <rect x="30" y="13.5" width="14" height="2" rx="1" fill="#9ca3af" />
      <rect x="9" y="23" width="62" height="1" rx=".5" fill="#e5e7eb" />
      <rect x="9" y="27" width="28" height="2" rx="1" fill="#d1d5db" />
      <rect x="60" y="26" width="10" height="3" rx="1" fill={a} opacity=".3" />
    </svg>
  )
  if (id === 'compact') return (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="2" y="14" width="32" height="4" rx="1" fill={a} opacity=".9" />
      <rect x="37" y="15" width="14" height="2.5" rx="1" fill="#9ca3af" />
      <rect x="55" y="15" width="10" height="2.5" rx="1" fill="#9ca3af" />
      <rect x="2" y="22" width="76" height="1.5" rx=".5" fill={a} />
    </svg>
  )
  if (id === 'school') return (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="2" y="2" width="10" height="10" rx="1.5" fill="none" stroke={a} strokeWidth="1.2" opacity=".5" />
      <rect x="15" y="4" width="22" height="3" rx="1" fill="#6b7280" opacity=".7" />
      <rect x="15" y="9" width="16" height="2" rx="1" fill="#9ca3af" />
      <rect x="58" y="4" width="18" height="2.5" rx="1" fill="#d1d5db" />
      <rect x="2" y="16" width="76" height="2" rx=".5" fill={a} />
      <rect x="15" y="21" width="50" height="5" rx="1" fill={a} opacity=".12" />
      <rect x="25" y="22.5" width="30" height="2.5" rx="1" fill={a} opacity=".8" />
      <rect x="2" y="31" width="28" height="2" rx="1" fill="#d1d5db" />
      <rect x="50" y="31" width="28" height="2" rx="1" fill="#d1d5db" />
    </svg>
  )
  return null
}

// ─── Edit form ────────────────────────────────────────────────────

export default function WorksheetHeader({ meta, editMode = false, onChange, onClose }: Props) {
  const update = (patch: Partial<WorksheetMeta>) => onChange?.({ ...meta, ...patch })
  const layout = meta.headerLayout || 'classic'
  const accent = meta.accentColor || (layout === 'classic' ? '#1e293b' : layout === 'centered' ? '#4f46e5' : layout === 'modern' ? '#0ea5e9' : layout === 'compact' ? '#374151' : '#1e3a5f')

  if (!editMode) {
    switch (layout) {
      case 'centered': return <CenteredHeader meta={meta} />
      case 'modern': return <ModernHeader meta={meta} />
      case 'compact': return <CompactHeader meta={meta} />
      case 'school': return <SchoolHeader meta={meta} />
      default: return <ClassicHeader meta={meta} />
    }
  }

  const inputCls = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white'

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-4 space-y-4"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 tracking-wide uppercase">En-tête de la fiche</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm px-2 py-0.5 rounded-lg hover:bg-gray-100 transition">✕</button>
        )}
      </div>

      {/* Layout picker */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Modèle d'en-tête</p>
        <div className="grid grid-cols-5 gap-2">
          {LAYOUTS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => update({ headerLayout: l.id as WorksheetMeta['headerLayout'] })}
              className={`relative rounded-xl border-2 overflow-hidden transition-all ${layout === l.id ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="h-10 p-1">
                <LayoutPreview id={l.id} accent={accent} />
              </div>
              <div className={`text-center py-0.5 text-[10px] font-medium ${layout === l.id ? 'bg-indigo-500 text-white' : 'bg-gray-50 text-gray-500'}`}>
                {l.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Couleur accent</label>
        <div className="flex gap-2 flex-wrap">
          {['#1e293b', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#374151'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => update({ accentColor: c })}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${(meta.accentColor || accent) === c ? 'border-gray-800 scale-110' : 'border-white shadow'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={meta.accentColor || accent}
            onChange={e => update({ accentColor: e.target.value })}
            className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer p-0 overflow-hidden"
            title="Couleur personnalisée"
          />
        </div>
      </div>

      {/* Fields */}
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
          <span className="text-xs font-medium text-gray-500">Date</span>
          <input className={inputCls} value={meta.date} onChange={e => update({ date: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Durée</span>
          <input className={inputCls} value={meta.duration || ''} onChange={e => update({ duration: e.target.value })} placeholder="1h, 45min…" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Enseignant·e</span>
          <input className={inputCls} value={meta.teacherName || ''} onChange={e => update({ teacherName: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Classe</span>
          <input className={inputCls} value={meta.className || ''} onChange={e => update({ className: e.target.value })} placeholder="3ème B…" />
        </label>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4 pt-1">
        {[
          { key: 'showName', label: 'Champ Nom' },
          { key: 'showDate', label: 'Afficher la date' },
          { key: 'showScore', label: 'Zone de note' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!meta[key as keyof WorksheetMeta]}
              onChange={e => update({ [key]: e.target.checked } as Partial<WorksheetMeta>)}
              className="rounded"
            />
            <span className="text-gray-600">{label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
