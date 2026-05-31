import type { Worksheet } from '../types/worksheet'

function encode(ws: Worksheet): string {
  const json = JSON.stringify(ws)
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))))
}

function decode(s: string): Worksheet {
  return JSON.parse(decodeURIComponent(Array.from(atob(s), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')))
}

export function worksheetToURL(ws: Worksheet): string {
  return `${window.location.origin}${window.location.pathname}#share=${encode(ws)}`
}

export function worksheetFromURL(): Worksheet | null {
  try {
    const m = window.location.hash.match(/[#&]share=([^&]+)/)
    if (!m) return null
    return decode(m[1])
  } catch {
    return null
  }
}

export function clearShareHash(): void {
  history.replaceState(null, '', window.location.pathname)
}
