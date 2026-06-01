import { useEffect, useRef } from 'react'

interface Props {
  latex: string
  display?: boolean
  className?: string
}

export default function MathRenderer({ latex, display = false, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    import('katex').then(({ default: katex }) => {
      if (!el) return
      try {
        katex.render(latex, el, { displayMode: display, throwOnError: false, trust: true })
      } catch {
        el.textContent = latex
      }
    })
  }, [latex, display])

  return <span ref={ref} className={className} />
}
