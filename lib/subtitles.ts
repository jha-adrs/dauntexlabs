// SRT / WebVTT parsing, timing fixes and serialisation. Pure functions; times are milliseconds.

export type Cue = { start: number; end: number; text: string }

export type ParseResult =
  | { ok: true; format: 'srt' | 'vtt'; cues: Cue[]; skipped: number }
  | { ok: false; error: string }

const TIME = /^(?:(\d{1,3}):)?([0-5]?\d):([0-5]\d)[,.](\d{1,3})$/

/** '00:01:02,500', '00:01:02.500' or '01:02.500' → ms; null if not a timestamp. */
export function parseTime(s: string): number | null {
  const m = TIME.exec(s.trim())
  if (!m) return null
  const [, h = '0', min, sec, frac] = m
  return ((+h * 60 + +min) * 60 + +sec) * 1000 + +frac.padEnd(3, '0')
}

/** ms → 'hh:mm:ss,mmm' (or with '.' for VTT). Negative values clamp to 0. */
export function formatTime(ms: number, sep: ',' | '.' = ','): string {
  const t = Math.max(0, Math.round(ms))
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  const h = Math.floor(t / 3600000)
  const m = Math.floor((t % 3600000) / 60000)
  const s = Math.floor((t % 60000) / 1000)
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(t % 1000, 3)}`
}

export function parseSubtitles(text: string): ParseResult {
  const src = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const format = /^WEBVTT(?:[ \t].*)?(?:\n|$)/.test(src) ? 'vtt' : 'srt'
  const blocks = src.split(/\n[ \t]*\n+/)
  if (format === 'vtt') blocks.shift() // header block
  const cues: Cue[] = []
  let skipped = 0
  for (const block of blocks) {
    const lines = block.split('\n').filter((l, i, a) => l.trim() || (i > 0 && i < a.length - 1))
    if (!lines.length || !lines.join('').trim()) continue
    if (format === 'vtt' && /^(NOTE|STYLE|REGION)(\s|$)/.test(lines[0])) continue
    const at = lines.findIndex((l) => l.includes('-->'))
    if (at < 0 || at > 1) {
      skipped++
      continue
    }
    const [left, right = ''] = lines[at].split('-->')
    const start = parseTime(left)
    const end = parseTime(right.trim().split(/\s+/)[0] ?? '')
    if (start === null || end === null) {
      skipped++
      continue
    }
    cues.push({ start, end, text: lines.slice(at + 1).join('\n').trimEnd() })
  }
  if (!cues.length) return { ok: false, error: 'No subtitle cues found. Paste or load an .srt or .vtt file.' }
  return { ok: true, format, cues, skipped }
}

/** Move every cue by `ms` (negative = earlier), clamping at 0. */
export function shift(cues: Cue[], ms: number): Cue[] {
  return cues.map((c) => ({ ...c, start: Math.max(0, c.start + ms), end: Math.max(0, c.end + ms) }))
}

/** Linear time map that sends a.from → a.to and b.from → b.to (fixes drift from a frame-rate mismatch). */
export function resync(cues: Cue[], a: { from: number; to: number }, b: { from: number; to: number }): Cue[] {
  if (a.from === b.from) return shift(cues, a.to - a.from)
  const k = (b.to - a.to) / (b.from - a.from)
  const map = (t: number) => Math.max(0, Math.round(a.to + (t - a.from) * k))
  return cues.map((c) => ({ ...c, start: map(c.start), end: map(c.end) }))
}

/** Sort by start; trim each cue so it ends before the next one starts. */
export function fixOverlaps(cues: Cue[]): Cue[] {
  const sorted = [...cues].sort((x, y) => x.start - y.start)
  return sorted.map((c, i) => {
    const next = sorted[i + 1]
    return next ? { ...c, end: Math.max(c.start, Math.min(c.end, next.start - 1)) } : { ...c }
  })
}

function serialise(cues: Cue[], sep: ',' | '.', numbered: boolean): string {
  return cues
    .map((c, i) => `${numbered ? `${i + 1}\n` : ''}${formatTime(c.start, sep)} --> ${formatTime(c.end, sep)}\n${c.text}\n`)
    .join('\n')
}

export function toSrt(cues: Cue[]): string {
  return serialise(cues, ',', true)
}

export function toVtt(cues: Cue[]): string {
  return 'WEBVTT\n\n' + serialise(cues, '.', false)
}
