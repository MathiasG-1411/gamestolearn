import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, UnderlineType, ShadingType,
} from 'docx'
import type { Worksheet, Block } from '../types/worksheet'

const MM_TO_TWO = (mm: number) => Math.round(mm * 56.7) // mm → twips (1mm ≈ 56.7 twips)

function align(a?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  if (a === 'center') return AlignmentType.CENTER
  if (a === 'right') return AlignmentType.RIGHT
  return AlignmentType.LEFT
}

function blockToDocxChildren(block: Block): (Paragraph | Table)[] {
  switch (block.type) {
    case 'text': {
      return [new Paragraph({
        alignment: align(block.align),
        children: [new TextRun({
          text: block.content,
          bold: block.bold,
          italics: block.italic,
          underline: block.underline ? { type: UnderlineType.SINGLE } : undefined,
          size: block.fontSize === 'xl' ? 32 : block.fontSize === 'lg' ? 28 : block.fontSize === 'sm' ? 20 : 24,
        })],
      })]
    }

    case 'heading': {
      const level = block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
      return [new Paragraph({ text: block.content, heading: level, alignment: align(block.align) })]
    }

    case 'exercise-header': {
      const lines: Paragraph[] = [
        new Paragraph({
          children: [
            new TextRun({ text: `Exercice ${block.number} — `, bold: true, size: 28 }),
            new TextRun({ text: block.title || '', bold: true, size: 28 }),
            ...(block.points !== undefined ? [new TextRun({ text: `  [${block.points} pt${block.points > 1 ? 's' : ''}]`, size: 22 })] : []),
          ],
        }),
      ]
      if (block.attendu) {
        lines.push(new Paragraph({
          children: [
            new TextRun({ text: 'Attendu : ', bold: true, italics: true, size: 20, color: '6366f1' }),
            new TextRun({ text: block.attendu, italics: true, size: 20, color: '6366f1' }),
          ],
        }))
      }
      if (block.attenduCode) {
        lines.push(new Paragraph({ children: [new TextRun({ text: block.attenduCode, size: 18, color: '9ca3af' })] }))
      }
      return lines
    }

    case 'numbered-list':
    case 'bullet-list': {
      return block.items.map((item, i) => new Paragraph({
        children: [new TextRun({ text: block.type === 'numbered-list' ? `${i + 1}. ${item}` : `• ${item}` })],
        indent: { left: MM_TO_TWO(8) },
      }))
    }

    case 'table': {
      const rows = block.rows.map((row, ri) =>
        new TableRow({
          children: row.map(cell => new TableCell({
            children: [new Paragraph({
              alignment: align(cell.align),
              children: [new TextRun({ text: cell.content, bold: cell.bold || (ri === 0 && block.hasHeader) })],
            })],
            shading: (ri === 0 && block.hasHeader) ? { type: ShadingType.CLEAR, fill: 'e0e7ff' } : undefined,
          })),
        })
      )
      return [new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
          insideVertical: { style: BorderStyle.SINGLE, size: 1 },
        },
      })]
    }

    case 'qcm': {
      const lines: Paragraph[] = [
        new Paragraph({ children: [new TextRun({ text: block.question, bold: true })] }),
        ...block.options.map((opt, i) => new Paragraph({
          children: [new TextRun({ text: `${String.fromCharCode(65 + i)}.  ${opt}` })],
          indent: { left: MM_TO_TWO(8) },
        })),
      ]
      return lines
    }

    case 'true-false': {
      const lines: Paragraph[] = []
      if (block.instruction) lines.push(new Paragraph({ children: [new TextRun({ text: block.instruction, bold: true })] }))
      block.statements.forEach(stmt => {
        lines.push(new Paragraph({
          children: [new TextRun({ text: `☐ Vrai   ☐ Faux     ${stmt}` })],
          indent: { left: MM_TO_TWO(4) },
        }))
      })
      return lines
    }

    case 'fill-blank': {
      const lines: Paragraph[] = []
      if (block.instruction) lines.push(new Paragraph({ children: [new TextRun({ text: block.instruction, bold: true })] }))
      lines.push(new Paragraph({ children: [new TextRun({ text: block.text })] }))
      if (block.showWordBank && block.wordBank?.length) {
        lines.push(new Paragraph({ children: [new TextRun({ text: `Banque de mots : ${block.wordBank.join(' — ')}`, italics: true })] }))
      }
      return lines
    }

    case 'matching': {
      const lines: Paragraph[] = [
        new Paragraph({ children: [new TextRun({ text: block.instruction || 'Relie les éléments :', bold: true })] }),
      ]
      const max = Math.max(block.leftItems.length, block.rightItems.length)
      for (let i = 0; i < max; i++) {
        lines.push(new Paragraph({
          children: [new TextRun({
            text: `${block.leftItems[i] ?? ''}${''.padEnd(30, ' ')}${block.rightItems[i] ?? ''}`,
          })],
          indent: { left: MM_TO_TWO(4) },
        }))
      }
      return lines
    }

    case 'blank-lines': {
      return Array.from({ length: block.count }, () =>
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: MM_TO_TWO(8) },
          border: block.lined ? { bottom: { style: BorderStyle.SINGLE, size: 1, color: '9ca3af' } } : undefined,
        })
      )
    }

    case 'divider': {
      return [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '9ca3af' } },
        children: [],
      })]
    }

    case 'exercise-item': {
      const lines: Paragraph[] = [
        new Paragraph({ children: [new TextRun({ text: block.questionText, bold: block.questionStyle === 'shaded' })] }),
      ]
      // Answer area placeholder
      const answerLabel =
        block.answerStyle === 'lines' || block.answerStyle === 'dotted-lines' ? `[Réponse sur ${block.lineCount} ligne${block.lineCount > 1 ? 's' : ''}]` :
        block.answerStyle === 'box' ? '[Zone de réponse]' :
        block.answerStyle === 'qcm' ? `[QCM : ${block.qcmOptions.join(' / ')}]` : ''
      if (answerLabel) lines.push(new Paragraph({ children: [new TextRun({ text: answerLabel, italics: true, color: '9ca3af' })] }))
      return lines
    }

    case 'rubric': {
      const headerRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Critère', bold: true })] })] }),
          ...block.levels.map((lvl, li) => new TableCell({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: lvl, bold: true }),
                ...(block.showPoints && block.levelPoints ? [new TextRun({ text: `\n${block.levelPoints[li]} pt`, size: 18 })] : []),
              ],
            })],
            shading: { type: ShadingType.CLEAR, fill: 'e0e7ff' },
          })),
        ],
      })
      const dataRows = block.criteria.map(crit =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: crit.name, bold: true })] })] }),
            ...crit.descriptions.map(desc => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: desc })] })] })),
          ],
        })
      )
      return [
        ...(block.title ? [new Paragraph({ text: block.title, heading: HeadingLevel.HEADING_3 })] : []),
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 }, insideVertical: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ]
    }

    case 'columns': {
      // Render each column as sequential paragraphs with a separator
      const result: Paragraph[] = []
      block.content.forEach((col, i) => {
        if (i > 0) result.push(new Paragraph({ children: [new TextRun({ text: '─────' })] }))
        result.push(new Paragraph({ children: [new TextRun({ text: col })] }))
      })
      return result
    }

    case 'page-break':
      return [new Paragraph({ pageBreakBefore: true, children: [] })]

    default:
      return []
  }
}

export async function exportDOCX(worksheet: Worksheet): Promise<void> {
  const meta = worksheet.meta
  const margin = MM_TO_TWO(20)

  // Header section paragraphs
  const headerParagraphs: Paragraph[] = [
    new Paragraph({ text: meta.title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
  ]
  const metaLine: TextRun[] = []
  if (meta.subject) metaLine.push(new TextRun({ text: meta.subject }))
  if (meta.level) metaLine.push(new TextRun({ text: `  •  ${meta.level}` }))
  if (meta.teacherName) metaLine.push(new TextRun({ text: `  •  ${meta.teacherName}` }))
  if (meta.date) metaLine.push(new TextRun({ text: `  •  ${meta.date}` }))
  if (metaLine.length) {
    headerParagraphs.push(new Paragraph({ children: metaLine, alignment: AlignmentType.CENTER }))
  }

  // Name / Score / Date fields
  const fieldLine: TextRun[] = []
  if (meta.showName) fieldLine.push(new TextRun({ text: 'Nom : ___________________________     ' }))
  if (meta.showDate) fieldLine.push(new TextRun({ text: 'Date : _______________     ' }))
  if (meta.showScore) fieldLine.push(new TextRun({ text: 'Score : _______ / ______' }))
  if (fieldLine.length) {
    headerParagraphs.push(new Paragraph({ children: [] })) // spacing
    headerParagraphs.push(new Paragraph({ children: fieldLine }))
  }

  headerParagraphs.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '374151' } } }))
  headerParagraphs.push(new Paragraph({ children: [] })) // spacing after divider

  // Blocks
  const blockParagraphs: (Paragraph | Table)[] = []
  for (const block of worksheet.blocks) {
    const children = blockToDocxChildren(block)
    blockParagraphs.push(...children)
    blockParagraphs.push(new Paragraph({ children: [] })) // spacing between blocks
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: margin, bottom: margin, left: margin, right: margin },
        },
      },
      children: [...headerParagraphs, ...blockParagraphs],
    }],
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 24 } },
      },
    },
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${meta.title || 'fiche'}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
