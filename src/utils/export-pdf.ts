import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Worksheet } from '../types/worksheet'

export async function exportPDF(worksheet: Worksheet): Promise<void> {
  const element = document.getElementById('worksheet-print')
  if (!element) throw new Error('Élément de fiche introuvable')

  // Capture the element at 2× resolution for crisp output
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    // Ignore the fixed page-border-overlay (handled below)
    // Skip UI-only elements: edit overlays, add-block button, action buttons
    ignoreElements: el =>
      el.classList.contains('page-border-overlay') ||
      el.classList.contains('print:hidden'),
  })

  const A4_W_MM = 210
  const A4_H_MM = 297
  const MARGIN_MM = 15

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const printableW = A4_W_MM - MARGIN_MM * 2
  const printableH = A4_H_MM - MARGIN_MM * 2

  // Scale canvas to printable width
  const imgW = printableW
  const imgH = (canvas.height / canvas.width) * imgW

  // Split across pages
  let yRemaining = imgH
  let yOffset = 0

  while (yRemaining > 0) {
    const sliceH = Math.min(yRemaining, printableH)
    const sliceCanvas = document.createElement('canvas')
    const ratio = canvas.width / imgW
    sliceCanvas.width = canvas.width
    sliceCanvas.height = sliceH * ratio

    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, -yOffset * ratio)

    const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92)
    if (yOffset > 0) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, imgW, sliceH)

    yOffset += sliceH
    yRemaining -= sliceH
  }

  const filename = `${worksheet.meta.title || 'fiche'}.pdf`
  pdf.save(filename)
}
