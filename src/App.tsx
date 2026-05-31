import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Worksheet } from './types/worksheet'
import { loadWorksheets, saveWorksheet, deleteWorksheet } from './utils/storage'
import { worksheetFromURL, clearShareHash } from './utils/share'
import TemplateGallery from './components/TemplateGallery'
import WorksheetEditor from './components/WorksheetEditor'

export default function App() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [current, setCurrent] = useState<Worksheet | null>(null)
  const [importToast, setImportToast] = useState(false)

  useEffect(() => {
    setWorksheets(loadWorksheets())
    // Check URL for shared worksheet
    const shared = worksheetFromURL()
    if (shared) {
      const imported: Worksheet = { ...shared, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      setCurrent(imported)
      clearShareHash()
      setImportToast(true)
      setTimeout(() => setImportToast(false), 3000)
    }
  }, [])

  const openWorksheet = (ws: Worksheet) => setCurrent(ws)

  const handleChange = (ws: Worksheet) => {
    setCurrent(ws)
    saveWorksheet(ws)
    setWorksheets(loadWorksheets())
  }

  const handleDelete = (id: string) => {
    deleteWorksheet(id)
    setWorksheets(loadWorksheets())
  }

  const handleBack = () => {
    setCurrent(null)
    setWorksheets(loadWorksheets())
  }

  const handleDifferentiate = (ws: Worksheet) => {
    const versions = ['A', 'B', 'C', 'D', 'E']
    // Find the highest existing version among siblings
    const baseId = ws.baseId || ws.id
    const siblings = loadWorksheets().filter(w => w.baseId === baseId || w.id === baseId)
    const usedVersions = siblings.map(w => w.version).filter(Boolean) as string[]
    // Ensure original has version A
    if (!ws.version) {
      const updated = { ...ws, version: 'A', baseId: ws.id, updatedAt: new Date().toISOString() }
      saveWorksheet(updated)
    }
    const nextVersion = versions.find(v => !usedVersions.includes(v)) || 'B'
    const copy: Worksheet = {
      ...ws,
      id: uuidv4(),
      meta: { ...ws.meta, title: ws.meta.title.replace(/ — Version [A-Z]$/, '') + ` — Version ${nextVersion}` },
      version: nextVersion,
      baseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveWorksheet(copy)
    setWorksheets(loadWorksheets())
    setCurrent(copy)
  }

  if (current) {
    return (
      <WorksheetEditor
        worksheet={current}
        onChange={handleChange}
        onBack={handleBack}
        onDifferentiate={handleDifferentiate}
      />
    )
  }

  return (
    <>
      {importToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          📥 Fiche importée depuis le lien partagé
        </div>
      )}
      <TemplateGallery
        worksheets={worksheets}
        onSelect={openWorksheet}
        onDelete={handleDelete}
      />
    </>
  )
}
