export type BlockType =
  | 'text'
  | 'heading'
  | 'math'
  | 'table'
  | 'columns'
  | 'shape'
  | 'image'
  | 'divider'
  | 'exercise-header'
  | 'blank-lines'
  | 'numbered-list'
  | 'bullet-list'
  | 'qcm'
  | 'true-false'
  | 'fill-blank'
  | 'matching'
  | 'exercise-item'

export interface BaseBlock {
  id: string
  type: BlockType
  // Block-level styles
  bg?: string
  borderColor?: string
  borderWidth?: 'thin' | 'medium' | 'thick'
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg'
  fontFamily?: string
}

export interface TextBlock extends BaseBlock {
  type: 'text'
  content: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: 'sm' | 'base' | 'lg' | 'xl'
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  content: string
  level: 1 | 2 | 3
  align?: 'left' | 'center' | 'right'
}

export interface MathBlock extends BaseBlock {
  type: 'math'
  latex: string
  display: 'inline' | 'block'
  label?: string
}

export interface TableCell {
  content: string
  bold?: boolean
  align?: 'left' | 'center' | 'right'
  bg?: string
}

export interface TableBlock extends BaseBlock {
  type: 'table'
  rows: TableCell[][]
  hasHeader: boolean
  caption?: string
}

export interface ColumnsBlock extends BaseBlock {
  type: 'columns'
  columns: number
  content: string[]
  gap?: 'sm' | 'md' | 'lg'
}

export type ShapeVariant = 'rectangle' | 'circle' | 'triangle' | 'star' | 'diamond' | 'arrow-right' | 'arrow-left' | 'cloud' | 'heart' | 'speech-bubble'

export interface ShapeBlock extends BaseBlock {
  type: 'shape'
  variant: ShapeVariant
  color: string
  size: 'sm' | 'md' | 'lg'
  label?: string
  count?: number
  arrangement?: 'row' | 'grid'
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  src: string
  alt?: string
  width?: 'full' | 'half' | 'third'
  align?: 'left' | 'center' | 'right'
  caption?: string
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
  style?: 'solid' | 'dashed' | 'dotted' | 'double'
}

export interface ExerciseHeaderBlock extends BaseBlock {
  type: 'exercise-header'
  number: number
  title: string
  points?: number
  duration?: string
  difficulty?: 1 | 2 | 3
  competency?: string
}

export interface BlankLinesBlock extends BaseBlock {
  type: 'blank-lines'
  count: number
  lined: boolean
}

export interface ListBlock extends BaseBlock {
  type: 'numbered-list' | 'bullet-list'
  items: string[]
}

export interface QCMBlock extends BaseBlock {
  type: 'qcm'
  question: string
  options: string[]
  style: 'letters' | 'circles'
  multipleAnswers: boolean
}

export interface TrueFalseBlock extends BaseBlock {
  type: 'true-false'
  instruction?: string
  statements: string[]
}

export interface FillBlankBlock extends BaseBlock {
  type: 'fill-blank'
  instruction?: string
  text: string
  wordBank?: string[]
  showWordBank: boolean
}

export interface MatchingBlock extends BaseBlock {
  type: 'matching'
  instruction?: string
  leftItems: string[]
  rightItems: string[]
}

export type QuestionStyle = 'plain' | 'shaded' | 'boxed'
export type AnswerStyle =
  | 'lines'
  | 'dotted-lines'
  | 'box'
  | 'grid'
  | 'qcm'
  | 'true-false'
  | 'short'
  | 'none'

export interface ExerciseItemBlock extends BaseBlock {
  type: 'exercise-item'
  // Question zone
  questionText: string
  questionStyle: QuestionStyle
  questionBg?: string
  questionBorderColor?: string
  // Answer zone
  answerStyle: AnswerStyle
  lineCount: number           // for lines / dotted-lines
  boxHeight: 'sm' | 'md' | 'lg' | 'xl'  // for box / grid
  qcmOptions: string[]        // for qcm
  qcmOptionStyle: 'letters' | 'circles'
  layout: 'stacked' | 'side-by-side'  // question left, answer right
}

export type Block =
  | TextBlock
  | HeadingBlock
  | MathBlock
  | TableBlock
  | ColumnsBlock
  | ShapeBlock
  | ImageBlock
  | DividerBlock
  | ExerciseHeaderBlock
  | BlankLinesBlock
  | ListBlock
  | QCMBlock
  | TrueFalseBlock
  | FillBlankBlock
  | MatchingBlock
  | ExerciseItemBlock

export interface WorksheetMeta {
  title: string
  subject: string
  level: string
  date: string
  duration?: string
  teacherName?: string
  className?: string
  logo?: string
  showScore: boolean
  showName: boolean
  showDate: boolean
}

export interface Worksheet {
  id: string
  meta: WorksheetMeta
  blocks: Block[]
  createdAt: string
  updatedAt: string
}

export const SUBJECTS = [
  'Mathématiques', 'Français', 'Histoire-Géographie', 'Sciences', 'Anglais',
  'Espagnol', 'Allemand', 'Physique-Chimie', 'SVT', 'Informatique',
  'Arts plastiques', 'Musique', 'EPS', 'Philosophie', 'Autre'
]

export const LEVELS = [
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  '6ème', '5ème', '4ème', '3ème',
  '2nde', '1ère', 'Terminale',
  'BTS', 'Licence', 'Master', 'Autre'
]

export const FONT_OPTIONS = [
  { label: 'Défaut (Inter)', value: '' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
  { label: 'Courier New (machine)', value: '"Courier New", monospace' },
  { label: 'Nunito (arrondi)', value: '"Nunito", sans-serif' },
  { label: 'Caveat (manuscrit)', value: '"Caveat", cursive' },
  { label: 'Fredoka One (ludique)', value: '"Fredoka One", cursive' },
  { label: 'Kalam (écriture)', value: '"Kalam", cursive' },
]
