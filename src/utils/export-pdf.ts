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

  const imgW = printableW
  const imgH = (canvas.height / canvas.width) * imgW

  // Collect block boundaries (in mm within the image) to avoid slicing mid-block
  const elementRect = element.getBoundingClientRect()
  const elH = element.offsetHeight || 1

  // Also collect forced page-break positions
  const pageBreakPositionsMm: number[] = []
  const blockEls = Array.from(element.querySelectorAll('[data-block-id]'))
  const blockBoundsMm = blockEls.map(el => {
    const el2 = el as HTMLElement
    const rect = el2.getBoundingClientRect()
    const topPx = Math.max(0, rect.top - elementRect.top)
    const bottomPx = Math.max(0, rect.bottom - elementRect.top)
    const topMm = (topPx / elH) * imgH
    const bottomMm = (bottomPx / elH) * imgH
    if (el2.classList.contains('print-page-break')) {
      pageBreakPositionsMm.push(topMm)
    }
    return { top: topMm, bottom: bottomMm }
  })

  // Split across pages, respecting block boundaries and forced page breaks
  let yOffset = 0

  while (yOffset < imgH - 0.5) {
    // Check if we hit a forced page break
    const nextForced = pageBreakPositionsMm
      .filter(p => p > yOffset + 1)
      .sort((a, b) => a - b)[0]

    let sliceH = Math.min(imgH - yOffset, printableH)

    if (nextForced !== undefined && nextForced - yOffset < sliceH) {
      // Forced page break before the natural end
      sliceH = nextForced - yOffset
    } else if (yOffset + sliceH < imgH - 0.5) {
      // Try to avoid cutting through a block (move cut to just before the block)
      const cutAt = yOffset + sliceH
      let bestCut = sliceH
      for (const block of blockBoundsMm) {
        if (block.top > yOffset + 5 && block.top < cutAt && block.bottom > cutAt) {
          // This block spans the cut — move cut to just before it starts
          const candidate = block.top - yOffset - 1
          if (candidate > printableH * 0.3 && candidate < bestCut) {
            bestCut = candidate
          }
        }
      }
      sliceH = bestCut
    }

    if (sliceH < 1) sliceH = 1 // safety

    const ratio = canvas.width / imgW
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = Math.round(sliceH * ratio)

    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, -yOffset * ratio)

    const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92)
    if (yOffset > 0) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, imgW, sliceH)

    yOffset += sliceH
  }

  const filename = `${worksheet.meta.title || 'fiche'}.pdf`
  pdf.save(filename)
}
