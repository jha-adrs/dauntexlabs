/**
 * Hindi typing on an English (US QWERTY) keyboard: raw key sequence → Unicode Devanagari.
 * Pure functions, no I/O.
 *
 * Layouts
 *  - InScript (BIS IS 13194 / Windows "Hindi Traditional"): one key → one Unicode
 *    character (or a short conjunct on Shift+3…8). InScript is typed in Unicode
 *    logical order (क then ि), so a plain per-key lookup is enough.
 *  - Remington (Gail): the typewriter layout used by Kruti Dev / DevLys fonts and in
 *    government typing tests. Keys are identical to Kruti Dev 010 code points, so the
 *    raw sequence is passed through `toUnicode(…, 'krutidev')`, which already handles
 *    the pre-base short-i matra (ि typed first) and reph reordering.
 *
 * InScript sources (map written by hand as data, cross-checked; no code copied)
 *  - Unicode CLDR keyboard data, keyboards/windows/hi-t-k0-windows.xml (release 41) —
 *    the Windows Devanagari INSCRIPT layout, base and Shift maps.
 *  - xkeyboard-config symbols/in, section "deva" (Indian INSCRIPT), as mirrored in
 *    libxkbcommon test/data/symbols/in.
 *  Both agree on every letter/matra key. They differ on the number row: Windows types
 *  ASCII digits and the Shift+3…8 conjunct shortcuts (्र र् ज्ञ त्र क्ष श्र); xkb types
 *  Devanagari digits and leaves those as ASCII symbols. We follow Windows, the layout
 *  most users and typing exams use.
 */

import { toUnicode } from '@/lib/legacy-fonts'

export type Layout = 'remington' | 'inscript'

/** Key character (Shift already applied, US QWERTY) → Devanagari. */
export const INSCRIPT: Record<string, string> = {
  // number row
  '`': 'ॊ', '~': 'ऒ',
  '!': 'ऍ', '@': 'ॅ', '#': '्र', '$': 'र्', '%': 'ज्ञ', '^': 'त्र', '&': 'क्ष', '*': 'श्र',
  '-': '-', _: 'ः', '=': 'ृ', '+': 'ऋ',
  // top row
  q: 'ौ', Q: 'औ', w: 'ै', W: 'ऐ', e: 'ा', E: 'आ', r: 'ी', R: 'ई', t: 'ू', T: 'ऊ',
  y: 'ब', Y: 'भ', u: 'ह', U: 'ङ', i: 'ग', I: 'घ', o: 'द', O: 'ध', p: 'ज', P: 'झ',
  '[': 'ड', '{': 'ढ', ']': '़', '}': 'ञ', '\\': 'ॉ', '|': 'ऑ',
  // home row
  a: 'ो', A: 'ओ', s: 'े', S: 'ए', d: '्', D: 'अ', f: 'ि', F: 'इ', g: 'ु', G: 'उ',
  h: 'प', H: 'फ', j: 'र', J: 'ऱ', k: 'क', K: 'ख', l: 'त', L: 'थ', ';': 'च', ':': 'छ',
  "'": 'ट', '"': 'ठ',
  // bottom row
  z: 'ॆ', Z: 'ऎ', x: 'ं', X: 'ँ', c: 'म', C: 'ण', v: 'न', V: 'ऩ', b: 'व', B: 'ऴ',
  n: 'ल', N: 'ळ', m: 'स', M: 'श', ',': ',', '<': 'ष', '.': '.', '>': '।', '/': 'य', '?': 'य़',
}

/** Raw key sequence → Unicode Devanagari. Unmapped keys (space, newline, digits…) pass through. */
export function typeKeys(keys: string, layout: Layout): string {
  if (!keys) return ''
  if (layout === 'remington') return toUnicode(keys, 'krutidev')
  let out = ''
  for (const c of keys) out += INSCRIPT[c] ?? c
  return out
}

/** Physical keyboard rows, each key followed by its Shift character. */
const ROWS = [
  '`~1!2@3#4$5%6^7&8*9(0)-_=+',
  'qQwWeErRtTyYuUiIoOpP[{]}\\|',
  "aAsSdDfFgGhHjJkKlL;:'\"",
  'zZxXcCvVbBnNmM,<.>/?',
]

function chartFor(layout: Layout) {
  return ROWS.map((row) =>
    [...row]
      .map((key) => ({ key, out: typeKeys(key, layout) }))
      // keys that type themselves (digits, brackets…) add nothing to the chart
      .filter(({ key, out }) => out !== key),
  )
}

/** Rows for the on-screen layout chart (4 rows: number, top, home, bottom). */
export const CHART: Record<Layout, { key: string; out: string }[][]> = {
  inscript: chartFor('inscript'),
  remington: chartFor('remington'),
}
