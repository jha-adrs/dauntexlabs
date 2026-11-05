# Programmatic Colour Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution method (chosen):** native, with parallel builder subagents per the dependency graph below, then **one** final fresh reviewer over the whole branch.

**Goal:** Ship ≈ 370 statically generated colour pages at `/color/<hex>/` (148 CSS named colours + Tailwind v3 palette, deduplicated by hex) plus an A–Z hub at `/color/`.

**Architecture:** Pure colour maths moves out of `ColorConverter.tsx` / `ContrastChecker.tsx` into `lib/color-math.ts`. `lib/colors.ts` holds the registry and per-colour derived facts (server-only by usage). `app/color/[slug]/page.tsx` and `app/color/page.tsx` are server components mirroring `app/convert/`; the only client island is the kit's `CopyButton`.

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, Vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-05-color-pages-design.md`

## Global Constraints

- No network: no `fetch`/XHR/WebSocket/beacon anywhere (enforced by `test/privacy/static-guard.test.ts`). Data is typed into source; reference sites may be consulted while writing, never fetched at runtime.
- No new dependencies (runtime or dev).
- Shared "First Load JS" stays ~105 KB (within +1 KB of the baseline recorded in Task 1). Colour tables must not enter any client chunk: `lib/colors.ts` is imported only by `app/color/**`, `app/sitemap.ts` and tests — never by a `'use client'` file or `components/tools/*`.
- `ColorConverter` and `ContrastChecker` behaviour unchanged; their existing tests pass unmodified.
- Hex convention inside new code: bare lowercase 6-digit hex, no `#` (`'ff6347'`), called `Hex6`. `#` is added only for display strings.
- URLs: `/color/<hex6>/` (trailing slash), hub `/color/`. `SITE = 'https://dauntexlabs.com'` (copy the const as other pages do).
- Copy uses US "color"; hedged privacy wording only (no "never leaves your device").
- Styling: existing classes (`shell tool-page`, `crumbs`, `lede`, `block`, `sec-head`, `faq`, `conv-links`, `conv-chip`, `pill`) + a new "colour pages" section at the end of `app/globals.css` using tokens (`--line`, `--surface-soft`, `--mute`, `--accent`, `--danger`, radius 12px panels / 8px swatches). The swatch colour itself is the only inline colour.
- Do not touch `lib/qr/contrast.ts`.
- Do not commit unless the user asks (commit steps below are the intended messages; run them only with approval).

## Review Focus

1. **Data typos** — one wrong hex in 390 hand-typed values silently publishes a wrong page. Pinned by Task 2 spot-checks + Task 6's Chromium `getComputedStyle` comparison of all 148 CSS names; Tailwind values must be checked against `tailwindcss@3.4.x` `src/public/colors.js` by the reviewer (no local v3 source — repo has v4).
2. **Duplicate hexes** — `aqua`/`cyan`, `fuchsia`/`magenta`, gray/grey pairs, `zinc-50`/`neutral-50`, `whitesmoke`/`neutral-100` must yield one route each (duplicate `generateStaticParams` entries fail the build). Pinned in Task 2.
3. **Harmony links to non-existent pages** — a link to a hex outside the set is a 404 under `dynamicParams = false`. Pinned in Task 4 (tomato's complement `47e3ff` is plain; red's complement `00ffff` links).
4. **Achromatic colours** (black, white, grays) — hue undefined; OKLCH chroma ≈ 0 must print `0` hue, not `NaN`; hue rotation of a gray returns the same gray. Pinned in Task 1.
5. **Client bundle leak** — importing `lib/colors.ts` from a client file would ship ~10 KB of tables. Pinned by the Task 7 grep for `022c22` (emerald-950) in `out/_next/static`.

---

## File structure

| File | Task | Responsibility |
|---|---|---|
| `lib/color-math.ts` (new) | 1 | Pure conversions, contrast, mix, hue rotation. |
| `components/tools/ColorConverter.tsx`, `ContrastChecker.tsx` (modify) | 1 | Import helpers instead of inline copies. |
| `lib/colors.ts` (new) | 2, 3 | Registry (T2); facts, titles, FAQ, snippet (T3). |
| `app/color/[slug]/page.tsx` (new), `app/globals.css` (append) | 4 | Colour page. |
| `app/color/page.tsx` (new) | 5 | A–Z hub. |
| `test/e2e/color-data.spec.ts` (new) | 6 | CSS names vs real Chromium. |
| `app/sitemap.ts`, `components/Footer.tsx`, `app/tools/[slug]/page.tsx` (modify) | 7 | Wiring + build gate. |

**Dependency graph (parallel builders):** T1 ∥ T2 → T3 → (T4 ∥ T5 ∥ T6) → T7 → final reviewer. T6 needs only T2 and may start right after it.

---

### Task 1: Extract colour maths into `lib/color-math.ts`

**Files:**
- Create: `lib/color-math.ts`
- Modify: `components/tools/ColorConverter.tsx:6-46` (remove `parseHex`, `rgbToHsl`, `toFullHex`; import them)
- Modify: `components/tools/ContrastChecker.tsx:6-44` (remove `parseHex`, `toSRGB`, `relativeLuminance`, `contrastRatio`, `toFullHex`; import them)
- Test: `test/lib/color-math.test.ts`

**Interfaces — Produces:**
```ts
export type Rgb = { r: number; g: number; b: number }          // 0–255 ints
export function parseHex(hex: string): Rgb | null               // moved verbatim (accepts '#rgb', 'rrggbb', …)
export function toFullHex(hex: string): string                  // moved verbatim, returns '#rrggbb'
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } // moved verbatim (rounded)
export function relativeLuminance(r: number, g: number, b: number): number // moved verbatim (0.04045 threshold)
export function contrastRatio(l1: number, l2: number): number   // moved verbatim, takes luminances
export function wcag(ratio: number): { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean } // ≥4.5, ≥3, ≥7, ≥4.5
export function hexToRgb(hex6: string): Rgb                     // strict; throws on non-/^[0-9a-f]{6}$/i
export function rgbToHex6({ r, g, b }: Rgb): string             // lowercase, rounds + clamps 0–255
export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } // rounded %
export function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } // unrounded; l 0–1, h 0–360 (0 when c < 1e-4)
export function mix(a: Hex6, b: Hex6, t: number): string        // per-channel a + (b-a)*t, Math.round, returns Hex6
export function rotateHue(hex6: string, deg: number): string    // via unrounded HSL; returns Hex6
export type Hex6 = string
```

- [ ] **Step 0: Record baseline bundle size** — `npm run build 2>&1 | grep -i "First Load JS shared"`; note the KB value in the task report (Task 7 compares against it).

- [ ] **Step 1: Write the failing test** `test/lib/color-math.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import {
  parseHex, toFullHex, rgbToHsl, relativeLuminance, contrastRatio, wcag,
  hexToRgb, rgbToHex6, rgbToCmyk, rgbToOklch, mix, rotateHue,
} from '@/lib/color-math'

describe('color-math', () => {
  it('keeps the moved parsers', () => {
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseHex('zzzzzz')).toBeNull()
    expect(toFullHex('#abc')).toBe('#aabbcc')
    expect(rgbToHsl(255, 99, 71)).toEqual({ h: 9, s: 100, l: 64 })
  })
  it('computes WCAG contrast', () => {
    const r = contrastRatio(relativeLuminance(0, 0, 0), relativeLuminance(255, 255, 255))
    expect(r).toBeCloseTo(21, 5)
    expect(wcag(4.5)).toEqual({ aa: true, aaLarge: true, aaa: false, aaaLarge: true })
    expect(wcag(3)).toEqual({ aa: false, aaLarge: true, aaa: false, aaaLarge: false })
  })
  it('round-trips strict hex', () => {
    expect(hexToRgb('FF6347')).toEqual({ r: 255, g: 99, b: 71 })
    expect(() => hexToRgb('f00')).toThrow()
    expect(rgbToHex6({ r: 300, g: -4, b: 127.5 })).toBe('ff0080')
  })
  it('converts to CMYK', () => {
    expect(rgbToCmyk(255, 99, 71)).toEqual({ c: 0, m: 61, y: 72, k: 0 })
    expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 })
  })
  it('converts to OKLCH', () => {
    const red = rgbToOklch(255, 0, 0)
    expect(red.l).toBeCloseTo(0.628, 3)
    expect(red.c).toBeCloseTo(0.2577, 3)
    expect(red.h).toBeCloseTo(29.23, 1)
    const white = rgbToOklch(255, 255, 255)
    expect(white.l).toBeCloseTo(1, 3)
    expect(white.c).toBeLessThan(1e-4)
    expect(white.h).toBe(0)
  })
  it('mixes and rotates hue', () => {
    expect(mix('ff0000', 'ffffff', 0.5)).toBe('ff8080')
    expect(mix('ff6347', '000000', 1)).toBe('000000')
    expect(rotateHue('ff6347', 180)).toBe('47e3ff')
    expect(rotateHue('ff0000', 120)).toBe('00ff00')
    expect(rotateHue('ff0000', -120)).toBe('0000ff')
    expect(rotateHue('808080', 90)).toBe('808080')
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/lib/color-math.test.ts` → FAIL, cannot resolve `@/lib/color-math`.

- [ ] **Step 3: Implement `lib/color-math.ts`** — move the five functions verbatim from the components (bodies unchanged, add `export`), then add the new ones. OKLCH: sRGB → linear (same `toSRGB` curve) → OKLab with Björn Ottosson's M1/M2 matrices → `c = hypot(a, b)`, `h = atan2(b, a)` in degrees normalised to [0, 360), `h = 0` when `c < 1e-4`. `rotateHue`: unrounded HSL (do not reuse the rounded `rgbToHsl`), add `deg`, convert back, `rgbToHex6`.

- [ ] **Step 4: Point the tools at the lib** — in both components delete the inline copies and `import { parseHex, toFullHex, rgbToHsl } from '@/lib/color-math'` / `import { parseHex, toFullHex, relativeLuminance, contrastRatio } from '@/lib/color-math'`. No other edits.

- [ ] **Step 5: Run tests** — `npx vitest run test/lib/color-math.test.ts test/tools/ColorConverter.test.tsx test/tools/ContrastChecker.test.tsx` → all PASS; `npm run typecheck` → clean.

- [ ] **Step 6: Commit** — `git add lib/color-math.ts test/lib/color-math.test.ts components/tools/ColorConverter.tsx components/tools/ContrastChecker.tsx && git commit -m "refactor(color): extract shared colour maths into lib/color-math"`

---

### Task 2: Colour registry in `lib/colors.ts`

**Files:**
- Create: `lib/colors.ts`
- Test: `test/lib/colors.test.ts`

**Interfaces — Produces:**
```ts
export const CSS_COLORS: Readonly<Record<string, string>>        // 148 lowercase names → Hex6 (no 'transparent')
export const TAILWIND_SHADES: readonly [50,100,200,300,400,500,600,700,800,900,950]
export const TAILWIND_COLORS: Readonly<Record<string, readonly string[]>> // 22 families, 11 Hex6 each, in TAILWIND_SHADES order
export type ColorName = { name: string; source: 'css' | 'tailwind' } // tailwind name = `${family}-${shade}`
export type ColorEntry = { hex: string; names: ColorName[] }       // names: css (A–Z) first, then tailwind (table order)
export const COLORS: ColorEntry[]                                   // one per unique hex, sorted A–Z by primaryName
export const ALL_NAMES: (ColorName & { hex: string })[]             // every name, sorted A–Z (localeCompare, numeric)
export function getColor(slug: string): ColorEntry | undefined      // exact lowercase Hex6 only
export function primaryName(e: ColorEntry): string                  // e.names[0].name
```
Tailwind families, in this order: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose. Values are Tailwind **v3.4** (`src/public/colors.js`), including the `950` shades.

- [ ] **Step 1: Write the failing test** `test/lib/colors.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { CSS_COLORS, TAILWIND_COLORS, COLORS, ALL_NAMES, getColor, primaryName } from '@/lib/colors'

const names = (hex: string) => getColor(hex)!.names.map((n) => n.name)

describe('colour registry', () => {
  it('has 148 CSS names and 22×11 Tailwind shades', () => {
    expect(Object.keys(CSS_COLORS)).toHaveLength(148)
    expect(Object.keys(TAILWIND_COLORS)).toHaveLength(22)
    for (const shades of Object.values(TAILWIND_COLORS)) expect(shades).toHaveLength(11)
    expect(ALL_NAMES).toHaveLength(148 + 242)
  })
  it('stores every hex as lowercase 6-digit without #', () => {
    for (const e of COLORS) expect(e.hex).toMatch(/^[0-9a-f]{6}$/)
    expect(new Set(COLORS.map((e) => e.hex)).size).toBe(COLORS.length)
  })
  it('spot-checks CSS values', () => {
    expect(CSS_COLORS.tomato).toBe('ff6347')
    expect(CSS_COLORS.rebeccapurple).toBe('663399')
    expect(CSS_COLORS.cornflowerblue).toBe('6495ed')
    expect(CSS_COLORS.lightgoldenrodyellow).toBe('fafad2')
    expect(CSS_COLORS.darkslategrey).toBe('2f4f4f')
  })
  it('spot-checks Tailwind v3 values', () => {
    const tw = (f: string, i: number) => TAILWIND_COLORS[f][i]
    expect(tw('slate', 0)).toBe('f8fafc'); expect(tw('slate', 5)).toBe('64748b'); expect(tw('slate', 10)).toBe('020617')
    expect(tw('gray', 0)).toBe('f9fafb'); expect(tw('red', 5)).toBe('ef4444'); expect(tw('blue', 6)).toBe('2563eb')
    expect(tw('sky', 5)).toBe('0ea5e9'); expect(tw('emerald', 5)).toBe('10b981'); expect(tw('rose', 5)).toBe('f43f5e')
  })
  it('collapses duplicate hexes into one entry listing every name', () => {
    expect(names('00ffff')).toEqual(['aqua', 'cyan'])
    expect(names('ff00ff')).toEqual(['fuchsia', 'magenta'])
    expect(names('808080')).toEqual(['gray', 'grey'])
    expect(names('fafafa')).toEqual(['zinc-50', 'neutral-50'])
    expect(names('f5f5f5')).toEqual(['whitesmoke', 'neutral-100'])
  })
  it('looks up only exact lowercase slugs', () => {
    expect(primaryName(getColor('ff6347')!)).toBe('tomato')
    expect(primaryName(getColor('64748b')!)).toBe('slate-500')
    expect(getColor('FF6347')).toBeUndefined()
    expect(getColor('123456')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/lib/colors.test.ts` → FAIL, cannot resolve `@/lib/colors`.

- [ ] **Step 3: Implement the registry** — type both tables; derive `COLORS` by grouping all names by hex (CSS names A–Z first, then Tailwind in family/shade order), sort by `primaryName`. `getColor` via a `Map` built once. No imports from `color-math` yet. Cross-check each Tailwind value against Tailwind v3.4 `colors.js` while typing.

- [ ] **Step 4: Run tests** — `npx vitest run test/lib/colors.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat(color): CSS + Tailwind v3 colour registry"` (files: `lib/colors.ts`, `test/lib/colors.test.ts`).

---

### Task 3: Per-colour facts, titles, FAQ and snippet

**Files:**
- Modify: `lib/colors.ts` (append)
- Test: `test/lib/colors.test.ts` (append a `describe('colour facts')`)

**Interfaces — Consumes:** Task 1 `hexToRgb`, `rgbToHsl`, `rgbToCmyk`, `rgbToOklch`, `relativeLuminance`, `contrastRatio`, `wcag`, `mix`, `rotateHue`; Task 2 `CSS_COLORS`, `ColorEntry`, `primaryName`.

**Produces:**
```ts
export type Contrast = { ratio: number; aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean }
export type ColorFacts = {
  hex: string                                   // Hex6
  formats: { hex: string; rgb: string; hsl: string; cmyk: string; oklch: string }
  contrast: { white: Contrast; black: Contrast }
  tints: string[]   // 9 Hex6: mix(hex,'ffffff', 0.1…0.9)
  shades: string[]  // 9 Hex6: mix(hex,'000000', 0.1…0.9)
  complementary: string; analogous: [string, string]; triadic: [string, string] // rotateHue 180; -30,+30; +120,-120 (in that order)
  nearest: { name: string; hex: string; exact: boolean }
}
export function nearestCssName(hex6: string): { name: string; hex: string; exact: boolean } // min Euclidean OKLab distance (L, a, b — not LCh); ties → A–Z first
export function colorFacts(hex6: string): ColorFacts
export function displayName(e: ColorEntry): string        // CSS primary capitalised ('Tomato'); Tailwind as-is ('slate-500')
export function colorTitle(e: ColorEntry): string
export function colorDescription(e: ColorEntry, f: ColorFacts): string
export function colorFaq(e: ColorEntry, f: ColorFacts): { q: string; a: string }[]
export function cssSnippet(e: ColorEntry): string
```
Formats: `'#ff6347'`, `'rgb(255, 99, 71)'`, `'hsl(9, 100%, 64%)'`, `'cmyk(0%, 61%, 72%, 0%)'`, OKLCH `` `oklch(${(l*100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})` `` with `c` printed as `0` and `h` as `0` when `c < 1e-4`.

Fixed copy (`#h` = `#`+hex, `D` = `displayName`):
- `colorTitle`: CSS-named → `` `${D} color code: #h` ``; Tailwind-only → `` `${name} hex code: #h (Tailwind)` ``.
- `colorDescription`: `` `${D} is #h — ${rgb}, ${hsl}, ${cmyk}. Contrast ratio ${white}:1 on white and ${black}:1 on black, plus tints, shades and matching colors.` `` (ratios `toFixed(2)`).
- `colorFaq`, in order:
  1. `What is the hex code for ${D}?` → `` `${D} is #h, which is ${rgb} and ${hsl}.` `` + (other names ? `` ` It is also known as ${others.join(', ')}.` `` : '').
  2. `Is #h readable on a white background?` → `` `#h has a contrast ratio of ${w}:1 against white and ${b}:1 against black. On white it ${verdict}.` `` where verdict = aa ? `passes WCAG AA for normal text` : aaLarge ? `passes WCAG AA only for large text (3:1)` : `fails WCAG AA, so use it for decoration rather than body text`.
  3. `What is the complementary color of #h?` → `` `The complementary color of #h is #${complementary} (hue rotated 180°). Its triadic colors are #${t1} and #${t2}.` ``
  4. Only if a Tailwind name exists (first one, `tw`): `How do I use ${tw} in Tailwind CSS?` → `` `Use the classes bg-${tw}, text-${tw} or border-${tw} from the Tailwind CSS v3 default palette, or the raw value #h in plain CSS.` ``
- `cssSnippet`: `` `:root {\n  --color-${primaryName(e)}: #h;\n}\n\n.example {\n  color: var(--color-${primaryName(e)});\n}` ``

- [ ] **Step 1: Write the failing tests** (append to `test/lib/colors.test.ts`; extend the import with `colorFacts, nearestCssName, colorTitle, colorFaq, cssSnippet, displayName`)

```ts
describe('colour facts', () => {
  const f = colorFacts('ff6347')
  it('formats every model', () => {
    expect(f.formats).toEqual({
      hex: '#ff6347', rgb: 'rgb(255, 99, 71)', hsl: 'hsl(9, 100%, 64%)',
      cmyk: 'cmyk(0%, 61%, 72%, 0%)', oklch: expect.stringMatching(/^oklch\(\d+\.\d% \d\.\d{3} \d+\.\d\)$/),
    })
    expect(colorFacts('ffffff').formats.oklch).toBe('oklch(100.0% 0 0)')
  })
  it('computes contrast both ways', () => {
    expect(f.contrast.white.ratio).toBeCloseTo(2.95, 1)
    expect(f.contrast.white.aa).toBe(false)
    expect(f.contrast.black.ratio).toBeCloseTo(7.13, 1)
    expect(f.contrast.black.aaa).toBe(true)
  })
  it('builds 9 tints, 9 shades and harmonies', () => {
    expect(f.tints).toHaveLength(9); expect(f.shades).toHaveLength(9)
    expect(colorFacts('ff0000').tints[4]).toBe('ff8080')
    expect(f.complementary).toBe('47e3ff')
    expect(colorFacts('ff0000').triadic).toEqual(['00ff00', '0000ff'])
  })
  it('finds the nearest CSS name', () => {
    expect(nearestCssName('ff6347')).toEqual({ name: 'tomato', hex: 'ff6347', exact: true })
    expect(nearestCssName('fe0001')).toEqual({ name: 'red', hex: 'ff0000', exact: false })
    expect(nearestCssName('0f172a').exact).toBe(false)
  })
  it('writes titles, FAQ and snippet', () => {
    const tomato = getColor('ff6347')!, slate = getColor('64748b')!, aqua = getColor('00ffff')!
    expect(displayName(tomato)).toBe('Tomato')
    expect(colorTitle(tomato)).toBe('Tomato color code: #ff6347')
    expect(colorTitle(slate)).toBe('slate-500 hex code: #64748b (Tailwind)')
    expect(colorFaq(tomato, f)).toHaveLength(3)
    expect(colorFaq(slate, colorFacts('64748b'))).toHaveLength(4)
    expect(colorFaq(aqua, colorFacts('00ffff'))[0].a).toContain('also known as cyan')
    expect(cssSnippet(tomato)).toContain('--color-tomato: #ff6347;')
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/lib/colors.test.ts` → FAIL, `colorFacts` not exported.
- [ ] **Step 3: Implement** the signatures above in `lib/colors.ts`. Precompute OKLab for the 148 CSS colours lazily once for `nearestCssName`.
- [ ] **Step 4: Run tests** — `npx vitest run test/lib/colors.test.ts test/lib/color-math.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(color): per-colour facts, titles and FAQ"`.

---

### Task 4: Colour page `app/color/[slug]/page.tsx`

**Files:**
- Create: `app/color/[slug]/page.tsx`
- Modify: `app/globals.css` (append a `/* ---- colour pages ---- */` section)
- Test: `test/app/ColorPage.test.tsx`

**Interfaces — Consumes:** Task 2/3 exports; `CopyButton` from `@/components/ui/kit`; `JsonLd`, `SiteHeader`, `Footer`. **Produces:** default export `ColorPage({ params })`, `generateStaticParams(): { slug: string }[]`, `generateMetadata`, `dynamicParams = false` — same shapes as `app/convert/[slug]/page.tsx`.

Page sections, in order: breadcrumbs (`All tools › Colors › D`, Colors → `/color/`); `<h1>{D} — #h</h1>`; lede = `colorDescription`; when more than one name, `<p className="color-aka">Also known as {other names joined ', '}</p>`; hero swatch (`.color-hero`, inline `background: #h`); "Color values" rows (label, mono value, `CopyButton`) for HEX/RGB/HSL/CMYK/OKLCH; "Contrast" — two cards (on white / on black) each with sample text in the colour, ratio `toFixed(2)+':1'`, four badges `AA`, `AA large`, `AAA`, `AAA large` with `data-pass="true|false"`; "Tints and shades" two swatch rows; "Matching colors" (complementary, analogous ×2, triadic ×2) — each swatch is `<Link href="/color/<hex>/">` iff `getColor(hex)` else a `<div>`, always labelled `#hex`; "Nearest CSS color name" (exact → "This is the CSS named color X", else "Closest CSS named color: X (#hex)" linking to its page); "CSS" `<pre>` of `cssSnippet` + `CopyButton`; FAQ (`details.faq`, first open) from `colorFaq`; related chips: `/tools/color-converter/`, `/tools/contrast-checker/`, `/color/`; foot note with privacy link as in convert page. JSON-LD: `BreadcrumbList` (3 items, last `item` = `${SITE}/color/<hex>/`) + `FAQPage` from `colorFaq`.

Metadata: `title = colorTitle(e)`, `description = colorDescription(e, f)`, `keywords = [...names, '#'+hex, hex, `${names[0]} hex`, `${names[0]} rgb`]`, `alternates.canonical = /color/<hex>/`, openGraph like convert page.

- [ ] **Step 1: Write the failing test** `test/app/ColorPage.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ColorPage, { generateMetadata, generateStaticParams } from '@/app/color/[slug]/page'
import { COLORS, colorFacts } from '@/lib/colors'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })
const lds = (c: HTMLElement) =>
  [...c.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!))

describe('colour page', () => {
  it('pre-renders one route per unique hex', () => {
    const p = generateStaticParams()
    expect(p).toHaveLength(COLORS.length)
    expect(p).toContainEqual({ slug: 'ff6347' })
  })
  it('has title, description and canonical', async () => {
    const m = await generateMetadata(params('ff6347'))
    expect(m.title).toBe('Tomato color code: #ff6347')
    expect(m.description).toContain('rgb(255, 99, 71)')
    expect(m.alternates?.canonical).toBe('/color/ff6347/')
  })
  it('renders formats, contrast and JSON-LD', async () => {
    const { container } = render(await ColorPage(params('ff6347')))
    const f = colorFacts('ff6347')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tomato — #ff6347')
    for (const v of Object.values(f.formats)) expect(screen.getAllByText(v).length).toBeGreaterThan(0)
    expect(screen.getByText(`${f.contrast.white.ratio.toFixed(2)}:1`)).toBeInTheDocument()
    expect(screen.getByText(`${f.contrast.black.ratio.toFixed(2)}:1`)).toBeInTheDocument()
    expect(container.querySelectorAll('[data-pass]')).toHaveLength(8)
    const ld = lds(container)
    const crumbs = ld.find((l) => l['@type'] === 'BreadcrumbList')
    expect(crumbs.itemListElement.at(-1).item).toBe('https://dauntexlabs.com/color/ff6347/')
    expect(ld.find((l) => l['@type'] === 'FAQPage').mainEntity).toHaveLength(3)
  })
  it('links harmonies only when the hex has a page', async () => {
    const tomato = render(await ColorPage(params('ff6347'))).container
    expect(tomato.querySelector('a[href="/color/47e3ff/"]')).toBeNull()
    expect(tomato.textContent).toContain('#47e3ff')
    const red = render(await ColorPage(params('ff0000'))).container
    expect(red.querySelector('a[href="/color/00ffff/"]')).not.toBeNull()
    expect(red.querySelector('a[href="/color/00ff00/"]')).not.toBeNull()
  })
  it('lists every name on a duplicate-hex page', async () => {
    const { container } = render(await ColorPage(params('00ffff')))
    expect(container.querySelector('.color-aka')).toHaveTextContent('Also known as cyan')
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/app/ColorPage.test.tsx` → FAIL, cannot resolve the page.
- [ ] **Step 3: Implement the page** following `app/convert/[slug]/page.tsx` (await `params`, `notFound()` when `getColor` is undefined). Add the CSS section: `.color-hero` (height 140px, radius 12px, 1px `--line` border), `.color-rows`/`.color-row` (mirror the converter's label/value/copy row using `--surface-soft`), `.color-contrast` (2-col grid → 1 col under 600px), `.color-badge[data-pass="true|false"]` (`--accent`/`--accent-tint` vs `--danger`/`--danger-tint`), `.swatch-row` (flex, wrap, gap 8px), `.swatch` (64×64, radius 8px, border `--line`, label below in `--font-mono` 0.75rem `--mute`), `.color-css` (pre block). Must render with no horizontal scroll at 360px width.
- [ ] **Step 4: Run tests** — `npx vitest run test/app/ColorPage.test.tsx` → PASS; `npm run typecheck` clean.
- [ ] **Step 5: Commit** — `git commit -m "feat(color): static /color/<hex>/ pages"`.

---

### Task 5: A–Z hub `app/color/page.tsx`

**Files:**
- Create: `app/color/page.tsx`
- Test: `test/app/ColorHub.test.tsx`

**Interfaces — Consumes:** `ALL_NAMES`, `COLORS`, `primaryName` (Task 2). Pattern: `app/convert/page.tsx`.

Static `metadata`: title `Color codes A–Z — CSS named colors & Tailwind palette`, description `Hex, RGB, HSL, CMYK and contrast for all 148 CSS named colors and the Tailwind CSS v3 palette — ${COLORS.length} color pages, A to Z.`, canonical `/color/`. Body: breadcrumbs (`All tools › Colors`), H1 `Color codes`, lede with the count, one `section.block` per first letter (H2 = uppercase letter, `.count`), chips = `conv-chip` links `/color/<hex>/` each with a 12px inline swatch dot and the name. JSON-LD `ItemList` of `COLORS` (name = `primaryName`, url `${SITE}/color/<hex>/`).

- [ ] **Step 1: Write the failing test** `test/app/ColorHub.test.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ColorHub, { metadata } from '@/app/color/page'
import { ALL_NAMES, COLORS } from '@/lib/colors'

describe('colour hub', () => {
  it('has a canonical', () => expect(metadata.alternates?.canonical).toBe('/color/'))
  it('links every name to its hex page, grouped A–Z', () => {
    const { container } = render(<ColorHub />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Color codes')
    for (const n of ALL_NAMES)
      expect(screen.getByRole('link', { name: new RegExp(`^${n.name}$`) })).toHaveAttribute('href', `/color/${n.hex}/`)
    expect(screen.getByRole('heading', { level: 2, name: 'T' })).toBeInTheDocument()
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(ld.itemListElement).toHaveLength(COLORS.length)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/app/ColorHub.test.tsx` → FAIL.
- [ ] **Step 3: Implement** the hub (chip accessible name must be exactly the colour name — give the swatch dot `aria-hidden`).
- [ ] **Step 4: Run tests** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(color): A–Z colour hub"`.

---

### Task 6: Verify CSS names against real Chromium

**Files:**
- Create: `test/e2e/color-data.spec.ts`

**Interfaces — Consumes:** `CSS_COLORS` (Task 2). Needs no server (uses `page.setContent`).

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test'
import { CSS_COLORS } from '../../lib/colors'

test('every CSS named color resolves to our hex in Chromium', async ({ page }) => {
  await page.setContent('<div id="x"></div>')
  const got = await page.evaluate((names) => {
    const el = document.getElementById('x')!
    return Object.fromEntries(names.map((n) => {
      el.style.color = ''
      el.style.color = n
      const m = getComputedStyle(el).color.match(/\d+/g)!.map(Number)
      return [n, m.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('')]
    }))
  }, Object.keys(CSS_COLORS))
  expect(got).toEqual(CSS_COLORS)
})
```

- [ ] **Step 2: Run** — `npx playwright test test/e2e/color-data.spec.ts` → PASS (fix any mismatched table entry in `lib/colors.ts`, not the test). If the relative import fails under Playwright's loader, use `@/lib/colors` only if `tsconfig` paths resolve there; otherwise keep the relative path.
- [ ] **Step 3: Commit** — `git commit -m "test(color): check CSS colour table against Chromium"`.

---

### Task 7: Wiring, sitemap and build gate

**Files:**
- Modify: `app/sitemap.ts` (import `COLORS`; add `/color/` priority 0.7 weekly after `/convert/`, and every `/color/<hex>/` priority 0.5 monthly)
- Modify: `components/Footer.tsx` (add `<Link href="/color/" className="foot-link">Color codes</Link>` after "Conversions")
- Modify: `app/tools/[slug]/page.tsx` (for slugs `color-converter` and `contrast-checker`, add a `section.related` titled "Color codes" with chips to `/color/ff6347/` tomato, `/color/663399/` rebeccapurple, `/color/64748b/` slate-500, `/color/3b82f6/` blue-500 and a `conv-chip parent` "All color codes →" to `/color/`; mirror the existing "Popular conversions" block)
- Test: `test/lib/indexing.test.ts` (append)

- [ ] **Step 1: Write the failing test** (append to `test/lib/indexing.test.ts`)

```ts
import { COLORS } from '@/lib/colors'

describe('sitemap colour pages', () => {
  it('lists the hub and every colour page', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toContain('https://dauntexlabs.com/color/')
    for (const c of COLORS) expect(urls).toContain(`https://dauntexlabs.com/color/${c.hex}/`)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/lib/indexing.test.ts` → FAIL on the hub URL.
- [ ] **Step 3: Implement** the three modifications.
- [ ] **Step 4: Full gate** — `npm run verify` → typecheck, all unit tests and build pass.
- [ ] **Step 5: Check the build output**
  - `ls out/color | wc -l` → `COLORS.length + 1` (dirs + `index.html`).
  - `grep -o '<title>[^<]*' out/color/ff6347/index.html` → `<title>Tomato color code: #ff6347 — dauntexlabs`.
  - `grep -c 'href="/color/"' out/tools/color-converter/index.html` → ≥ 1; same for `out/index.html` (footer).
  - `grep -rl '022c22' out/_next/static | wc -l` → `0` (colour tables not in client JS).
  - Build log "First Load JS shared by all" within +1 KB of the Task 1 baseline.
- [ ] **Step 6: Commit** — `git commit -m "feat(color): sitemap, footer and tool-page links to colour pages"`.

---

### Final: fresh reviewer

One fresh reviewer (most capable model) reads the spec, this plan and `git diff main...HEAD`, re-runs `npm run verify` and Task 7 Step 5, and checks each Review Focus line — in particular diffs all 242 Tailwind values against Tailwind v3.4 `src/public/colors.js`.
