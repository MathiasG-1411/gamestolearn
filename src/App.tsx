import { useState, useEffect } from 'react'
import type { Worksheet } from './types/worksheet'
import { loadWorksheets, saveWorksheet, deleteWorksheet } from './utils/storage'
import TemplateGallery from './components/TemplateGallery'
import WorksheetEditor from './components/WorksheetEditor'

export default function App() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [current, setCurrent] = useState<Worksheet | null>(null)

  useEffect(() => {
    setWorksheets(loadWorksheets())
  }, [])

  const openWorksheet = (ws: Worksheet) => {
    setCurrent(ws)
  }

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

  if (current) {
    return (
      <WorksheetEditor
        worksheet={current}
        onChange={handleChange}
        onBack={handleBack}
      />
    )
  }

  return (
    <TemplateGallery
      worksheets={worksheets}
      onSelect={openWorksheet}
      onDelete={handleDelete}
    />
  )
}
