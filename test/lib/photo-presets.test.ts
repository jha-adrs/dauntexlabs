import { describe, it, expect } from 'vitest'
import { targetSize, checkOutput, setJfifDensity } from '@/lib/photo-fit'
import { fakeJpeg } from './fake-jpeg'
import { PHOTO_PRESETS, getPreset, cmToPx, uploadLabel, uploadFileName, specRow, type Upload } from '@/lib/photo-presets'

const ABSOLUTE = /never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?\b|no telemetry|ever leaves|runs entirely/i
const words = (s: string) => s.split(/\s+/).filter(Boolean).length
const exams = PHOTO_PRESETS.filter((p) => p.kind === 'exam')

// Values pinned to docs/superpowers/specs/2026-10-09-exam-form-research.md §1 (see the plan's "Spec corrections").
const IBPS = [
  { type: 'photo', px: [200, 230], kb: [20, 50] },
  { type: 'signature', px: [140, 60], kb: [10, 20] },
  { type: 'thumb', px: [240, 240], kb: [20, 50], dpi: 200 },
  { type: 'declaration', px: [800, 400], kb: [50, 100], dpi: 200 },
]
const EXPECT: Record<string, Partial<Upload>[]> = {
  'resize-image-to-20kb': [{ type: 'photo', kb: [10, 20] }],
  'resize-image-to-50kb': [{ type: 'photo', kb: [30, 50] }],
  'resize-image-to-100kb': [{ type: 'photo', kb: [60, 100] }],
  'increase-image-size-in-kb': [{ type: 'photo', kb: [50, 100] }],
  'ibps-photo-signature-size': IBPS,
  'sbi-photo-signature-size': IBPS,
  'ssc-signature-size': [{ type: 'signature', px: [472, 157], kb: [10, 20] }],
  'rrb-signature-size': [{ type: 'signature', px: [276, 157], kb: [30, 49], dpi: 200, whiteBg: true }],
  'upsc-photo-signature-size': [
    { type: 'photo', kb: [20, 200], whiteBg: true },
    { type: 'signature', px: [450, 500], kb: [20, 100] },
  ],
  'neet-photo-signature-size': [
    { type: 'photo', kb: [10, 200], whiteBg: true },
    { type: 'signature', kb: [10, 100] },
    { type: 'thumb', kb: [10, 200] },
    { type: 'thumb', kb: [10, 200] },
  ],
  'jee-main-photo-signature-size': [{ type: 'photo', kb: [10, 200], whiteBg: true }, { type: 'signature', kb: [10, 100] }],
  'cuet-photo-signature-size': [{ type: 'photo', kb: [10, 200] }, { type: 'signature', kb: [10, 50] }],
  'ctet-photo-signature-size': [{ type: 'photo', px: [276, 354], kb: [10, 100] }, { type: 'signature', px: [276, 118], kb: [3, 30] }],
  'tnpsc-photo-signature-size': [
    { type: 'photo', px: [130, 170], kb: [20, 50], dpi: 200, nameDate: { stripPx: 55 }, whiteBg: true },
    { type: 'signature', kb: [10, 20], dpi: 200 },
  ],
  'passport-photo-size': [{ type: 'photo', px: [630, 810], kb: [0, 1000] }],
  'pan-card-photo-signature-size': [{ type: 'photo', px: [197, 276], kb: [0, 20], dpi: 200 }, { type: 'signature', px: [354, 157], kb: [0, 10], dpi: 200 }],
  'indian-visa-photo-size': [{ type: 'photo', px: [600, 600], kb: [10, 300] }],
}

describe('PHOTO_PRESETS', () => {
  it('has exactly the 17 planned pages (advisor 2026-11-06), slugs unique', () => {
    expect(PHOTO_PRESETS.map((p) => p.slug).sort()).toEqual(Object.keys(EXPECT).sort())
  })
  it.each(Object.entries(EXPECT))('%s matches the research values', (slug, ups) => {
    const got = getPreset(slug)!.uploads.map(({ type, px, width, kb, dpi, nameDate, whiteBg }) => ({ type, px, width, kb, dpi, nameDate, whiteBg: whiteBg || undefined }))
    expect(got).toEqual(ups)
  })
  it.each(PHOTO_PRESETS)('$slug: sane ranges, keywords, copy and FAQ', (p) => {
    for (const u of p.uploads) {
      expect(u.kb[0]).toBeLessThan(u.kb[1])
      expect(u.kb[0]).toBeGreaterThanOrEqual(0)
      for (const n of [...(u.px ?? []), ...(u.width ? [u.width] : [])]) expect(n).toBeGreaterThan(0)
    }
    expect(p.keywords.length).toBeGreaterThanOrEqual(3)
    expect(p.faq.length).toBeGreaterThanOrEqual(3)
    expect(words(p.intro.join(' '))).toBeGreaterThanOrEqual(60)
    const all = [p.title, p.description, ...p.intro, ...p.uploads.map((u) => u.note ?? ''), ...p.faq.flatMap((f) => [f.q, f.a])].join(' ')
    expect(all).not.toMatch(ABSOLUTE)
  })
  it('titles and first intro paragraphs are unique (no swapped-number pages)', () => {
    expect(new Set(PHOTO_PRESETS.map((p) => p.title)).size).toBe(PHOTO_PRESETS.length)
    expect(new Set(PHOTO_PRESETS.map((p) => p.intro[0])).size).toBe(PHOTO_PRESETS.length)
  })
  it.each(exams)('$slug has an https source checked within the last 12 months', (p) => {
    expect(p.source?.url).toMatch(/^https?:\/\//)
    expect(p.source?.notice.length).toBeGreaterThan(5)
    const age = Date.now() - Date.parse(p.source!.checked)
    expect(age).toBeGreaterThanOrEqual(0)
    expect(age).toBeLessThan(366 * 24 * 3600 * 1000)
  })
  it('has 4 size pages and 13 exam/form pages', () => {
    expect(PHOTO_PRESETS).toHaveLength(17)
    expect(PHOTO_PRESETS.filter((p) => p.kind === 'size').map((p) => p.slug).sort()).toEqual([
      'increase-image-size-in-kb', 'resize-image-to-100kb', 'resize-image-to-20kb', 'resize-image-to-50kb',
    ])
  })
  it('passport: no invented KB range, explains ICAO sets none and forbids software alteration', () => {
    const p = getPreset('passport-photo-size')!
    expect(p.uploads[0].whiteBg).toBeFalsy()
    const text = JSON.stringify(p)
    expect(text).toMatch(/does not state a file-size limit/i)
    expect(text).not.toMatch(/sets no file-size limit/i)
    expect(text).toMatch(/unaltered by (computer )?software/i)
  })
  it('SSC page carries the signature-to-20kb wording and the 4 × 2 cm annexure note', () => {
    const p = getPreset('ssc-signature-size')!
    expect(p.keywords).toEqual(expect.arrayContaining(['resize signature to 20kb', 'signature resize 10 to 20 kb', 'signature resize 6cm x 2cm']))
    expect(p.uploads[0].note).toMatch(/4\.0 × 2\.0 cm/)
  })
  it('UPSC three-signature sheet stays inside 350–500 px both ways, even from a portrait photo', () => {
    const sig = getPreset('upsc-photo-signature-size')!.uploads[1]
    const [w, h] = targetSize(sig, 3024, 4032)
    for (const n of [w, h]) {
      expect(n).toBeGreaterThanOrEqual(350)
      expect(n).toBeLessThanOrEqual(500)
    }
    const bytes = setJfifDensity(fakeJpeg(60000), 200)
    expect(checkOutput(bytes, 450, 600, sig).find((c) => c.key === 'px')!.ok).toBe(false)
    expect(JSON.stringify(getPreset('upsc-photo-signature-size'))).not.toMatch(/350–500 px wide/)
  })
  it('hedges what the notices say instead of claiming what portals enforce', () => {
    const all = JSON.stringify(PHOTO_PRESETS)
    expect(all).not.toMatch(/the portal enforces/i)
    expect(all).not.toMatch(/which the portal checks/i)
  })
  it('explains live photo capture on the SSC and RRB pages', () => {
    for (const s of ['ssc-signature-size', 'rrb-signature-size']) expect(JSON.stringify(getPreset(s))).toMatch(/live/i)
  })
})

describe('helpers', () => {
  it('cmToPx at 200 dpi', () => {
    expect([3.5, 4.5, 1.5, 6, 2, 2.5].map((c) => cmToPx(c))).toEqual([276, 354, 118, 472, 157, 197])
  })
  it('labels and file names', () => {
    const neet = getPreset('neet-photo-signature-size')!
    expect(neet.uploads.map(uploadLabel)).toEqual(['Photo', 'Signature', 'Left-hand fingers and thumb', 'Right-hand fingers and thumb'])
    expect(neet.uploads.map((_, i) => uploadFileName(neet, i))).toEqual(['photo.jpg', 'signature.jpg', 'thumb-1.jpg', 'thumb-2.jpg'])
    expect(uploadLabel(getPreset('ibps-photo-signature-size')!.uploads[2])).toBe('Left thumb impression')
  })
  it('specRow formats pixels, size and DPI', () => {
    expect(specRow({ type: 'photo', px: [200, 230], kb: [20, 50] })).toEqual({ upload: 'Photo', pixels: '200 × 230 px', size: '20–50 KB', dpi: '200' })
    expect(specRow({ type: 'signature', width: 450, kb: [20, 100] }).pixels).toBe('450 px wide')
    expect(specRow({ type: 'photo', kb: [0, 20] }).size).toBe('up to 20 KB')
    expect(specRow({ type: 'photo', kb: [10, 200] }).pixels).toBe('Any (proportions kept)')
  })
})
