import type { ShapeVariant } from '../types/worksheet'

interface Props {
  variant: ShapeVariant
  color: string
  size: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 32, md: 48, lg: 64 }

export default function ShapeRenderer({ variant, color, size }: Props) {
  const s = sizes[size]
  const fill = color
  const stroke = 'none'

  switch (variant) {
    case 'circle':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'triangle':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="50,5 95,95 5,95" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
            fill={fill} stroke={stroke}
          />
        </svg>
      )
    case 'diamond':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="50,5 95,50 50,95 5,50" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'arrow-right':
      return (
        <svg width={s * 1.5} height={s} viewBox="0 0 150 100">
          <polygon points="0,30 100,30 100,10 150,50 100,90 100,70 0,70" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'arrow-left':
      return (
        <svg width={s * 1.5} height={s} viewBox="0 0 150 100">
          <polygon points="150,30 50,30 50,10 0,50 50,90 50,70 150,70" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'cloud':
      return (
        <svg width={s * 1.5} height={s} viewBox="0 0 150 100">
          <path d="M30,70 Q10,70 10,50 Q10,30 30,30 Q32,10 60,15 Q75,5 90,20 Q115,20 120,40 Q140,40 140,60 Q140,75 120,75 Z" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'heart':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M50,85 L15,50 Q0,35 15,20 Q30,5 50,25 Q70,5 85,20 Q100,35 85,50 Z" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'speech-bubble':
      return (
        <svg width={s * 1.5} height={s} viewBox="0 0 150 100">
          <path d="M10,10 Q10,5 15,5 L135,5 Q140,5 140,10 L140,65 Q140,70 135,70 L50,70 L30,90 L35,70 L15,70 Q10,70 10,65 Z" fill={fill} stroke={stroke} />
        </svg>
      )
    case 'rectangle':
    default:
      return (
        <svg width={s * 1.5} height={s} viewBox="0 0 150 100">
          <rect x="5" y="5" width="140" height="90" rx="8" fill={fill} stroke={stroke} />
        </svg>
      )
  }
}
