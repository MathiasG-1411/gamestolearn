import type { ShapeVariant } from '../types/worksheet'

interface Props {
  variant: ShapeVariant
  color: string
  size?: 'sm' | 'md' | 'lg'
  sizeN?: number
  filled?: boolean
}

const SIZE_MAP = { sm: 48, md: 80, lg: 120 }

// Wide variants use a 150×100 viewBox; all others use 100×100
const WIDE = new Set<ShapeVariant>(['rectangle', 'arrow-right', 'arrow-left', 'cloud', 'speech-bubble', 'parallelogram', 'trapezoid', 'trapezoid-right'])

function ShapeContent({ variant, fill, stroke, sw }: { variant: ShapeVariant; fill: string; stroke: string; sw: number }) {
  switch (variant) {
    // ── Triangles ────────────────────────────────────────────────
    case 'triangle':
      return <polygon points="50,4 96,94 4,94" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'triangle-right':
      return <polygon points="6,94 6,6 94,94" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'triangle-isosceles':
      return <polygon points="50,4 85,94 15,94" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'triangle-scalene':
      return <polygon points="10,88 88,76 35,6" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />

    // ── Quadrilaterals ───────────────────────────────────────────
    case 'square':
      return <rect x="8" y="8" width="84" height="84" fill={fill} stroke={stroke} strokeWidth={sw} />
    case 'rectangle':
      return <rect x="4" y="14" width="142" height="72" fill={fill} stroke={stroke} strokeWidth={sw} />
    case 'rhombus':
      return <polygon points="50,5 95,50 50,95 5,50" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'parallelogram':
      return <polygon points="26,8 144,8 124,92 6,92" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'trapezoid':
      return <polygon points="22,8 128,8 145,92 5,92" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'trapezoid-right':
      return <polygon points="6,8 120,8 145,92 6,92" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />

    // ── Circles ──────────────────────────────────────────────────
    case 'disk':
    case 'circle':
      return <circle cx="50" cy="50" r="46" fill={fill} stroke={stroke} strokeWidth={sw} />
    case 'semicircle':
      return <path d="M 4,50 A 46,46 0 0,1 96,50 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />

    // ── Other ────────────────────────────────────────────────────
    case 'star':
      return <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'diamond':
      return <polygon points="50,5 95,50 50,95 5,50" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'arrow-right':
      return <polygon points="0,32 95,32 95,12 148,50 95,88 95,68 0,68" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'arrow-left':
      return <polygon points="150,32 55,32 55,12 2,50 55,88 55,68 150,68" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'cloud':
      return <path d="M28,74 Q8,74 8,54 Q8,34 28,32 Q30,12 55,16 Q68,4 84,18 Q108,18 112,40 Q130,40 130,60 Q130,76 110,76 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
    case 'heart':
      return <path d="M50,84 L16,52 Q2,36 16,22 Q30,8 50,28 Q70,8 84,22 Q98,36 84,52 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    case 'speech-bubble':
      return <path d="M8,8 Q8,4 12,4 L138,4 Q142,4 142,8 L142,64 Q142,68 138,68 L48,68 L30,88 L34,68 L12,68 Q8,68 8,64 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />

    default:
      return <rect x="8" y="18" width="84" height="64" fill={fill} stroke={stroke} strokeWidth={sw} />
  }
}

export default function ShapeRenderer({ variant, color, size = 'md', sizeN, filled = true }: Props) {
  const px = sizeN ?? SIZE_MAP[size] ?? 80
  const wide = WIDE.has(variant)
  const w = wide ? Math.round(px * 1.5) : px
  const h = px
  const viewBox = wide ? '0 0 150 100' : '0 0 100 100'

  const fill = filled ? color : 'none'
  const stroke = filled ? 'none' : color
  const sw = filled ? 0 : 4

  return (
    <svg width={w} height={h} viewBox={viewBox} style={{ display: 'block', overflow: 'visible' }}>
      <ShapeContent variant={variant} fill={fill} stroke={stroke} sw={sw} />
    </svg>
  )
}
