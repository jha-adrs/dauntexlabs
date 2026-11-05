# Exam & Form Photo Tools (batch 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (execution method chosen: **native** — the controller runs the tasks, dispatching parallel builder subagents for the independent new-file tasks in each wave, then one fresh final reviewer on the whole branch). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One in-browser engine that turns any photo or signature into a JPG that passes an Indian exam/form portal's checks (pixels, KB range, JPG, DPI), exposed as 20 programmatic `/photo/<slug>/` pages, a `/photo/` hub and one registry tool `exam-photo-resizer`.

**Architecture:** Pure maths and byte surgery in `lib/photo-fit.ts` (canvas encode passed in as a function, so jsdom tests run it); all page data in `lib/photo-presets.ts` (same pattern as `PAIRS` in `lib/conversions.ts`); one client component `components/photo/PhotoFitter.tsx` (+ `FitSection.tsx` per upload) lazy-mounted by `PhotoFitterMount.tsx` the way `components/convert/ConvertImage.tsx` mounts `ImageConverter`; a server route `app/photo/[slug]/page.tsx` shaped like `app/convert/[slug]/page.tsx`; shared-file wiring (registry, ToolMount, tool-content, sitemap, hubs, footer, privacy canaries) last.

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, native Canvas (`toBlob('image/jpeg', q)`), Vitest + RTL (jsdom), Playwright (real Chromium). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-05-exam-photo-tools-design.md` (research data: `docs/superpowers/specs/2026-10-09-exam-form-research.md`)

## Global Constraints

- No network in tool logic: no `fetch`/XHR/WebSocket/`sendBeacon`/`EventSource` (`test/privacy/static-guard.test.ts` must stay green).
- No user data (file names, typed name, date, image bytes) in the URL (path/query/hash), `document.title`, `localStorage`/`sessionStorage`, cookies or `console.*`. Download names are fixed: `photo.jpg`, `signature.jpg`, `thumb.jpg`, `declaration.jpg` (`<type>-<n>.jpg` when a preset has two uploads of one type).
- Every object URL is revoked on replace, remove and unmount. Output is always re-encoded through Canvas (drops EXIF/GPS).
- No new runtime dependencies. No `globals.css` changes: reuse `conv-table`, `conv-links`, `conv-chip`, `block`, `sec-head`, `faq`, `pill`, `toolbar`, `field-label`, `tool-console*`, kit components; inline styles only with Workbench tokens (`--accent`, `--danger`, `--line`, `--mute`, `--surface-soft`, `--radius-sm`). Never the legacy aliases (`--acid`, `--ink-*`, …).
- Shared First Load JS stays ~105 KB (within +1 KB of the Task 0 baseline). `PhotoFitter`, `FitSection`, `lib/photo-fit.ts` and `lib/photo-presets.ts` must only appear in per-route chunks — never imported by `components/HomeClient.tsx`, `SiteHeader`, `CategoryNav`, `Footer` or `app/layout.tsx`.
- Hedged privacy copy only: "designed to run in your browser", "processed on your device". Never "never uploaded", "nothing leaves", "no uploads", "runs entirely" (regex in `test/privacy/static-guard.test.ts` and `test/lib/tool-content.test.ts`).
- Every exam page shows: "Checked against: <notice>, <DD/MM/YYYY>. Confirm on the official notice before you submit."
- Sentence case everywhere, no uppercase/letter-spaced labels.
- KB rule (verbatim from spec): `min = minKb × 1024`, `max = maxKb × 1000`; if `min > max` use `[minKb × 1000, maxKb × 1000]`; target is the midpoint.
- Conventional commits; do not push.
- Parallel plans in flight: `docs/superpowers/plans/2026-11-05-color-pages.md` also edits `app/sitemap.ts` and `components/Footer.tsx`; the tool-upgrades plan intends to reuse this plan's quality bisection. Do not touch their scope; in Task 6 merge alongside their edits if they landed first. Keep `fitQuality`'s signature stable for that reuse.

## Spec corrections (made against the research doc)

The spec's preset table was re-checked against `2026-10-09-exam-form-research.md` §1. Task 2's pinned-value test encodes these resolutions:

1. **Quality search target.** The spec defines a midpoint target but has `fitQuality` aim for "highest quality ≤ max"; the research says "target the middle of the range, not the edges". Resolved: highest quality whose size is ≤ `target`; if even q 0.30 is above target but ≤ `max`, accept it.
2. **NEET impressions:** research says *left- and right-hand* finger + thumb impressions → two `thumb` uploads (labels "Left-hand fingers and thumb", "Right-hand fingers and thumb"), not one.
3. **IBPS/SBI declaration DPI:** research gives 200 DPI for the declaration as well as the thumb; spec only listed it on the thumb.
4. **TNPSC signature DPI 200** (research) — missing in spec. TNPSC photo whiteBg on (research: white background). Note: research's 3.5×4.5 cm and 130×170 px disagree at 200 DPI; the px values are used.
5. **SSC signature pixels:** spec gives none. Research: "about 6.0 × 2.0 cm" (annexure says 4.0 × 2.0). Using 6×2 cm at 200 DPI = **472×157 px** (matches the "signature resize 6cm x 2cm" query); the note states the contradiction.
6. **RRB signature:** "≥140×60" cannot be expressed as exact px and 140×60 cannot reach 30 KB without heavy padding. Using the 35×20 mm box at 200 DPI = **276×157 px** (≥ 140×60), 30–49 KB, whiteBg on (research: white background).
7. **UPSC signature** needs a hard 350–500 px width with free height → new optional `width?: number` on `Upload` (fixed width, height from the crop's proportions); value **450**. UPSC photo whiteBg on.
8. **PAN:** spec omitted the signature size. Research: photo 3.5×2.5 cm, signature 2×4.5 cm at 200 DPI, max only. Taken as portrait photo **197×276** and landscape signature **354×157**, `kb: [0, 20]` and `[0, 10]` (no minimum).
9. **Passport:** research says no KB limit is stated and the photo must be "unaltered by computer software". `kb: [20, 250]` is our own choice (stated in the note as not from the source); **whiteBg off** by default (the spec said white background — that is a shooting instruction, not a reason to alter the photo).
10. **Indian visa:** "square 350–1000 px" → **600×600**.
11. **NEET / JEE photo** whiteBg on (research: white background). CUET/CTET: not stated → off.
12. Type additions the spec needs but did not list: `Upload.label?`, `Upload.width?`, `PhotoPreset.intro: string[]` (unique worked-example copy per page — the spec's thin-content mitigation). DPI default when a preset sets none: `DEFAULT_DPI = 200`.

## Review Focus

1. **Source smaller than the target** (a 120×90 phone crop into an 800×400 declaration). Expect exact output px, no error. → Task 1 `cropRect` upscale test; Task 3 declaration flow uses the 120×90 mock image.
2. **Transparent PNG signature.** Expect a white, not black, background in the JPEG. → Task 7 e2e centre-pixel test.
3. **Stale result after an edit** (user moves zoom or toggles whitening after "Make file", then downloads). Expect the old result and its Download button to disappear. → Task 3 test.
4. **Bad KB/px input on size pages** (min ≥ max, blank, negative, 0 px). Expect a plain-words Notice and no Make, never a crash or a silently wrong file. → Task 3 test.
5. **Undecodable input** (iPhone HEIC in Chrome, a renamed PDF). Expect "Could not read that image…" with the HEIC hint, object URL revoked. → Task 3 test with an `Image` that fires `onerror`.

---

## Waves

| Wave | Tasks (parallel within a wave) | Touches shared files? |
|---|---|---|
| 0 | Task 0 baseline (controller) | no |
| 1 | Task 1 `photo-fit`, Task 2 `photo-presets` | no |
| 2 | Task 3 `PhotoFitter` | no |
| 3 | Task 4 `/photo/` pages, Task 5 registry tool component + content | no |
| 4 | Task 6 wiring, then Task 7 e2e + privacy + build gate | yes (sequential) |

Builder contract (Tasks 1–5): create only the files listed; RED first (run the new test, see it fail), then implement; before reporting run `npx vitest run <your test files>` and `npx tsc --noEmit`. Do **not** edit `lib/tools.ts`, `components/ToolMount.tsx`, `lib/tool-content.ts`, `app/sitemap.ts`, `lib/hubs.ts`, `components/Footer.tsx`, `app/globals.css` or `test/e2e/*`. Report files created, exported signatures, test counts.

---

### Task 0: Baseline

- [ ] **Step 1:** `mkdir -p .superpowers/sdd/2026-11-05-exam-photo && npm run build > .superpowers/sdd/2026-11-05-exam-photo/baseline-build.txt 2>&1`; record shared "First Load JS shared by all" (expect ~105 kB) and `grep -o '<loc>' out/sitemap.xml | wc -l`. Keep both numbers for Task 7.

---

### Task 1: Fit engine — `lib/photo-fit.ts`

**Files:**
- Create: `lib/photo-fit.ts`
- Create: `test/lib/fake-jpeg.ts` (test helper, reused by Task 3)
- Test: `test/lib/photo-fit.test.ts`

**Interfaces:**
- Consumes: `coverCrop` from `@/lib/stamp`. No import from `lib/photo-presets.ts` (runs in parallel with Task 2); `FitSpec` is structural, so Task 2's `Upload` satisfies it.
- Produces:
```ts
export const DEFAULT_DPI = 200
export const DEFAULT_MAX_SIDE = 1000
export type ByteBounds = { min: number; max: number; target: number }
export type Encode = (quality: number) => Promise<Blob>
export type FitResult =
  | { ok: true; bytes: Uint8Array; quality: number; width: number; height: number; padded: boolean; scaled: boolean }
  | { ok: false; reason: 'too-big' }
export type Check = { key: 'px' | 'kb' | 'jpg' | 'dpi'; ok: boolean; text: string }
export type FitSpec = { px?: [number, number]; width?: number; kb: [number, number]; dpi?: number }
export function cropRect(srcW: number, srcH: number, dstW: number, dstH: number, zoom: number, offsetX: number, offsetY: number): { sx: number; sy: number; sw: number; sh: number }
export function byteBounds(kb: [number, number]): ByteBounds
export function fitQuality(encode: Encode, bounds: ByteBounds): Promise<{ blob: Blob; quality: number } | { tooBig: true }>
export function padJpeg(bytes: Uint8Array, minBytes: number): Uint8Array
export function setJfifDensity(bytes: Uint8Array, dpi: number): Uint8Array
export function jfifDensity(bytes: Uint8Array): number | null
export function whiten(data: Uint8ClampedArray, strength: number): void
export function targetSize(u: { px?: [number, number]; width?: number }, srcW: number, srcH: number, maxSide?: number): [number, number]
export function fitToBounds(render: (w: number, h: number) => Encode, size: [number, number], bounds: ByteBounds, opts: { fixedPx: boolean; dpi: number }): Promise<FitResult>
export function checkOutput(bytes: Uint8Array, width: number, height: number, u: FitSpec): Check[]
// test/lib/fake-jpeg.ts
export function fakeJpeg(n: number): Uint8Array // structurally valid JPEG of exactly n bytes, n ≥ 26
```

- [ ] **Step 1: Write the test helper and failing tests**

`test/lib/fake-jpeg.ts`: SOI `FF D8` + JFIF APP0 (18 bytes: `FF E0 00 10 'JFIF' 00 01 01 00 00 01 00 01 00 00`) + `FF DA 00 02` + `n − 26` bytes of `0x55` + EOI `FF D9`.

`test/lib/photo-fit.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import {
  cropRect, byteBounds, fitQuality, padJpeg, setJfifDensity, jfifDensity,
  whiten, targetSize, fitToBounds, checkOutput, DEFAULT_DPI,
} from '@/lib/photo-fit'
import { coverCrop } from '@/lib/stamp'
import { fakeJpeg } from './fake-jpeg'

const blobOf = (n: number) => new Blob([fakeJpeg(Math.max(26, Math.round(n)))], { type: 'image/jpeg' })
const encoder = (size: (q: number) => number) => vi.fn(async (q: number) => blobOf(size(q)))

/** Marker + declared length of every segment before SOS. */
function segments(b: Uint8Array) {
  const out: { marker: number; len: number }[] = []
  let i = 2
  while (i < b.length && b[i] === 0xff && b[i + 1] !== 0xda) {
    const len = (b[i + 2] << 8) | b[i + 3]
    out.push({ marker: b[i + 1], len })
    i += 2 + len
  }
  return out
}

describe('cropRect', () => {
  it('equals coverCrop at zoom 1, centred', () => {
    expect(cropRect(1200, 800, 200, 230, 1, 0, 0)).toEqual(coverCrop(1200, 800, 200, 230))
  })
  it('zooms in and moves to the edges with offsets', () => {
    expect(cropRect(1200, 800, 200, 230, 2, 0, 0)).toEqual({ sx: 426, sy: 200, sw: 348, sh: 400 })
    expect(cropRect(1200, 800, 200, 230, 2, 1, -1)).toEqual({ sx: 852, sy: 0, sw: 348, sh: 400 })
    expect(cropRect(1200, 800, 200, 230, 2, -1, 1)).toEqual({ sx: 0, sy: 400, sw: 348, sh: 400 })
  })
  it('clamps zoom < 1 and offsets outside −1..1', () => {
    expect(cropRect(1200, 800, 200, 230, 0.5, 3, -3)).toEqual(cropRect(1200, 800, 200, 230, 1, 1, -1))
  })
  it('upscales a source smaller than the target', () => {
    expect(cropRect(120, 90, 800, 400, 1, 0, 0)).toEqual({ sx: 0, sy: 15, sw: 120, sh: 60 })
  })
})

describe('byteBounds', () => {
  it('uses 1024 for the floor and 1000 for the ceiling', () => {
    expect(byteBounds([20, 50])).toEqual({ min: 20480, max: 50000, target: 35240 })
  })
  it('falls back to 1000 both ways when the range collapses', () => {
    expect(byteBounds([30, 30])).toEqual({ min: 30000, max: 30000, target: 30000 })
  })
  it('handles a max-only limit', () => {
    expect(byteBounds([0, 20])).toEqual({ min: 0, max: 20000, target: 10000 })
  })
})

describe('fitQuality', () => {
  it('finds the highest quality at or under the midpoint in ≤ 8 encodes', async () => {
    const enc = encoder((q) => 1000 + 100000 * q)
    const r = await fitQuality(enc, byteBounds([20, 50]))
    if ('tooBig' in r) throw new Error('expected a fit')
    expect(r.blob.size).toBeLessThanOrEqual(35240)
    expect(r.quality).toBeGreaterThanOrEqual(0.33)
    expect(enc.mock.calls.length).toBeLessThanOrEqual(8)
  })
  it('returns q 0.95 at once when the file is already small', async () => {
    const enc = encoder(() => 3000)
    const r = await fitQuality(enc, byteBounds([10, 20]))
    expect(r).toMatchObject({ quality: 0.95 })
    expect(enc).toHaveBeenCalledTimes(1)
  })
  it('accepts q 0.30 above the midpoint when it is still under max', async () => {
    const r = await fitQuality(encoder((q) => 40000 + 10000 * q), byteBounds([20, 50]))
    expect(r).toMatchObject({ quality: 0.3 })
  })
  it('reports too big when q 0.30 is over max', async () => {
    expect(await fitQuality(encoder(() => 1e6), byteBounds([20, 50]))).toEqual({ tooBig: true })
  })
})

describe('padJpeg', () => {
  it('pads with COM segments after APP0 and keeps the image data intact', () => {
    const b = fakeJpeg(126)
    const out = padJpeg(b, 20480)
    expect(out.length).toBeGreaterThanOrEqual(20480)
    expect(out.length).toBeLessThanOrEqual(20483)
    expect([out[0], out[1], out[2], out[3]]).toEqual([0xff, 0xd8, 0xff, 0xe0])
    expect([out[20], out[21]]).toEqual([0xff, 0xfe])
    expect([out.at(-2), out.at(-1)]).toEqual([0xff, 0xd9])
    expect(Array.from(out.slice(out.length - (b.length - 20)))).toEqual(Array.from(b.slice(20)))
  })
  it('splits into several segments, none longer than 65535', () => {
    const segs = segments(padJpeg(fakeJpeg(126), 200000)).filter((s) => s.marker === 0xfe)
    expect(segs.length).toBe(4)
    for (const s of segs) expect(s.len).toBeLessThanOrEqual(65535)
  })
  it('returns the same bytes when already big enough', () => {
    const b = fakeJpeg(5000)
    expect(Array.from(padJpeg(b, 4000))).toEqual(Array.from(b))
  })
  it('inserts right after SOI when there is no APP0', () => {
    const noApp0 = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x55, 0xff, 0xd9])
    const out = padJpeg(noApp0, 100)
    expect([out[2], out[3]]).toEqual([0xff, 0xfe])
  })
})

describe('setJfifDensity / jfifDensity', () => {
  it('rewrites an existing APP0 without mutating the input', () => {
    const b = fakeJpeg(100)
    const out = setJfifDensity(b, 200)
    expect(out.length).toBe(b.length)
    expect(Array.from(out.slice(13, 18))).toEqual([1, 0, 200, 0, 200])
    expect(jfifDensity(out)).toBe(200)
    expect(b[13]).toBe(0)
  })
  it('inserts an APP0 when missing', () => {
    const noApp0 = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x55, 0xff, 0xd9])
    const out = setJfifDensity(noApp0, 300)
    expect(out.length).toBe(noApp0.length + 18)
    expect([out[2], out[3]]).toEqual([0xff, 0xe0])
    expect(jfifDensity(out)).toBe(300)
  })
  it('leaves non-JPEG bytes alone and reads null from them', () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47])
    expect(Array.from(setJfifDensity(png, 200))).toEqual(Array.from(png))
    expect(jfifDensity(png)).toBeNull()
  })
})

describe('whiten', () => {
  const px = () => Uint8ClampedArray.from([225, 225, 225, 255, 40, 40, 40, 255, 250, 180, 180, 255, 230, 230, 230, 128])
  it('does nothing at strength 0', () => {
    const d = px()
    whiten(d, 0)
    expect(Array.from(d)).toEqual(Array.from(px()))
  })
  it('pushes light, grey pixels to white and keeps dark and coloured ones', () => {
    const d = px()
    whiten(d, 50)
    expect(Array.from(d)).toEqual([255, 255, 255, 255, 40, 40, 40, 255, 250, 180, 180, 255, 255, 255, 255, 128])
  })
})

describe('targetSize', () => {
  it('uses fixed px, fixed width, or the source capped at maxSide', () => {
    expect(targetSize({ px: [200, 230] }, 4000, 3000)).toEqual([200, 230])
    expect(targetSize({ width: 450 }, 900, 600)).toEqual([450, 300])
    expect(targetSize({}, 4000, 3000)).toEqual([1000, 750])
    expect(targetSize({}, 640, 480)).toEqual([640, 480])
  })
})

describe('fitToBounds', () => {
  const render = (size: (w: number, h: number, q: number) => number) =>
    vi.fn((w: number, h: number) => async (q: number) => blobOf(size(w, h, q)))

  it('lands in range and writes the DPI', async () => {
    const r = await fitToBounds(render(() => 30000), [200, 230], byteBounds([20, 50]), { fixedPx: true, dpi: 200 })
    if (!r.ok) throw new Error('expected ok')
    expect(r.bytes.length).toBeGreaterThanOrEqual(20480)
    expect(r.bytes.length).toBeLessThanOrEqual(50000)
    expect(jfifDensity(r.bytes)).toBe(200)
    expect(r).toMatchObject({ width: 200, height: 230, padded: false, scaled: false })
  })
  it('pads a file that stays under the minimum at q 0.95', async () => {
    const r = await fitToBounds(render(() => 2000), [200, 230], byteBounds([20, 50]), { fixedPx: true, dpi: 200 })
    expect(r).toMatchObject({ ok: true, padded: true })
    if (r.ok) expect(r.bytes.length).toBeGreaterThanOrEqual(20480)
  })
  it('fails for fixed px that cannot get under max', async () => {
    const rd = render(() => 1e6)
    expect(await fitToBounds(rd, [200, 230], byteBounds([20, 50]), { fixedPx: true, dpi: 200 })).toEqual({ ok: false, reason: 'too-big' })
    expect(rd).toHaveBeenCalledTimes(1)
  })
  it('scales free-size output down by 0.85 per step until it fits', async () => {
    const r = await fitToBounds(render((w, h, q) => w * h * (0.2 + q) * 0.1), [1000, 750], byteBounds([5, 10]), { fixedPx: false, dpi: 200 })
    if (!r.ok) throw new Error('expected ok')
    expect(r.scaled).toBe(true)
    expect(r.width).toBeLessThan(1000)
    expect(r.width / r.height).toBeCloseTo(4 / 3, 1)
    expect(r.bytes.length).toBeLessThanOrEqual(10000)
  })
  it('gives up after 6 scale steps', async () => {
    const rd = render(() => 1e7)
    expect(await fitToBounds(rd, [1000, 750], byteBounds([5, 10]), { fixedPx: false, dpi: 200 })).toEqual({ ok: false, reason: 'too-big' })
    expect(rd).toHaveBeenCalledTimes(7)
  })
})

describe('checkOutput', () => {
  it('passes all four checks for a good file', () => {
    const bytes = setJfifDensity(fakeJpeg(30000), 200)
    const c = checkOutput(bytes, 200, 230, { px: [200, 230], kb: [20, 50] })
    expect(c.map((x) => [x.key, x.ok])).toEqual([['px', true], ['kb', true], ['jpg', true], ['dpi', true]])
    expect(c.find((x) => x.key === 'kb')!.text).toMatch(/KB/)
  })
  it('flags wrong pixels, size and DPI', () => {
    const c = checkOutput(fakeJpeg(60000), 201, 230, { px: [200, 230], kb: [20, 50], dpi: 300 })
    expect(c.filter((x) => !x.ok).map((x) => x.key)).toEqual(['px', 'kb', 'dpi'])
  })
  it('uses DEFAULT_DPI when the upload sets none', () => {
    const c = checkOutput(setJfifDensity(fakeJpeg(30000), DEFAULT_DPI), 640, 480, { kb: [20, 50] })
    expect(c.every((x) => x.ok)).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run test/lib/photo-fit.test.ts` → FAIL (`Cannot find module '@/lib/photo-fit'`).

- [ ] **Step 3: Implement `lib/photo-fit.ts`**

Decisions the tests leave open:
- `cropRect`: `z = max(1, zoom)`, offsets clamped to −1..1; `base = coverCrop(...)`; `sw = round(base.sw / z)`, `sh = round(base.sh / z)`; `sx = round((srcW − sw) / 2 × (1 + ox))`, same for `sy`.
- `fitQuality`: encode 0.95 → if ≤ target return. Encode 0.30 → if > max return `{ tooBig: true }`; if > target (but ≤ max) return it. Otherwise bisect `lo = 0.30` (fits) / `hi = 0.95` 6 times, keeping the best fitting blob; return quality rounded to 2 dp.
- `padJpeg`: insertion point = after APP0 when bytes 2–3 are `FF E0`, else 2. `need = minBytes − length`; while `need > 0`: segment total `s = clamp(need, 4, 65537)`, emit `FF FE`, length `s − 2` (big-endian), `s − 4` bytes of `0x20`. Build one new `Uint8Array`.
- `setJfifDensity`: valid only if bytes start `FF D8`; APP0 present when bytes 2–3 = `FF E0` and 6–10 = `"JFIF\0"`; write units at 13, X density 14–15, Y density 16–17. Missing APP0 → insert the 18-byte APP0 after SOI. Always return a copy.
- `jfifDensity`: units must be 1 and X = Y; else `null`.
- `whiten`: `f = strength / 100`; for each pixel `mx = max(r,g,b)`, `mn = min(r,g,b)`; if `(mx + mn) / 510 ≥ 1 − 0.35 f` and `mx − mn ≤ 64 f` set r,g,b = 255. Alpha untouched. (strength 50 → lightness ≥ 0.825, chroma ≤ 32.)
- `targetSize`: px → px; width → `[width, round(width × srcH / srcW)]`; else scale `min(1, maxSide / max(srcW, srcH))`, rounded.
- `fitToBounds`: loop step 0..6 (fixedPx: only step 0): `w = round(size[0] × 0.85^step)`, same h; `fitQuality(render(w, h), bounds)`; on fit: `bytes = setJfifDensity(new Uint8Array(await blob.arrayBuffer()), dpi)`; pad to `bounds.min` if short; `scaled = step > 0`.
- `checkOutput` texts: px `"200 × 230 px"`; kb `"34.4 KB (allowed 20–50 KB)"` / `"up to 20 KB"` when min is 0, KB shown as `bytes / 1024` to 1 dp; jpg `"JPG"`; dpi `"200 DPI"`. px ok when `px` matches, or `width` matches, or neither is set.

- [ ] **Step 4: Run to verify pass** — `npx vitest run test/lib/photo-fit.test.ts` → all PASS; `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit** — `git add lib/photo-fit.ts test/lib/photo-fit.test.ts test/lib/fake-jpeg.ts && git commit -m "feat(photo): fit engine for KB ranges, padding and JFIF density"`

---

### Task 2: Presets — `lib/photo-presets.ts`

**Files:**
- Create: `lib/photo-presets.ts`
- Test: `test/lib/photo-presets.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
```ts
export type UploadType = 'photo' | 'signature' | 'thumb' | 'declaration'
export type Upload = {
  type: UploadType
  label?: string                 // overrides the type label
  px?: [w: number, h: number]    // exact output pixels
  width?: number                 // fixed width, height from the crop's proportions (UPSC signature)
  kb: [min: number, max: number]
  dpi?: number
  nameDate?: { stripPx: number }
  whiteBg?: boolean
  note?: string
}
export type PhotoPreset = {
  slug: string
  kind: 'size' | 'exam'
  title: string
  description: string
  keywords: string[]
  intro: string[]                // 1–3 paragraphs incl. a worked example unique to the page
  uploads: Upload[]
  source?: { url: string; notice: string; checked: string } // ISO date; required for 'exam'
  faq: { q: string; a: string }[]
}
export const PHOTO_PRESETS: PhotoPreset[]
export function getPreset(slug: string): PhotoPreset | undefined
export function cmToPx(cm: number, dpi?: number): number   // default 200
export function uploadLabel(u: Upload): string               // label ?? Photo | Signature | Thumb impression | Handwritten declaration
export function uploadFileName(p: PhotoPreset, i: number): string // 'photo.jpg'; 'thumb-1.jpg'/'thumb-2.jpg' when the type repeats
export function specRow(u: Upload): { upload: string; pixels: string; size: string; dpi: string }
```

- [ ] **Step 1: Write the failing test** — `test/lib/photo-presets.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
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
  'resize-image-to-10kb': [{ type: 'photo', kb: [5, 10] }],
  'resize-image-to-20kb': [{ type: 'photo', kb: [10, 20] }],
  'resize-image-to-50kb': [{ type: 'photo', kb: [30, 50] }],
  'resize-image-to-100kb': [{ type: 'photo', kb: [60, 100] }],
  'resize-image-to-200kb': [{ type: 'photo', kb: [120, 200] }],
  'resize-signature-to-20kb': [{ type: 'signature', px: [140, 60], kb: [10, 20] }],
  'increase-image-size-in-kb': [{ type: 'photo', kb: [50, 100] }],
  'ibps-photo-signature-size': IBPS,
  'sbi-photo-signature-size': IBPS,
  'ssc-signature-size': [{ type: 'signature', px: [472, 157], kb: [10, 20] }],
  'rrb-signature-size': [{ type: 'signature', px: [276, 157], kb: [30, 49], dpi: 200, whiteBg: true }],
  'upsc-photo-signature-size': [
    { type: 'photo', kb: [20, 200], whiteBg: true },
    { type: 'signature', width: 450, kb: [20, 100] },
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
  'passport-photo-size': [{ type: 'photo', px: [630, 810], kb: [20, 250] }],
  'pan-card-photo-signature-size': [{ type: 'photo', px: [197, 276], kb: [0, 20], dpi: 200 }, { type: 'signature', px: [354, 157], kb: [0, 10], dpi: 200 }],
  'indian-visa-photo-size': [{ type: 'photo', px: [600, 600], kb: [10, 300] }],
}

describe('PHOTO_PRESETS', () => {
  it('has exactly the 20 planned pages, slugs unique', () => {
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
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run test/lib/photo-presets.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement `lib/photo-presets.ts`**

Data: exactly `EXPECT` above, built with `cmToPx` where the source is in cm (CTET, SSC, RRB, PAN). Additional fields:
- `label`: IBPS/SBI thumb "Left thumb impression"; NEET thumbs "Left-hand fingers and thumb" / "Right-hand fingers and thumb"; UPSC signature "Signature (three on one sheet)".
- `source`: copy each URL verbatim from the research doc §1 table; `notice` = the notice name there (e.g. "IBPS CRP RRB-XIV guideline annexure, Aug 2025", "SBI JA 2025 Advt CRPD/CR/2025-26/06", "SSC CGL 2026 notice HQ-C11018/1/2026-C-1", "RRB CEN 09/2025 (updated 30-01-2026)", "UPSC CSE 2026 notice 05/2026-CSE and upsconline photo/signature instructions", "NEET UG 2026 information bulletin", "JEE Main 2026 information bulletin", "CUET UG 2026 information bulletin", "CTET Sept 2026 information bulletin", "TNPSC notification 16/2025 (Group VA)", "Passport Seva ICAO photo guidelines", "Protean (NSDL) PAN InstructionDSC", "Indian visa VSS_IMAGE.pdf"); `checked: '2026-10-09'`.
- `note` (one line each, from research): IBPS/SBI photo "IBPS also takes a live photo during the application."; SBI declaration — the SBI text adds "Date of Birth" and "The signature, photograph and left thumb impression is of mine" (quote both declaration texts from research §1 in the IBPS/SBI declaration notes); SSC signature "Your photo is captured live on the SSC portal, so only the signature is uploaded. The notice says about 6.0 × 2.0 cm in one place and 4.0 × 2.0 cm in its annexure; this uses 6.0 × 2.0 cm."; RRB "The photo is captured live (CEN 09/2025 §16.4). Sign in black ink, cursive, not in capitals."; UPSC signature "Sign three times, one under another, on plain white paper and photograph the sheet. UPSC also takes a live photo at the exam centre and matches it with this one."; UPSC photo "Face should cover at least 75% of the photo."; NEET thumbs "Make one file for each hand."; NEET/JEE photo "Face should cover about 80% of the photo with both ears visible."; TNPSC photo "The date must be on or after the notification date. No selfies."; passport "Passport Seva's guideline sets no file-size limit; 20–250 KB is our choice. It asks for a photo unaltered by software, so shoot against a white wall rather than whitening."; PAN "Only a maximum is set."; visa "Must be square, 350–1000 px."
- Copy: size-page titles carry "compress", e.g. "Resize image to 20 KB (compress photo to 20 KB)"; exam titles like "IBPS photo and signature size 2026: resizer". Each `intro` has a worked example with that page's numbers (e.g. "a 3 MB phone photo becomes a 200 × 230 px JPG of about 35 KB"). 3–5 FAQs each, hedged ("processed on your device").

- [ ] **Step 4: Run to verify pass** — `npx vitest run test/lib/photo-presets.test.ts` → PASS; `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit** — `git add lib/photo-presets.ts test/lib/photo-presets.test.ts && git commit -m "feat(photo): exam and size presets from the 2026 research"`

---

### Task 3: UI — `PhotoFitter`, `FitSection`, `PhotoFitterMount`

**Files:**
- Create: `components/photo/PhotoFitter.tsx`, `components/photo/FitSection.tsx`, `components/photo/PhotoFitterMount.tsx`
- Test: `test/tools/PhotoFitter.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`cropRect`, `byteBounds`, `fitToBounds`, `targetSize`, `whiten`, `checkOutput`, `DEFAULT_DPI`), Task 2 (`getPreset`, `uploadLabel`, `uploadFileName`, types), `layoutStamp`, `fitText`, `formatDateIN` from `@/lib/stamp`; kit `FileDrop, FilePreview, Field, TextInput, Toggle, Button, Notice, downloadBlob`.
- Produces:
```ts
// PhotoFitter.tsx ('use client')
export default function PhotoFitter({ preset }: { preset?: string }): JSX.Element  // default 'resize-image-to-50kb'
// FitSection.tsx ('use client')
export default function FitSection(props: { upload: Upload; fileName: string; label: string }): JSX.Element
// PhotoFitterMount.tsx ('use client') — dynamic(() => import('./PhotoFitter'), { ssr: false, loading }) like ConvertImage.tsx
export default function PhotoFitterMount({ preset }: { preset: string }): JSX.Element
```

UI contract (tests and e2e rely on these exact strings):
- Each upload renders `<section aria-label={label}>` with a heading of the label, its `note` in muted text, a `FileDrop` (`accept="image/*"`, hint "JPG · PNG · WebP — processed on your device").
- After load: `FilePreview`; a live preview `<canvas aria-label="Output preview">` at the target size; range inputs with labels "Zoom" (1–3, step 0.05), "Move left/right" and "Move up/down" (−1..1, step 0.02); `Toggle` "Whiten background" (default `upload.whiteBg`), and when on, range "Whitening strength" (0–100, default 50); for `type === 'photo'` a `Toggle` "Name and date strip" (default `!!upload.nameDate`) showing `TextInput` placeholder "Name as on the form" and `<input type="date">` (default today); strip height = `nameDate.stripPx` or 18 % of height (via `layoutStamp({ width, height, stripPct: stripPx * 100 / height })`).
- Button "Make file" → `fitToBounds`. Result: `<img alt="Result">`, text "`W × H px · NN.N KB`", `<ul aria-label="Checks">` with one `<li data-ok="true|false">` per `Check` ("✓ " / "✗ " + text), Notice (info) "Padded with blank bytes to reach the minimum size; the picture is unchanged." when padded, "Scaled down to W × H px to fit." when scaled, and `Button` "Download <fileName>" → `downloadBlob(bytes, fileName, 'image/jpeg')`.
- Any change to the file, crop, toggles, name, date or (size pages) KB/px inputs clears the result and revokes its URL.
- Errors (Notice kind="error"): non-image → "Please choose an image file (JPG, PNG or WebP)."; decode failure → "Could not read that image. iPhone HEIC photos need converting to JPG first."; fixed px too big → "This file can’t get under {upload.kb[1]} KB at {w} × {h} px. Try a plainer background or zoom in closer."; encode throw → "Could not create the JPEG in this browser."
- Size pages (`kind === 'size'`): a toolbar above the sections with `Field`s "Width (px)", "Height (px)" (blank = keep proportions; both required to fix px), "Min KB", "Max KB" prefilled from the preset; invalid (min ≥ max, negative, non-numeric, px < 20 or > 4000) → Notice "Check the sizes: minimum KB must be below maximum KB, and pixels 20–4000." and the Make file buttons are disabled. The effective `Upload` passed down is the preset upload with those overrides; `fixedPx` = px or width set.
- Render function: white fill, `drawImage` with `cropRect` (or full image when no px/width: crop aspect = target aspect), whitening on the photo box via `getImageData`/`whiten`/`putImageData` (skip if `getImageData` returns nothing — jsdom stub), strip text drawn like `PhotoDateStamp.paint`, then `canvas.toBlob(cb, 'image/jpeg', q)` per quality.

- [ ] **Step 1: Write the failing test** — `test/tools/PhotoFitter.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import PhotoFitter from '@/components/photo/PhotoFitter'
import { jfifDensity } from '@/lib/photo-fit'
import { fakeJpeg } from '../lib/fake-jpeg'

// Canvas is stubbed in test/setup.ts; here toBlob returns a structurally valid JPEG whose
// size we control, so the engine's search/pad/DPI paths run for real. Image mock is 120×90.
let size: (q: number) => number = (q) => 30000 * q
const original = HTMLCanvasElement.prototype.toBlob
beforeEach(() => {
  size = (q) => 30000 * q
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string, q = 0.92) {
    cb(new Blob([fakeJpeg(Math.max(26, Math.round(size(q))))], { type: type ?? 'image/png' }))
  }
})
afterEach(() => { HTMLCanvasElement.prototype.toBlob = original; vi.restoreAllMocks() })

const jpg = (name: string) => new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: 'image/jpeg' })
const section = (name: string) => screen.getByRole('region', { name })
async function load(name: string, file = jpg('me.jpg')) {
  fireEvent.change(section(name).querySelector('input[type="file"]')!, { target: { files: [file] } })
  await within(section(name)).findByText(file.name)
}

describe('PhotoFitter', () => {
  it('renders one section per IBPS upload', () => {
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    for (const n of ['Photo', 'Signature', 'Left thumb impression', 'Handwritten declaration']) expect(section(n)).toBeInTheDocument()
  })

  it('makes an in-range 200×230 JPG at 200 DPI and downloads photo.jpg', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Make file' }))
    const checks = await within(section('Photo')).findByRole('list', { name: 'Checks' })
    expect([...checks.querySelectorAll('li')].map((li) => li.dataset.ok)).toEqual(['true', 'true', 'true', 'true'])
    expect(within(section('Photo')).getByText(/200 × 230 px ·/)).toBeInTheDocument()
    spy.mockClear()
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Download photo.jpg' }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    const blob = spy.mock.calls[0][0] as Blob
    expect(blob.type).toBe('image/jpeg')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect(bytes.length).toBeGreaterThanOrEqual(20480)
    expect(bytes.length).toBeLessThanOrEqual(50000)
    expect(jfifDensity(bytes)).toBe(200)
  })

  it('upscales a small source into the 800×400 declaration', async () => {
    size = () => 70000
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Handwritten declaration')
    fireEvent.click(within(section('Handwritten declaration')).getByRole('button', { name: 'Make file' }))
    expect(await within(section('Handwritten declaration')).findByText(/800 × 400 px ·/)).toBeInTheDocument()
  })

  it('pads a tiny file up to the minimum and says so', async () => {
    size = () => 2000
    render(<PhotoFitter preset="increase-image-size-in-kb" />)
    await load('Photo')
    fireEvent.click(screen.getByRole('button', { name: 'Make file' }))
    expect(await screen.findByText(/Padded with blank bytes/)).toBeInTheDocument()
  })

  it('explains a fixed-size file that cannot get small enough', async () => {
    size = () => 1e6
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Make file' }))
    expect(await screen.findByText(/can’t get under 50 KB at 200 × 230 px/)).toBeInTheDocument()
  })

  it('clears a stale result when the crop changes', async () => {
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Make file' }))
    await within(section('Photo')).findByRole('list', { name: 'Checks' })
    fireEvent.change(within(section('Photo')).getByLabelText('Zoom'), { target: { value: '1.5' } })
    expect(within(section('Photo')).queryByRole('button', { name: 'Download photo.jpg' })).toBeNull()
  })

  it('rejects non-images and undecodable images in plain words', async () => {
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } })
    expect(await screen.findByText('Please choose an image file (JPG, PNG or WebP).')).toBeInTheDocument()
    const Real = globalThis.Image
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    globalThis.Image = class { onload: (() => void) | null = null; onerror: (() => void) | null = null; set src(_v: string) { setTimeout(() => this.onerror?.(), 0) } } as unknown as typeof Image
    try {
      fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [jpg('IMG_1.heic')] } })
      expect(await screen.findByText(/Could not read that image\. iPhone HEIC/)).toBeInTheDocument()
      expect(revoke).toHaveBeenCalled()
    } finally { globalThis.Image = Real }
  })

  it('size pages expose px and KB inputs and block bad ranges', () => {
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    for (const l of ['Width (px)', 'Height (px)', 'Min KB', 'Max KB']) expect(screen.getByText(l)).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '25' } })
    expect(screen.getByText(/minimum KB must be below maximum KB/)).toBeInTheDocument()
  })

  it('exam pages have no free size inputs; TNPSC turns the name strip on', async () => {
    render(<PhotoFitter preset="tnpsc-photo-signature-size" />)
    expect(screen.queryByText('Min KB')).toBeNull()
    await load('Photo')
    expect(within(section('Photo')).getByPlaceholderText('Name as on the form')).toBeInTheDocument()
    expect((section('Photo').querySelector('input[type="date"]') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('revokes the image URL when the file is removed', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Remove file' }))
    expect(revoke).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run test/tools/PhotoFitter.test.tsx` → FAIL (module not found).
- [ ] **Step 3: Implement** the three files per the UI contract above. Use `PhotoDateStamp.tsx`'s `load`/`release`/`urls` ref pattern for object URLs and its strip-drawing code for the name/date strip.
- [ ] **Step 4: Run to verify pass** — `npx vitest run test/tools/PhotoFitter.test.tsx test/privacy/static-guard.test.ts` → PASS; `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `git add components/photo test/tools/PhotoFitter.test.tsx && git commit -m "feat(photo): PhotoFitter UI with crop, whitening, name strip and checklist"`

---

### Task 4: Pages — `/photo/<slug>/` and `/photo/`

**Files:**
- Create: `app/photo/[slug]/page.tsx`, `app/photo/page.tsx`
- Test: `test/app/PhotoPage.test.tsx`

**Interfaces:**
- Consumes: Task 2 (`PHOTO_PRESETS`, `getPreset`, `specRow`, `uploadLabel`), Task 3 (`PhotoFitterMount`), `formatDateIN`, `SiteHeader`, `Footer`, `JsonLd`.
- Produces: `generateStaticParams(): { slug: string }[]`, `generateMetadata({ params })`, `dynamicParams = false`, default `PhotoPage({ params })` — same shapes as `app/convert/[slug]/page.tsx`; hub default export `PhotoHub()` + `metadata` (title "Photo and signature resizer for exam forms", canonical `/photo/`).

Page layout (copy `app/convert/[slug]/page.tsx` structure and classes): crumbs "All tools › Photo › {title}"; `tool-head` cat "India"; `<h1>{title}</h1>`; lede = description; pills "Runs on your device", "Free", "No sign-up"; `tool-console` with `<PhotoFitterMount preset={slug} />`; for exams a `block` "Upload specs" using the `conv-table` role-table markup with columns Upload / Pixels / File size / DPI (one row per `specRow`), then `<p>` "Checked against: <a href={source.url} rel="nofollow noopener noreferrer" target="_blank">{notice}</a>, {formatDateIN(checked)}. Confirm on the official notice before you submit."; `block` "About" with `intro`; FAQ `details.faq`; related `conv-links`: same-kind presets (max 6), "All photo sizes →" `/photo/`, "Exam Photo & Signature Resizer →" `/tools/exam-photo-resizer/`. JSON-LD: BreadcrumbList + FAQPage. Hub: two `block`s "Resize to a file size" (kind size) and "Exam and form sizes" (kind exam) as `conv-chip` links, intro paragraph (hedged), `CollectionPage` JSON-LD whose `mainEntity` is an `ItemList` of every preset.

- [ ] **Step 1: Write the failing test** — `test/app/PhotoPage.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/photo/PhotoFitterMount', () => ({
  default: ({ preset }: { preset: string }) => <div data-testid="fitter">{preset}</div>,
}))

import PhotoPage, { generateMetadata, generateStaticParams } from '@/app/photo/[slug]/page'
import PhotoHub, { metadata as hubMeta } from '@/app/photo/page'
import { PHOTO_PRESETS, getPreset } from '@/lib/photo-presets'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })
const lds = (c: HTMLElement) => [...c.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!))

describe('/photo/[slug]', () => {
  it('pre-renders every preset', () => {
    expect(generateStaticParams()).toHaveLength(PHOTO_PRESETS.length)
  })
  it('bakes title and canonical', async () => {
    const m = await generateMetadata(params('ibps-photo-signature-size'))
    expect(m.title).toBe(getPreset('ibps-photo-signature-size')!.title)
    expect(m.alternates?.canonical).toBe('/photo/ibps-photo-signature-size/')
  })
  it('exam page: fitter, spec table, checked line, FAQ JSON-LD', async () => {
    const p = getPreset('ibps-photo-signature-size')!
    const { container } = render(await PhotoPage(params(p.slug)))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(p.title)
    expect(screen.getByTestId('fitter')).toHaveTextContent(p.slug)
    expect(screen.getAllByRole('row')).toHaveLength(p.uploads.length + 1)
    expect(screen.getByText('200 × 230 px')).toBeInTheDocument()
    expect(container.textContent).toMatch(/Checked against: .*09\/10\/2026\. Confirm on the official notice before you submit\./)
    expect(container.querySelector(`a[href="${p.source!.url}"]`)).not.toBeNull()
    const faq = lds(container).find((l) => l['@type'] === 'FAQPage')
    expect(faq.mainEntity).toHaveLength(p.faq.length)
    expect(lds(container).find((l) => l['@type'] === 'BreadcrumbList')).toBeTruthy()
  })
  it('size page has no spec table or checked line', async () => {
    const { container } = render(await PhotoPage(params('resize-image-to-20kb')))
    expect(container.textContent).not.toMatch(/Checked against/)
    expect(screen.queryAllByRole('row')).toHaveLength(0)
  })
})

describe('/photo/ hub', () => {
  it('links every preset with an ItemList', () => {
    expect(hubMeta.alternates?.canonical).toBe('/photo/')
    const { container } = render(<PhotoHub />)
    for (const p of PHOTO_PRESETS) expect(container.querySelector(`a[href="/photo/${p.slug}/"]`)).not.toBeNull()
    const col = lds(container).find((l) => l['@type'] === 'CollectionPage')
    expect(col.mainEntity.itemListElement).toHaveLength(PHOTO_PRESETS.length)
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run test/app/PhotoPage.test.tsx` → FAIL.
- [ ] **Step 3: Implement** both pages per the layout above.
- [ ] **Step 4: Run to verify pass** — `npx vitest run test/app/PhotoPage.test.tsx test/privacy/static-guard.test.ts` → PASS; `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `git add app/photo test/app/PhotoPage.test.tsx && git commit -m "feat(photo): programmatic /photo/ pages and hub"`

---

### Task 5: Registry tool component and content

**Files:**
- Create: `components/tools/ExamPhotoResizer.tsx`, `lib/tool-content/exam-photo-resizer.ts`
- Test: `test/tools/ExamPhotoResizer.test.tsx`

**Interfaces:**
- Consumes: `PHOTO_PRESETS` (Task 2), `PhotoFitter` (Task 3; import it directly — this component is already lazy via ToolMount), kit `Field`, `Select`.
- Produces: `export default function ExamPhotoResizer()` (no props); `lib/tool-content/exam-photo-resizer.ts` default export `ToolContent` (300–700 words, 3–6 steps, 3–6 FAQs, hedged; mention live capture for SSC/RRB and the 1000/1024 KB handling).

Behaviour: `Field` "Exam or form" → `Select` of every preset (exam presets first, labels = titles), default `ibps-photo-signature-size`; renders `<PhotoFitter key={slug} preset={slug} />` (key remounts and so revokes old URLs); a `next/link` "Open the full page for this size" → `/photo/<slug>/` and "All exam photo sizes" → `/photo/`.

- [ ] **Step 1: Write the failing test** — `test/tools/ExamPhotoResizer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExamPhotoResizer from '@/components/tools/ExamPhotoResizer'
import { PHOTO_PRESETS } from '@/lib/photo-presets'

describe('ExamPhotoResizer', () => {
  it('lists every preset and defaults to IBPS', () => {
    const { container } = render(<ExamPhotoResizer />)
    const sel = container.querySelector('select.sel') as HTMLSelectElement
    expect(sel.options).toHaveLength(PHOTO_PRESETS.length)
    expect(sel.value).toBe('ibps-photo-signature-size')
    expect(screen.getByRole('region', { name: 'Left thumb impression' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /full page/i })).toHaveAttribute('href', '/photo/ibps-photo-signature-size/')
  })
  it('switches preset', () => {
    const { container } = render(<ExamPhotoResizer />)
    fireEvent.change(container.querySelector('select.sel')!, { target: { value: 'ssc-signature-size' } })
    expect(screen.queryByRole('region', { name: 'Photo' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Signature' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /full page/i })).toHaveAttribute('href', '/photo/ssc-signature-size/')
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run test/tools/ExamPhotoResizer.test.tsx` → FAIL.
- [ ] **Step 3: Implement** the component and the content file.
- [ ] **Step 4: Run to verify pass** — same command → PASS; `npx tsc --noEmit` clean. (The content shape is enforced by `test/lib/tool-content.test.ts` once Task 6 registers it.)
- [ ] **Step 5: Commit** — `git add components/tools/ExamPhotoResizer.tsx lib/tool-content/exam-photo-resizer.ts test/tools/ExamPhotoResizer.test.tsx && git commit -m "feat(photo): exam photo resizer tool with preset picker"`

---

### Task 6: Wiring (shared files — controller or one builder, sequential)

**Files:**
- Modify: `lib/tools.ts` (after the `photo-date-stamp` entry, ~line 902)
- Modify: `components/ToolMount.tsx` (after `'photo-date-stamp'`, line 146)
- Modify: `lib/tool-content.ts` (import + `'exam-photo-resizer': examPhotoResizer`)
- Modify: `app/sitemap.ts`
- Modify: `lib/hubs.ts` (India hub intro + one FAQ; keep intro ≤ 300 words, FAQs ≤ 5 — currently 208 words, 4 FAQs)
- Modify: `components/Footer.tsx`
- Test: `test/lib/photo-sitemap.test.ts`

**Interfaces:**
- Consumes: `PHOTO_PRESETS` (Task 2), `ExamPhotoResizer` (Task 5), content (Task 5).
- Produces: registry slug `exam-photo-resizer`; sitemap URLs `https://dauntexlabs.com/photo/` and `https://dauntexlabs.com/photo/<slug>/`.

- [ ] **Step 1: Write the failing test** — `test/lib/photo-sitemap.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import sitemap from '@/app/sitemap'
import { PHOTO_PRESETS } from '@/lib/photo-presets'
import { tools } from '@/lib/tools'
import { TOOL_CONTENT } from '@/lib/tool-content'
import { HUBS } from '@/lib/hubs'

describe('photo wiring', () => {
  const urls = sitemap().map((e) => e.url)
  it('sitemap has the hub and every preset page', () => {
    expect(urls).toContain('https://dauntexlabs.com/photo/')
    expect(urls.filter((u) => u.startsWith('https://dauntexlabs.com/photo/') && u !== 'https://dauntexlabs.com/photo/')).toHaveLength(PHOTO_PRESETS.length)
  })
  it('registers the India tool with content', () => {
    expect(tools.find((t) => t.slug === 'exam-photo-resizer')?.category).toBe('India')
    expect(TOOL_CONTENT['exam-photo-resizer']).toBeDefined()
  })
  it('India hub mentions exam photo sizes', () => {
    const india = HUBS.find((h) => h.slug === 'india')!
    expect([...india.intro, ...india.faq.map((f) => f.q + f.a)].join(' ')).toMatch(/exam photo/i)
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run test/lib/photo-sitemap.test.ts` → FAIL.
- [ ] **Step 3: Implement**
  - `lib/tools.ts` entry: `{ slug: 'exam-photo-resizer', name: 'Exam Photo & Signature Resizer', category: 'India', blurb: 'Resize a photo or signature to the exact pixels and KB range an exam form asks for: IBPS, SBI, SSC, UPSC, NEET and more. Runs in your browser.', keywords: ['photo resizer in kb', 'resize image to 20kb', 'exam photo resizer', 'signature resize 10 to 20 kb', 'ibps photo size', 'ssc signature size', 'neet photo size', 'increase image size in kb', 'pan card photo resize'] }`.
  - `ToolMount`: `'exam-photo-resizer': dynamic(() => import('@/components/tools/ExamPhotoResizer'), { ssr: false, loading }),`.
  - `app/sitemap.ts`: import `PHOTO_PRESETS`; after `/convert/` add `{ url: \`${SITE}/photo/\`, changeFrequency: 'weekly', priority: 0.8 }`; at the end add every preset `{ url: \`${SITE}/photo/${p.slug}/\`, changeFrequency: 'monthly', priority: 0.7 }`. If the colour-pages plan already added `/color/` entries, keep them.
  - `lib/hubs.ts` India: append to the second intro paragraph "…and resize an exam photo or signature to the exact pixels and KB range a form asks for."; add FAQ `{ q: 'Which exam photo and signature sizes are covered?', a: 'IBPS, SBI, SSC, RRB, UPSC, NEET, JEE Main, CUET, CTET and TNPSC, plus PAN, passport and Indian visa photos, each checked against the official notice. Always confirm on the current notice before you submit.' }`.
  - `components/Footer.tsx`: `<Link href="/photo/" className="foot-link">Exam photo sizes</Link>` after "India tools" (keep any colour-pages link).
- [ ] **Step 4: Run to verify pass** — `npm test` → all green (incl. `hubs.test.ts`, `tool-content.test.ts`, `CategoryHub.test.tsx`, `CategoryNav.test.tsx`, static guard).
- [ ] **Step 5: Commit** — `git add lib/tools.ts components/ToolMount.tsx lib/tool-content.ts app/sitemap.ts lib/hubs.ts components/Footer.tsx test/lib/photo-sitemap.test.ts && git commit -m "feat(photo): register exam photo resizer, sitemap, hub and footer links"`

---

### Task 7: e2e, privacy canaries and the build gate

**Files:**
- Create: `test/e2e/photo.spec.ts`
- Modify: `test/e2e/privacy.spec.ts` (append two tests at the end)

**Interfaces:**
- Consumes: pages from Task 4, `makePng`/`makeTransparentPng` from `test/e2e/png.ts`, `STATIC`/`dismissConsent`/`applySiteHeaders` from `test/e2e/headers.ts`.

- [ ] **Step 1: Write the e2e spec** — `test/e2e/photo.spec.ts` (runs on `next dev` :3000; bounds are hard-coded from the research, independent of the implementation):

```ts
import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { makePng, makeTransparentPng } from './png'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dxl-consent-v1', 'accepted'))
})

/** Width/height from SOF0–2 and JFIF units/density from APP0. */
function jpegInfo(b: Buffer) {
  const info = { width: 0, height: 0, units: -1, density: -1 }
  let i = 2
  while (i < b.length && b[i] === 0xff && b[i + 1] !== 0xda) {
    const m = b[i + 1]
    const len = b.readUInt16BE(i + 2)
    if (m >= 0xc0 && m <= 0xc2) { info.height = b.readUInt16BE(i + 5); info.width = b.readUInt16BE(i + 7) }
    if (m === 0xe0 && b.toString('latin1', i + 4, i + 8) === 'JFIF') { info.units = b[i + 11]; info.density = b.readUInt16BE(i + 12) }
    i += 2 + len
  }
  return info
}

async function make(page: Page, region: string, file: { name: string; mimeType: string; buffer: Buffer }) {
  const r = page.getByRole('region', { name: region, exact: true })
  await r.locator('input[type="file"]').setInputFiles(file)
  await r.getByRole('button', { name: 'Make file', exact: true }).click()
  await expect(r.getByRole('list', { name: 'Checks' })).toBeVisible()
  const wait = page.waitForEvent('download')
  await r.getByRole('button', { name: /^Download / }).click()
  return readFileSync(await (await wait).path())
}

const png = (w: number, h: number) => ({ name: 'in.png', mimeType: 'image/png', buffer: makePng(w, h) })

test('IBPS: every file has exact pixels, an in-range size and 200 DPI', async ({ page }) => {
  await page.goto('/photo/ibps-photo-signature-size/')
  const cases: [string, number, number, number, number][] = [
    ['Photo', 200, 230, 20, 50],
    ['Signature', 140, 60, 10, 20],
    ['Left thumb impression', 240, 240, 20, 50],
    ['Handwritten declaration', 800, 400, 50, 100],
  ]
  for (const [region, w, h, minKb, maxKb] of cases) {
    const bytes = await make(page, region, png(800, 600))
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xff, 0xd8, 0xff])
    expect(jpegInfo(bytes)).toEqual({ width: w, height: h, units: 1, density: 200 })
    expect(bytes.length).toBeGreaterThanOrEqual(minKb * 1024)
    expect(bytes.length).toBeLessThanOrEqual(maxKb * 1000)
  }
})

test('increase-image-size-in-kb: a tiny input comes out above the minimum and still decodes', async ({ page }) => {
  await page.goto('/photo/increase-image-size-in-kb/')
  const bytes = await make(page, 'Photo', png(40, 30))
  expect(bytes.length).toBeGreaterThanOrEqual(50 * 1024)
  const dims = await page.evaluate(async (data) => {
    const bmp = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/jpeg' }))
    return [bmp.width, bmp.height]
  }, Array.from(bytes))
  expect(dims).toEqual([40, 30])
})

test('resize-image-to-20kb: a large photo lands in 10–20 KB', async ({ page }) => {
  await page.goto('/photo/resize-image-to-20kb/')
  const bytes = await make(page, 'Photo', png(1600, 1200))
  expect(bytes.length).toBeGreaterThanOrEqual(10 * 1024)
  expect(bytes.length).toBeLessThanOrEqual(20000)
})

test('a transparent PNG signature gets a white background', async ({ page }) => {
  await page.goto('/photo/resize-signature-to-20kb/')
  const bytes = await make(page, 'Signature', { name: 's.png', mimeType: 'image/png', buffer: makeTransparentPng(280, 120) })
  const rgb = await page.evaluate(async (data) => {
    const bmp = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/jpeg' }))
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
    const ctx = c.getContext('2d')!; ctx.drawImage(bmp, 0, 0)
    return Array.from(ctx.getImageData(bmp.width >> 1, bmp.height >> 1, 1, 1).data.slice(0, 3))
  }, Array.from(bytes))
  for (const v of rgb) expect(v).toBeGreaterThan(240)
})
```

- [ ] **Step 2: Append privacy canaries** to `test/e2e/privacy.spec.ts`:

```ts
test('photo pages: a file name and the name strip never leave the page', async ({ page }) => {
  const canary = canaryFor()
  const cap = await watch(page)
  await page.goto(STATIC + '/photo/tnpsc-photo-signature-size/', { waitUntil: 'networkidle' })
  const photo = page.getByRole('region', { name: 'Photo', exact: true })
  await photo.locator('input[type="file"]').setInputFiles({ name: `${canary}.png`, mimeType: 'image/png', buffer: makePng(320, 400) })
  await photo.getByPlaceholder('Name as on the form').fill(`${canary} Rao`)
  await photo.getByRole('button', { name: 'Make file', exact: true }).click()
  await expect(photo.getByRole('list', { name: 'Checks' })).toBeVisible()
  const local = await assertNoLeak(page, cap, canary)
  expect(local.href).not.toContain(canary)
})

test('exam-photo-resizer: an uploaded photo name never leaves the page', async ({ page }) => {
  const canary = canaryFor()
  const cap = await watch(page)
  await page.goto(STATIC + '/tools/exam-photo-resizer/', { waitUntil: 'networkidle' })
  await page.getByRole('region', { name: 'Photo', exact: true }).locator('input[type="file"]').setInputFiles({ name: `${canary}.png`, mimeType: 'image/png', buffer: makePng(320, 400) })
  await page.getByRole('region', { name: 'Photo', exact: true }).getByRole('button', { name: 'Make file', exact: true }).click()
  await page.waitForTimeout(400)
  await assertNoLeak(page, cap, canary)
})
```

- [ ] **Step 3: Run** — `npm run e2e -- test/e2e/photo.spec.ts test/e2e/privacy.spec.ts test/e2e/csp.spec.ts` → all PASS (fix the code, not the bounds, on failure).
- [ ] **Step 4: Build gate and bundle check**
  - `npm run verify` → typecheck, unit tests and build green.
  - In the build output, "First Load JS shared by all" within +1 kB of the Task 0 number; `/photo/[slug]` is listed as SSG with 20 paths.
  - `grep -o '<loc>' out/sitemap.xml | wc -l` = Task 0 count + 22 (hub + 20 presets + the new tool page).
  - `grep '<title>' out/photo/ibps-photo-signature-size/index.html` shows the preset title + " — dauntexlabs".
  - Homepage stays clean: `for f in $(grep -o '/_next/static/chunks/[^"]*\.js' out/index.html | sort -u); do grep -l 'Make file' "out$f"; done` prints nothing.
- [ ] **Step 5: Commit** — `git add test/e2e/photo.spec.ts test/e2e/privacy.spec.ts && git commit -m "test(photo): real-browser pixel, KB and DPI checks plus privacy canaries"`

---

## Final review (one fresh reviewer, whole branch)

Brief the reviewer with this plan, the spec and the research doc. Ask specifically for: preset values vs research §1 (and the "Spec corrections" list), the five Review Focus items, object-URL lifecycle in `FitSection`, the 1000/1024 bounds and midpoint targeting, JPEG byte surgery (`padJpeg`, `setJfifDensity`) on real browser output, hedged copy, and that nothing from `components/photo` or `lib/photo-*` entered the shared chunk.
