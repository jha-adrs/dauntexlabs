# Tool Upgrades Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Chosen execution:** native, with parallel builder subagents on Tasks 1–8 after Task 0, then Task 9 sequentially, then one fresh reviewer on the whole branch.

**Goal:** Add About/FAQ content to 10 tool pages and upgrade random-number-generator, conversion-rate-calculator, date-calculator, css-gradient, contrast-checker and metar/taf-decoder, all client-side with no new dependencies.

**Architecture:** Non-trivial logic goes in a new or extended pure `lib/*.ts` with its own Vitest suite. The `'use client'` component composes `components/ui/kit.tsx` and only holds state. Each builder task owns a disjoint set of files. The two shared files (`lib/tool-content.ts`, `test/e2e/privacy.spec.ts`) are edited only in Task 0 and Task 9.

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, Vitest + RTL (jsdom), Playwright; Web Crypto (`crypto.getRandomValues`), `Intl.NumberFormat` / `Intl.DateTimeFormat`.

**Spec:** `docs/superpowers/specs/2026-11-05-tool-upgrades-batch-1-design.md`

## Global Constraints

- **No network for tool logic:** no `fetch`, XHR, WebSocket, `sendBeacon`, `EventSource`. User input never goes into the URL (path/query/hash), `document.title`, `localStorage`/`sessionStorage`, cookies or `console.*`.
- **No new runtime or dev dependencies.**
- **Shared First Load JS stays ~105 KB.** New `lib/*.ts` files are imported only from their own tool component (per-tool chunk) or from server-only `lib/tool-content/*`.
- **Workbench tokens only in new or edited styles:**
  - colours: `--accent`, `--accent-hover`, `--accent-tint`, `--danger`, `--danger-tint`, `--warn`, `--warn-tint`;
  - text and surfaces: `--fg`, `--mute`, `--mute-2`, `--line`, `--line-strong`, `--surface`, `--surface-soft`;
  - fonts: `--font-mono`, `--font-display`, `--font-sans`.
  - Never the legacy `--acid`, `--bone`, `--ink-*` or `--muted` in new code. Sentence case; no `textTransform: 'uppercase'` or letter-spacing on new labels.
- **Kit components only** (`Button, CopyButton, Field, TextArea, TextInput, Select, Toggle, Segmented, Toolbar, IO, Panel, Notice`). Don't invent CSS class names. Kit `Button` has no `aria-label` prop and `components/ui/kit.tsx` is shared, so don't edit it. Where an icon-like button needs an accessible name (`Remove stop N`, `Remove row N`), use a native `<button type="button" className="btn btn-ghost btn-sm" aria-label=…>`; those classes already exist. A `<Field label="X">` wraps its control in a `<label>`, so tests can use `getByLabelText('X')`.
- **Lib functions never throw into the UI.** User-input validation returns `{ ok: true; value: T } | { ok: false; error: string }`.
- **Content files:**
  - 1–3 intro paragraphs, 3–6 steps, 3–6 FAQs, 300–700 words;
  - hedged privacy wording ("runs in your browser", "processed on your device");
  - must not match `/never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?\b|no telemetry/i`;
  - describe only behaviour the component actually has.
- **Existing tests keep passing.** The one deliberate edit is listed in Task 6.
- **Conventional commits.** Don't push.

## Review Focus

1. **Random numbers with decimals or exclusions near the range edges** (e.g. min 0, max 1, 2 dp; or every value excluded). Expect values inside [min, max], exactly the chosen number of decimals, and a clear error instead of an infinite loop. Covered by the Task 3 tests `excludes every value → error` and `decimals stay in range`.
2. **Date maths in a non-UTC browser time zone around DST.** Expect the same ISO result whatever the time zone. Task 5 runs its lib suite with `TZ=America/New_York` as well as the default.
3. **Messy METAR/TAF pastes** (CRLF line endings, `=` terminators, indented TAF continuation lines, blank lines). Expect the right number of reports and no report split mid-TAF. Covered by the Task 8 test `splits CRLF + indented TAF`.
4. **A palette with shorthand, uppercase or junk entries.** Expect normalised `#rrggbb`, junk listed by value, at most 12 colours, and no crash. Covered by the Task 7 `parsePalette` tests.
5. **A gradient position typed as junk or left empty.** Expect that stop's position to be left out (valid CSS) and the preview to keep working. Covered by the Task 6 test `junk position is omitted`.

---

### Task 0: Baseline + content registry scaffold (sequential, before the builders)

**Files:**
- Create: `lib/tool-content/{css-gradient,contrast-checker,sql-formatter,email-signature-generator,conversion-rate-calculator,unit-converter,color-converter,image-compressor,image-resizer,merge-pdf}.ts`
- Modify: `lib/tool-content.ts`

**Interfaces:**
- Produces: 10 registered slugs. Each file default-exports a `ToolContent` whose arrays are empty, so `test/lib/tool-content.test.ts` is **red for exactly these 10 slugs** until Tasks 1, 2, 4, 6 and 7 fill them. Builders run that test filtered to their slug.

- [ ] **Step 1:** Run `npm run verify`. Expected: green. Record the "First Load JS shared by all" number from the build output.
- [ ] **Step 2:** Create each of the 10 files with this exact body:
  ```ts
  import type { ToolContent } from './types'
  const content: ToolContent = { intro: [], steps: [], faq: [] } // filled by batch-1 task
  export default content
  ```
- [ ] **Step 3:** Add 10 imports and 10 `'<slug>': <camelName>,` entries to `TOOL_CONTENT` in `lib/tool-content.ts`, appended after `'walkman-chanakya-to-unicode'`.
- [ ] **Step 4:** Run `npx vitest run test/lib/tool-content.test.ts`. Expected: only the 10 new slugs fail ("has 1–3 intro paragraphs…", "is 300–700 words"). Every existing slug passes.
- [ ] **Step 5:** Commit: `chore(content): scaffold batch-1 tool-content entries`.

---

## Builder tasks (parallel after Task 0; each owns only the files listed)

### Task 1: Content: sql-formatter, email-signature-generator, unit-converter, color-converter

**Files:**
- Modify: `lib/tool-content/sql-formatter.ts`, `lib/tool-content/email-signature-generator.ts`, `lib/tool-content/unit-converter.ts`, `lib/tool-content/color-converter.ts`
- Read first (don't edit): `components/tools/SqlFormatter.tsx`, `EmailSignatureGenerator.tsx`, `UnitConverter.tsx`, `ColorConverter.tsx`; `lib/tool-content/date-calculator.ts` (tone reference)

- [ ] **Step 1:** Run `npx vitest run test/lib/tool-content.test.ts -t "sql-formatter|email-signature-generator|unit-converter|color-converter"`. Expected: FAIL (empty arrays).
- [ ] **Step 2:** Write each file.
  - **What to cover:** the intro states what the tool does and who it is for. The steps match the real control labels in the component. The FAQs answer the real query intents below and state the tool's real limits.
  - **Target intents:**
    - sql-formatter: "sql formatter", "format sql query online", "sql beautifier". Say plainly that there is no dialect option and the only option is uppercase keywords, if the component confirms that. Mention that queries stay on your device, using hedged wording.
    - email-signature-generator: "email signature generator", "gmail signature", "outlook signature". Explain how to paste into Gmail and Outlook settings, but only the way the component actually outputs (read whether it copies HTML or text).
    - unit-converter: "unit converter", "metric to imperial". List the categories the component really has. Cross-link in text to the `/convert/` pages: "for a reference table, see the conversion pages".
    - color-converter: "hex to rgb", "rgb to hsl", "color converter". Cover only the formats the component outputs.
- [ ] **Step 3:** Run the Step 1 command again. Expected: PASS (4 slugs × 4 tests).
- [ ] **Step 4:** Commit: `docs(content): about/faq for sql-formatter, email-signature, unit and color converters`.

### Task 2: Content: image-compressor, image-resizer, merge-pdf

**Files:**
- Modify: `lib/tool-content/image-compressor.ts`, `lib/tool-content/image-resizer.ts`, `lib/tool-content/merge-pdf.ts`
- Read first: `components/tools/ImageCompressor.tsx`, `ImageResizer.tsx`, `MergePdf.tsx`

- [ ] **Step 1:** Run `npx vitest run test/lib/tool-content.test.ts -t "image-compressor|image-resizer|merge-pdf"`. Expected: FAIL.
- [ ] **Step 2:** Write the three files.
  - **Limits to state:** single file per run for the image tools, as of today. Do **not** mention batch, zip or target-KB; that is a separate, later upgrade. The image tools re-encode through the browser canvas, so metadata such as EXIF is dropped. Say this only if the component re-encodes via Canvas, which `CLAUDE.md` says it does.
  - **Target intents:**
    - image-compressor: "compress jpeg", "reduce image size", "compress png to webp".
    - image-resizer: "resize image", "resize image pixels", "change image dimensions".
    - merge-pdf: "merge pdf", "combine pdf files". Mention that files are combined on your device using the bundled pdf-lib library, with hedged wording, and how page order is set.
- [ ] **Step 3:** Run the Step 1 command again. Expected: PASS.
- [ ] **Step 4:** Commit: `docs(content): about/faq for image compressor, image resizer, merge pdf`.

### Task 3: random-number-generator

**Files:**
- Create: `lib/random.ts`, `test/lib/random.test.ts`
- Modify: `components/tools/RandomNumberGenerator.tsx` (replace the inline `randomIntInRange` and `generateNumbers`), `test/tools/RandomNumberGenerator.test.tsx` (append cases; the existing 8 are untouched), `lib/tool-content/random-number-generator.ts`

**Interfaces:**
- Produces (`lib/random.ts`):
  ```ts
  export type Source = (buf: Uint32Array) => Uint32Array // default: (b) => crypto.getRandomValues(b)
  export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
  export function randomBelow(n: number, src?: Source): number // uniform integer in [0, n); 1 ≤ n ≤ 2**32
  export type NumberOpts = { min: number; max: number; count: number; decimals: number; unique: boolean; exclude: number[]; sort: 'none' | 'asc' | 'desc' }
  export function generateNumbers(o: NumberOpts, src?: Source): Result<number[]>
  export function parseExclude(text: string): Result<number[]>
  export function rollDice(count: number, sides: number, src?: Source): { rolls: number[]; total: number }
  export function flipCoins(count: number, src?: Source): ('Heads' | 'Tails')[]
  export type LotteryPreset = { id: string; label: string; main: { count: number; max: number }; bonus?: { count: number; max: number } }
  export const LOTTERY_PRESETS: LotteryPreset[]
  export function drawLottery(p: LotteryPreset, src?: Source): { main: number[]; bonus: number[] }
  ```

- [ ] **Step 1: Write the failing lib tests** in `test/lib/random.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { randomBelow, generateNumbers, parseExclude, rollDice, flipCoins, drawLottery, LOTTERY_PRESETS, type NumberOpts } from '@/lib/random'

  const seq = (...vals: number[]) => { let i = 0; return (b: Uint32Array) => { for (let k = 0; k < b.length; k++) b[k] = vals[i++ % vals.length]; return b } }
  const base: NumberOpts = { min: 1, max: 6, count: 1, decimals: 0, unique: false, exclude: [], sort: 'none' }
  const val = <T,>(r: { ok: boolean; value?: T; error?: string }) => { if (!r.ok) throw new Error(r.error); return r.value as T }

  describe('randomBelow', () => {
    it('rejects draws at or above the unbiased limit', () => {
      // n=3: limit = 2**32 - (2**32 % 3) = 4294967295, so 0xFFFFFFFF is rejected and 4 % 3 = 1 is returned
      expect(randomBelow(3, seq(0xffffffff, 4))).toBe(1)
    })
    it('returns 0 for n = 1', () => expect(randomBelow(1, seq(123))).toBe(0))
  })

  describe('generateNumbers', () => {
    it('integers stay in range and hit every face', () => {
      const v = val(generateNumbers({ ...base, count: 1000 }))
      expect(v.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)).toBe(true)
      expect(new Set(v).size).toBe(6)
    })
    it('decimals stay in range with at most 2 places', () => {
      const v = val(generateNumbers({ ...base, min: 0, max: 1, decimals: 2, count: 500 }))
      expect(v.every((n) => n >= 0 && n <= 1 && Math.abs(n * 100 - Math.round(n * 100)) < 1e-9)).toBe(true)
    })
    it('honours the exclude list', () => {
      const v = val(generateNumbers({ ...base, max: 5, count: 200, exclude: [2, 4] }))
      expect([...new Set(v)].every((n) => [1, 3, 5].includes(n))).toBe(true)
    })
    it('unique + exclude returns the only remaining values', () => {
      expect(val(generateNumbers({ ...base, max: 5, count: 3, unique: true, exclude: [1, 2], sort: 'asc' }))).toEqual([3, 4, 5])
    })
    it('unique count larger than the allowed pool → error', () => {
      const r = generateNumbers({ ...base, max: 5, count: 4, unique: true, exclude: [1, 2] })
      expect(r).toEqual({ ok: false, error: expect.stringMatching(/Cannot generate 4 unique/) })
    })
    it('excludes every value → error', () => {
      expect(generateNumbers({ ...base, max: 2, count: 1, exclude: [1, 2] })).toEqual({ ok: false, error: 'Every value in the range is excluded.' })
    })
    it('sorts ascending and descending', () => {
      const a = val(generateNumbers({ ...base, max: 1000, count: 50, sort: 'asc' }))
      expect(a).toEqual([...a].sort((x, y) => x - y))
      const d = val(generateNumbers({ ...base, max: 1000, count: 50, sort: 'desc' }))
      expect(d).toEqual([...d].sort((x, y) => y - x))
    })
    it('range larger than 2^32 steps → error', () => {
      expect(generateNumbers({ ...base, min: 0, max: 1e9, decimals: 2 })).toEqual({ ok: false, error: expect.stringMatching(/too large/i) })
    })
    it('unique sampling covers a large range without repeats', () => {
      const v = val(generateNumbers({ ...base, min: 1, max: 1_000_000, count: 1000, unique: true }))
      expect(new Set(v).size).toBe(1000)
    })
  })

  describe('parseExclude', () => {
    it('reads commas, spaces and newlines', () => expect(parseExclude('3, 7\n10 -2')).toEqual({ ok: true, value: [3, 7, 10, -2] }))
    it('empty → []', () => expect(parseExclude('  ')).toEqual({ ok: true, value: [] }))
    it('junk → error naming the token', () => expect(parseExclude('3, x')).toEqual({ ok: false, error: 'Could not read "x" in the exclude list.' }))
  })

  describe('dice, coins, lottery', () => {
    it('rollDice maps draws to faces and totals them', () => expect(rollDice(3, 6, seq(0, 1, 2))).toEqual({ rolls: [1, 2, 3], total: 6 }))
    it('flipCoins: even → Heads, odd → Tails', () => expect(flipCoins(3, seq(0, 1, 0))).toEqual(['Heads', 'Tails', 'Heads']))
    it('presets are the four neutral formats', () => expect(LOTTERY_PRESETS.map((p) => p.label)).toEqual(['6 from 49', '6 from 59', '5 from 69 + 1 from 26', '5 from 50 + 2 from 12']))
    it('drawLottery gives sorted unique main numbers and a separate bonus', () => {
      for (const p of LOTTERY_PRESETS) {
        const { main, bonus } = drawLottery(p)
        expect(main).toHaveLength(p.main.count)
        expect(new Set(main).size).toBe(p.main.count)
        expect(main).toEqual([...main].sort((a, b) => a - b))
        expect(main.every((n) => n >= 1 && n <= p.main.max)).toBe(true)
        expect(bonus).toHaveLength(p.bonus?.count ?? 0)
        expect(bonus.every((n) => n >= 1 && n <= (p.bonus?.max ?? 0))).toBe(true)
      }
    })
  })
  ```
- [ ] **Step 2:** Run `npx vitest run test/lib/random.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `lib/random.ts`.**
  - **Rejection rule:** `limit = 2**32 - (2**32 % n)`; redraw while `draw >= limit`; return `draw % n`.
  - **Decimals:** work on a scaled integer grid, `steps = Math.round((max - min) * 10**d) + 1`. Return `> 2**32` → `{ ok:false, error:'Range too large for that many decimal places.' }`. A value is `Number(((minScaled + k) / 10**d).toFixed(d))`. Exclusions are compared on the scaled grid.
  - **Unique:**
    - check that `count ≤ steps − excluded-in-range`, else error `Cannot generate ${count} unique values from ${available} available (${min}–${max}).`;
    - when `steps ≤ 10_000`, use a partial Fisher–Yates over the allowed pool, with `randomBelow(i + 1)`;
    - otherwise use Set rejection.
  - **Non-unique with exclusions:** redraw an excluded value. If every value is excluded, return the error above **before** drawing.
  - **Dice:** `rollDice` uses `1 + randomBelow(sides)`.
  - **Coins:** `flipCoins` uses `randomBelow(2) === 0 ? 'Heads' : 'Tails'`.
  - **Lottery:** `LOTTERY_PRESETS` has ids `'6-49'`, `'6-59'`, `'5-69+1-26'`, `'5-50+2-12'`. `drawLottery` draws main and bonus independently, both unique and ascending.
- [ ] **Step 4:** Run `npx vitest run test/lib/random.test.ts`. Expected: PASS.
- [ ] **Step 5: Append the failing component tests** to `test/tools/RandomNumberGenerator.test.tsx`:
  ```tsx
  describe('RandomNumberGenerator upgrades', () => {
    const resultText = () => (document.querySelector('div[style*="pre-wrap"]') as HTMLElement).textContent!
    it('decimal places: 2', () => {
      render(<RandomNumberGenerator />)
      const [min, max, count] = screen.getAllByRole('spinbutton')
      fireEvent.change(min, { target: { value: '0' } }); fireEvent.change(max, { target: { value: '1' } }); fireEvent.change(count, { target: { value: '5' } })
      fireEvent.change(screen.getByLabelText('Decimal places'), { target: { value: '2' } })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))
      resultText().split(',').map((s) => s.trim()).forEach((s) => expect(s).toMatch(/^[01]\.\d{2}$/))
    })
    it('exclude list leaves only 3', () => {
      render(<RandomNumberGenerator />)
      const [min, max, count] = screen.getAllByRole('spinbutton')
      fireEvent.change(min, { target: { value: '1' } }); fireEvent.change(max, { target: { value: '3' } }); fireEvent.change(count, { target: { value: '20' } })
      fireEvent.change(screen.getByLabelText('Exclude'), { target: { value: '1, 2' } })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))
      expect(new Set(resultText().split(',').map((s) => s.trim()))).toEqual(new Set(['3']))
    })
    it('sort ascending', () => {
      render(<RandomNumberGenerator />)
      const [, , count] = screen.getAllByRole('spinbutton')
      fireEvent.change(count, { target: { value: '30' } })
      fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'asc' } })
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))
      const v = resultText().split(',').map((s) => Number(s.trim()))
      expect(v).toEqual([...v].sort((a, b) => a - b))
    })
    it('dice mode shows a total', () => {
      render(<RandomNumberGenerator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Dice' }))
      fireEvent.click(screen.getByRole('button', { name: 'Roll' }))
      expect(screen.getByText(/^Total \d+$/)).toBeInTheDocument()
    })
    it('coin mode shows a heads/tails count', () => {
      render(<RandomNumberGenerator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Coin' }))
      fireEvent.click(screen.getByRole('button', { name: 'Flip' }))
      expect(screen.getByText(/^\d+ heads · \d+ tails$/)).toBeInTheDocument()
    })
    it('lottery mode draws 6 numbers for 6 from 49', () => {
      render(<RandomNumberGenerator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Lottery' }))
      fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
      expect(screen.getByLabelText('Main numbers').textContent!.split(',').map((s) => s.trim())).toHaveLength(6)
    })
  })
  ```
- [ ] **Step 6:** Run `npx vitest run test/tools/RandomNumberGenerator.test.tsx`. Expected: the new cases FAIL and the old 8 PASS.
- [ ] **Step 7: Update the component.**
  - **Mode tabs:** a `Segmented` at the top with `Numbers | Dice | Coin | Lottery`. In Numbers mode the DOM order is Min, Max, Count (the only `spinbutton`s, so the existing `setup()` still works), then the "Unique values" toggle, then:
    - `Field "Decimal places"` → `Select` with options `0`–`6`;
    - `Field "Exclude"` → `TextInput` (text) with placeholder `e.g. 3, 7, 13`;
    - `Field "Sort"` → `Select` with options `none`/`asc`/`desc`, labelled `No sorting`/`Ascending`/`Descending`.
  - **Number formatting:** display every value with `toFixed(decimals)`, so 1 at 2 dp shows as `1.00`. The copy text uses the same strings.
  - **Numbers output:** keep the existing `Generate` button and the output markup. The single result stays in a div with `fontSize: '3rem'`, the list in a div with `whiteSpace: 'pre-wrap'`, and the footer stays `N number(s) · range …`. Swap the legacy tokens in that markup for Workbench ones (`--accent`, `--fg`, `--surface-soft`, `--mute`), and drop the uppercase and letter-spacing on the footer.
  - **Dice:** `Field "Number of dice"` (`TextInput` number, default `2`, 1–100) and `Field "Sides"` (`Select`: d4 … d100, default `6`). The `Roll` button shows the rolls and a `Total N` line.
  - **Coin:** `Field "Number of coins"` (default `1`, 1–100). The `Flip` button shows the results and `${h} heads · ${t} tails`.
  - **Lottery:** `Field "Game"` (`Select` over `LOTTERY_PRESETS`). The `Draw` button shows the main numbers in an element with `aria-label="Main numbers"` (comma-separated), and the bonus numbers in `aria-label="Bonus numbers"` when the preset has them.
  - **Errors:** every `{ ok: false }` result renders through the existing `<Notice kind="error">`.
  - **Notes:**
    - The non-Numbers modes use number inputs, so the extra spinbuttons only exist once the user switches mode.
    - Error texts already asserted by the existing tests must stay exactly as they are: `Min must be less than or equal to Max.`, `Count must be at least 1.` and `Cannot generate 5 unique…`.
- [ ] **Step 8:** Run `npx vitest run test/tools/RandomNumberGenerator.test.tsx test/lib/random.test.ts`. Expected: PASS.
- [ ] **Step 9: Update `lib/tool-content/random-number-generator.ts`.**
  - Replace the FAQ "Can it generate decimals or negative numbers?" so it says decimals up to 6 places are supported.
  - Add the exclude, sort and dice/coin/lottery modes to the steps or FAQ.
  - Rewrite the lottery FAQ around the Lottery tab.
  - Stay within 3–6 FAQs and 300–700 words.
  - Run `npx vitest run test/lib/tool-content.test.ts -t random-number-generator`. Expected: PASS.
- [ ] **Step 10:** Commit: `feat(random-number-generator): decimals, exclude, sort, dice/coin/lottery modes`.

### Task 4: conversion-rate-calculator

**Files:**
- Create: `lib/conversion-rate.ts`, `test/lib/conversion-rate.test.ts`
- Modify: `components/tools/ConversionRateCalculator.tsx`, `test/tools/ConversionRateCalculator.test.tsx` (append), `lib/tool-content/conversion-rate-calculator.ts` (fill)

**Interfaces:**
- Produces:
  ```ts
  export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
  export function conversionRate(conversions: number, visits: number): Result<number> // percent
  export function visitsNeeded(conversions: number, ratePct: number): Result<number>
  export function conversionsNeeded(visits: number, ratePct: number): Result<number>
  export function revenue(conversions: number, visits: number, aov: number): { revenue: number; perVisitor: number }
  export function comparePeriods(prev: { conversions: number; visits: number }, cur: { conversions: number; visits: number }): Result<{ before: number; after: number; pointsChange: number; relativeChange: number | null }>
  export function formatMoney(amount: number, currency: 'USD' | 'EUR' | 'GBP' | 'INR'): string
  ```

- [ ] **Step 1: Write the failing lib tests** in `test/lib/conversion-rate.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { conversionRate, visitsNeeded, conversionsNeeded, revenue, comparePeriods, formatMoney } from '@/lib/conversion-rate'

  describe('conversion-rate', () => {
    it('rate', () => {
      expect(conversionRate(25, 500)).toEqual({ ok: true, value: 5 })
      expect(conversionRate(10, 0)).toEqual({ ok: false, error: 'Visits must be greater than zero.' })
      expect(conversionRate(-1, 5)).toEqual({ ok: false, error: 'Conversions cannot be negative.' })
      expect(conversionRate(600, 500)).toEqual({ ok: false, error: 'Conversions cannot exceed total visits.' })
    })
    it('visits needed rounds up and ignores float noise', () => {
      expect(visitsNeeded(50, 2.5)).toEqual({ ok: true, value: 2000 })
      expect(visitsNeeded(10, 3)).toEqual({ ok: true, value: 334 })
      expect(visitsNeeded(50, 0)).toEqual({ ok: false, error: 'Conversion rate must be greater than 0% and at most 100%.' })
      expect(visitsNeeded(50, 101).ok).toBe(false)
    })
    it('conversions needed rounds up', () => {
      expect(conversionsNeeded(2000, 2.5)).toEqual({ ok: true, value: 50 })
      expect(conversionsNeeded(1000, 3)).toEqual({ ok: true, value: 30 })
      expect(conversionsNeeded(1000, 3.33)).toEqual({ ok: true, value: 34 })
    })
    it('revenue and revenue per visitor', () => expect(revenue(25, 500, 40)).toEqual({ revenue: 1000, perVisitor: 2 }))
    it('compare two periods', () => {
      const r = comparePeriods({ conversions: 20, visits: 500 }, { conversions: 25, visits: 500 })
      if (!r.ok) throw new Error(r.error)
      expect(r.value.before).toBeCloseTo(4); expect(r.value.after).toBeCloseTo(5)
      expect(r.value.pointsChange).toBeCloseTo(1); expect(r.value.relativeChange).toBeCloseTo(25)
      const z = comparePeriods({ conversions: 0, visits: 100 }, { conversions: 5, visits: 100 })
      expect(z.ok && z.value.relativeChange).toBeNull()
    })
    it('formats money per currency', () => {
      expect(formatMoney(1000, 'USD')).toBe('$1,000.00')
      expect(formatMoney(1000, 'EUR')).toBe('€1,000.00')
      expect(formatMoney(1000, 'GBP')).toBe('£1,000.00')
      expect(formatMoney(100000, 'INR')).toBe('₹1,00,000.00')
    })
  })
  ```
- [ ] **Step 2:** Run `npx vitest run test/lib/conversion-rate.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `lib/conversion-rate.ts`.**
  - **Validation:** `conversionRate` returns the four existing error strings, verbatim from today's component, in this order: NaN (`Enter valid numbers for conversions and visits.`), visits ≤ 0, conversions < 0, conversions > visits.
  - **Solvers:**
    - Rates outside `(0, 100]` give the error shown in the test.
    - `visitsNeeded` = `Math.ceil(conversions * 100 / rate - 1e-9)`.
    - `conversionsNeeded` = `Math.ceil(visits * rate / 100 - 1e-9)`.
    - Negative inputs give `Values cannot be negative.`
  - **`comparePeriods`:** validates both periods with `conversionRate`. `relativeChange` is `null` when `before === 0`.
  - **`formatMoney`:** `Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency })`.
- [ ] **Step 4:** Run `npx vitest run test/lib/conversion-rate.test.ts`. Expected: PASS.
- [ ] **Step 5: Append the failing component tests:**
  ```tsx
  describe('ConversionRateCalculator upgrades', () => {
    const type = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })
    it('AOV gives revenue and revenue per visitor in the chosen currency', () => {
      render(<ConversionRateCalculator />)
      type('e.g. 25', '25'); type('e.g. 500', '500'); type('e.g. 40', '40')
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
      expect(screen.getByText('$2.00')).toBeInTheDocument()
      fireEvent.change(screen.getByDisplayValue('USD ($)'), { target: { value: 'INR' } })
      expect(screen.getByText('₹1,000.00')).toBeInTheDocument()
    })
    it('visits needed mode', () => {
      render(<ConversionRateCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Visits needed' }))
      type('e.g. 50', '50'); type('e.g. 2.5', '2.5')
      expect(screen.getByText('2,000')).toBeInTheDocument()
    })
    it('conversions needed mode', () => {
      render(<ConversionRateCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Conversions needed' }))
      type('e.g. 2000', '2000'); type('e.g. 2.5', '2.5')
      expect(screen.getByText('50')).toBeInTheDocument()
    })
    it('compare with a previous period', () => {
      render(<ConversionRateCalculator />)
      type('e.g. 25', '25'); type('e.g. 500', '500')
      fireEvent.click(screen.getByLabelText('Compare with a previous period'))
      type('e.g. 20', '20'); type('e.g. 480', '500')
      expect(screen.getByText('+1.00 percentage points')).toBeInTheDocument()
      expect(screen.getByText('+25.0%')).toBeInTheDocument()
    })
  })
  ```
- [ ] **Step 6:** Run `npx vitest run test/tools/ConversionRateCalculator.test.tsx`. Expected: the new cases FAIL and the 6 existing cases PASS.
- [ ] **Step 7: Update the component.**
  - **Mode tabs:** a `Segmented` with `Conversion rate | Visits needed | Conversions needed`. Only the active mode's inputs render.
  - **Conversion rate mode:**
    - keep the `Conversions` field (`e.g. 25`), the `Total Visits` field (`e.g. 500`), the info and error notices, and the rate card showing `x.xx%`;
    - add `Field "Average order value (optional)"` (`TextInput` number, `e.g. 40`) with the currency `Select` (same `CURRENCY_OPTIONS`) next to it, and **remove the select from the top toolbar**;
    - when AOV > 0 and the rate is valid, show cards labelled `Revenue` and `Revenue per visitor`, each rendering `formatMoney(...)` as the whole text of its value element;
    - `Toggle "Compare with a previous period"` reveals `Previous conversions` (`e.g. 20`) and `Previous visits` (`e.g. 480`). The result shows `Previous x.xx% → current y.yy%`, then a separate element `${sign}${abs(points).toFixed(2)} percentage points`, then a separate element `${sign}${relative.toFixed(1)}%`. The sign is `+` if > 0, `-` if < 0, and empty if 0. The relative element is left out when `null`.
  - **Visits needed mode:** `Target conversions` (`e.g. 50`) and `Conversion rate (%)` (`e.g. 2.5`). The value element is `toLocaleString('en-US')`, with the sub-text `visits needed`.
  - **Conversions needed mode:** `Visits` (`e.g. 2000`) and `Conversion rate (%)` (`e.g. 2.5`). The value element shows the number, with the sub-text `conversions needed`.
  - **Styles:** Workbench tokens; drop the uppercase on `LABEL_STYLE`.
- [ ] **Step 8:** Run `npx vitest run test/tools/ConversionRateCalculator.test.tsx test/lib/conversion-rate.test.ts`. Expected: PASS.
- [ ] **Step 9: Fill `lib/tool-content/conversion-rate-calculator.ts`.**
  - Target intents: "conversion rate calculator", "how to calculate conversion rate", "how many visitors do I need", "revenue per visitor".
  - Give the formula in plain text: conversions ÷ visits × 100.
  - Cover the three modes, AOV and comparison.
  - Run `npx vitest run test/lib/tool-content.test.ts -t conversion-rate-calculator`. Expected: PASS.
- [ ] **Step 10:** Commit: `feat(conversion-rate-calculator): solve-for modes, AOV revenue, period comparison`.

### Task 5: date-calculator

**Files:**
- Create: `lib/date-calc.ts`, `test/lib/date-calc.test.ts`
- Modify: `components/tools/DateCalculator.tsx` (move `addDate` logic into the lib), `test/tools/DateCalculator.test.tsx` (append), `lib/tool-content/date-calculator.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
  export type Delta = { years: number; months: number; weeks: number; days: number }
  export type Weekend = 'sat-sun' | 'fri-sat' | 'sun'
  export function addCalendar(startIso: string, d: Delta, sign: 1 | -1): Result<string> // ISO YYYY-MM-DD
  export function addBusinessDays(startIso: string, n: number, sign: 1 | -1, weekend: Weekend, holidays: Set<string>): Result<string>
  export function parseHolidays(text: string): { dates: string[]; invalid: string[] }
  export function dateFormats(iso: string): { iso: string; long: string; weekday: string; dayOfYear: number; isoWeek: string; unix: number; dmy: string; mdy: string }
  ```

- [ ] **Step 1: Write the failing lib tests** in `test/lib/date-calc.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { addCalendar, addBusinessDays, parseHolidays, dateFormats } from '@/lib/date-calc'

  const v = (r: { ok: boolean; value?: string; error?: string }) => { if (!r.ok) throw new Error(r.error); return r.value }
  const D = (o: Partial<{ years: number; months: number; weeks: number; days: number }>) => ({ years: 0, months: 0, weeks: 0, days: 0, ...o })
  const none = new Set<string>()

  describe('addCalendar', () => {
    it('applies months before days', () => expect(v(addCalendar('2020-01-31', D({ months: 1, days: 1 }), 1))).toBe('2020-03-01'))
    it('adds all four units', () => expect(v(addCalendar('2020-01-01', D({ years: 1, months: 2, weeks: 1, days: 3 }), 1))).toBe('2021-03-11'))
    it('subtracts all four units', () => expect(v(addCalendar('2021-03-11', D({ years: 1, months: 2, weeks: 1, days: 3 }), -1))).toBe('2020-01-01'))
    it('clamps Feb 29 + 1 year', () => expect(v(addCalendar('2020-02-29', D({ years: 1 }), 1))).toBe('2021-02-28'))
    it('rejects a bad date', () => expect(addCalendar('2020-13-01', D({}), 1).ok).toBe(false))
  })

  describe('addBusinessDays (2026-11-05 is a Thursday)', () => {
    it('Sat–Sun weekend', () => {
      expect(v(addBusinessDays('2026-11-05', 1, 1, 'sat-sun', none))).toBe('2026-11-06')
      expect(v(addBusinessDays('2026-11-05', 2, 1, 'sat-sun', none))).toBe('2026-11-09')
      expect(v(addBusinessDays('2026-11-05', 5, 1, 'sat-sun', none))).toBe('2026-11-12')
    })
    it('Fri–Sat weekend', () => expect(v(addBusinessDays('2026-11-05', 1, 1, 'fri-sat', none))).toBe('2026-11-08'))
    it('Sunday-only weekend', () => expect(v(addBusinessDays('2026-11-05', 2, 1, 'sun', none))).toBe('2026-11-07'))
    it('skips a holiday', () => expect(v(addBusinessDays('2026-11-05', 1, 1, 'sat-sun', new Set(['2026-11-06'])))).toBe('2026-11-09'))
    it('subtracts', () => expect(v(addBusinessDays('2026-11-09', 1, -1, 'sat-sun', none))).toBe('2026-11-06'))
    it('starting on a Saturday', () => expect(v(addBusinessDays('2026-11-07', 1, 1, 'sat-sun', none))).toBe('2026-11-09'))
    it('0 returns the start date', () => expect(v(addBusinessDays('2026-11-05', 0, 1, 'sat-sun', none))).toBe('2026-11-05'))
  })

  describe('parseHolidays', () => {
    it('reads dates anywhere and reports lines without a valid date', () =>
      expect(parseHolidays('2026-01-26 Republic Day\n2026-08-15, 2026-10-02\nnot a date\n2026-02-30\n')).toEqual({
        dates: ['2026-01-26', '2026-08-15', '2026-10-02'],
        invalid: ['not a date', '2026-02-30'],
      }))
  })

  describe('dateFormats', () => {
    it('2026-11-05', () =>
      expect(dateFormats('2026-11-05')).toEqual({
        iso: '2026-11-05', long: 'November 5, 2026', weekday: 'Thursday', dayOfYear: 309,
        isoWeek: '2026-W45', unix: 1793836800, dmy: '05/11/2026', mdy: '11/05/2026',
      }))
    it('ISO week edges', () => {
      expect(dateFormats('2021-01-01').isoWeek).toBe('2020-W53')
      expect(dateFormats('2026-12-31').isoWeek).toBe('2026-W53')
      expect(dateFormats('2026-12-31').dayOfYear).toBe(365)
    })
  })
  ```
- [ ] **Step 2:** Run `npx vitest run test/lib/date-calc.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `lib/date-calc.ts`.**
  - **UTC throughout:** parse with `Date.UTC`, step with `setUTCDate`, and format with `timeZone: 'UTC'`. Reject non-round-tripping dates (`2020-13-01`, `2026-02-30`).
  - **`addCalendar`:** order is years (clamp to month length), then months (same clamp as today's component), then `weeks*7 + days`.
  - **`addBusinessDays`:**
    - weekend day sets (`getUTCDay`): sat-sun `{6,0}`, fri-sat `{5,6}`, sun `{0}`;
    - require `n` to be an integer from 0 to 10,000, else `{ ok:false, error:'Enter a whole number of business days from 0 to 10,000.' }`;
    - cap the walk at 100,000 calendar days, then return `Too many holidays: no working day found.`
  - **`parseHolidays`:** split on newlines and commas, trim, drop empties. Each piece contributes its first `\d{4}-\d{2}-\d{2}` if that date is valid; otherwise the piece goes in `invalid`. Dedupe `dates` and keep their order.
  - **`dateFormats`:** `long` uses `en-US` `{ year:'numeric', month:'long', day:'numeric', timeZone:'UTC' }`. `unix` is `Date.UTC(...)/1000`.
- [ ] **Step 4:** Run `npx vitest run test/lib/date-calc.test.ts && TZ=America/New_York npx vitest run test/lib/date-calc.test.ts && TZ=Asia/Kolkata npx vitest run test/lib/date-calc.test.ts`. Expected: PASS ×3.
- [ ] **Step 5: Append the failing component tests:**
  ```tsx
  describe('DateCalculator upgrades', () => {
    it('adds a second unit row', () => {
      render(<DateCalculator />)
      setStart('2020-01-31'); setAmount('1'); setUnit('months')
      fireEvent.click(screen.getByRole('button', { name: 'Add unit' }))
      fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1' } })
      expect(screen.getByText('2020-03-01')).toBeInTheDocument()
    })
    it('business days skip the weekend', () => {
      render(<DateCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Business days' }))
      setStart('2026-11-05')
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '2' } })
      expect(screen.getByText('2026-11-09')).toBeInTheDocument()
      expect(screen.getByText('Monday')).toBeInTheDocument()
    })
    it('weekend choice and holidays', () => {
      render(<DateCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Business days' }))
      setStart('2026-11-05')
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText('Weekend'), { target: { value: 'fri-sat' } })
      expect(screen.getByText('2026-11-08')).toBeInTheDocument()
      fireEvent.change(screen.getByLabelText('Weekend'), { target: { value: 'sat-sun' } })
      fireEvent.change(screen.getByLabelText('Holidays (optional)'), { target: { value: '2026-11-06' } })
      expect(screen.getByText('2026-11-09')).toBeInTheDocument()
      expect(screen.getByText('1 holiday read')).toBeInTheDocument()
    })
    it('shows extra formats', () => {
      render(<DateCalculator />)
      setStart('2026-11-05'); setAmount('0')
      for (const t of ['2026-W45', '309', '1793836800', '05/11/2026', '11/05/2026']) expect(screen.getByText(t)).toBeInTheDocument()
    })
    it('Today fills the start date', () => {
      render(<DateCalculator />)
      fireEvent.click(screen.getByRole('button', { name: 'Today' }))
      expect((screen.getByLabelText('Start date') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
  ```
- [ ] **Step 6:** Run `npx vitest run test/tools/DateCalculator.test.tsx`. Expected: the new cases FAIL and the 9 existing cases PASS.
- [ ] **Step 7: Update the component.**
  - **Layout:** keep the `Add | Subtract` Segmented. Add a second Segmented `Calendar | Business days`, and a `Today` button (kit `Button`) next to the start date input.
  - **Calendar mode:**
    - the first row is unchanged (Amount `placeholder="1"`, Unit `Select` with `Days` by default);
    - the `Add unit` button appends a row with `placeholder="0"`, empty amount, and the first unit not already used, in the order days, weeks, months, years. It is disabled once there are 4 rows;
    - each added row has a native `Remove` button (`aria-label="Remove row N"`; see Global Constraints);
    - amounts are summed per unit into a `Delta`.
  - **Business days mode:**
    - `Field "Business days"` (`TextInput` number, `placeholder="e.g. 10"`);
    - `Field "Weekend"` (`Select`: `sat-sun` → `Saturday and Sunday`, `fri-sat` → `Friday and Saturday`, `sun` → `Sunday only`);
    - `Field "Holidays (optional)"` (`TextArea`, `rows={4}`, `mono`, placeholder `One date per line, e.g. 2026-01-26 Republic Day`);
    - under it, `${n} holiday(s) read`, plus `Could not read: …` when there are invalid entries.
  - **Result panel:**
    - the existing big ISO date, the long date and the weekday, each as its own element;
    - then a small two-column list: `Day of year`, `ISO week`, `Unix timestamp (00:00 UTC)`, `DD/MM/YYYY` and `MM/DD/YYYY`, each value in its own element;
    - do not repeat the ISO string or the weekday in that list (the existing tests use exact `getByText`).
  - **Copy:** the copy text stays `${iso} (${weekday})`.
  - **Styles:** Workbench tokens; drop the uppercase weekday style.
- [ ] **Step 8:** Run `npx vitest run test/tools/DateCalculator.test.tsx test/lib/date-calc.test.ts`. Expected: PASS.
- [ ] **Step 9: Update `lib/tool-content/date-calculator.ts`.**
  - Rewrite the FAQ "Can it count business days only?" as a yes: weekend choices, pasted holidays, and the start date is not counted.
  - Mention multi-unit rows in the steps.
  - Run `npx vitest run test/lib/tool-content.test.ts -t date-calculator`. Expected: PASS.
- [ ] **Step 10:** Commit: `feat(date-calculator): business days, multi-unit add, extra output formats`.

### Task 6: css-gradient

**Files:**
- Create: `lib/gradient.ts`, `test/lib/gradient.test.ts`
- Modify: `components/tools/CssGradient.tsx`, `test/tools/CssGradient.test.tsx`, `lib/tool-content/css-gradient.ts` (fill)

**Interfaces:**
- Produces:
  ```ts
  export type GradientType = 'linear' | 'radial' | 'conic'
  export type Interp = 'default' | 'srgb' | 'oklch'
  export type Stop = { color: string; pos: number | null } // pos in %, null = omitted
  export type Gradient = { type: GradientType; angle: number; interp: Interp; stops: Stop[] }
  export function gradientCss(g: Gradient): string           // the value, without "background:"
  export function cssOutput(g: Gradient): string             // one or two "background: …;" lines joined by "\n"
  export function tailwindClass(g: Gradient): string
  export function parsePosition(text: string): number | null // "25%", "25", " 25 % " → 25; "" / junk → null
  export const PRESETS: (Gradient & { name: string })[]
  ```

- [ ] **Step 1: Write the failing lib tests** in `test/lib/gradient.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { gradientCss, cssOutput, tailwindClass, parsePosition, PRESETS, type Gradient } from '@/lib/gradient'

  const g: Gradient = { type: 'linear', angle: 90, interp: 'default', stops: [{ color: '#c6f24e', pos: 0 }, { color: '#1a1a2e', pos: 100 }] }

  describe('gradientCss', () => {
    it('linear', () => expect(gradientCss(g)).toBe('linear-gradient(90deg, #c6f24e 0%, #1a1a2e 100%)'))
    it('radial has no angle', () => expect(gradientCss({ ...g, type: 'radial' })).toBe('radial-gradient(circle, #c6f24e 0%, #1a1a2e 100%)'))
    it('conic uses from', () => expect(gradientCss({ ...g, type: 'conic', angle: 45 })).toBe('conic-gradient(from 45deg, #c6f24e 0%, #1a1a2e 100%)'))
    it('interpolation clause per type', () => {
      expect(gradientCss({ ...g, interp: 'oklch' })).toBe('linear-gradient(90deg in oklch, #c6f24e 0%, #1a1a2e 100%)')
      expect(gradientCss({ ...g, type: 'radial', interp: 'srgb' })).toBe('radial-gradient(circle in srgb, #c6f24e 0%, #1a1a2e 100%)')
      expect(gradientCss({ ...g, type: 'conic', angle: 45, interp: 'oklch' })).toBe('conic-gradient(from 45deg in oklch, #c6f24e 0%, #1a1a2e 100%)')
    })
    it('keeps list order and supports 3+ stops', () =>
      expect(gradientCss({ ...g, stops: [{ color: '#000000', pos: 0 }, { color: '#ff0000', pos: 50 }, { color: '#ffffff', pos: 100 }] }))
        .toBe('linear-gradient(90deg, #000000 0%, #ff0000 50%, #ffffff 100%)'))
    it('junk position is omitted', () =>
      expect(gradientCss({ ...g, stops: [{ color: '#000000', pos: parsePosition('abc') }, { color: '#ffffff', pos: 100 }] }))
        .toBe('linear-gradient(90deg, #000000, #ffffff 100%)'))
  })

  describe('cssOutput', () => {
    it('one line by default', () => expect(cssOutput(g)).toBe('background: linear-gradient(90deg, #c6f24e 0%, #1a1a2e 100%);'))
    it('fallback first when an interpolation is set', () =>
      expect(cssOutput({ ...g, interp: 'oklch' })).toBe(
        'background: linear-gradient(90deg, #c6f24e 0%, #1a1a2e 100%);\nbackground: linear-gradient(90deg in oklch, #c6f24e 0%, #1a1a2e 100%);'))
  })

  describe('tailwindClass', () => {
    it('linear', () => expect(tailwindClass(g)).toBe('bg-[linear-gradient(90deg,#c6f24e_0%,#1a1a2e_100%)]'))
    it('radial + oklch', () => expect(tailwindClass({ ...g, type: 'radial', interp: 'oklch' })).toBe('bg-[radial-gradient(circle_in_oklch,#c6f24e_0%,#1a1a2e_100%)]'))
    it('conic', () => expect(tailwindClass({ ...g, type: 'conic' })).toBe('bg-[conic-gradient(from_90deg,#c6f24e_0%,#1a1a2e_100%)]'))
  })

  describe('parsePosition', () => {
    it('reads numbers with or without %', () => { expect(parsePosition('25%')).toBe(25); expect(parsePosition(' 12.5 ')).toBe(12.5) })
    it('empty or junk → null', () => { expect(parsePosition('')).toBeNull(); expect(parsePosition('abc')).toBeNull() })
  })

  describe('PRESETS', () => {
    it('8–12 presets, unique names, valid stops', () => {
      expect(PRESETS.length).toBeGreaterThanOrEqual(8); expect(PRESETS.length).toBeLessThanOrEqual(12)
      expect(new Set(PRESETS.map((p) => p.name)).size).toBe(PRESETS.length)
      for (const p of PRESETS) {
        expect(p.stops.length).toBeGreaterThanOrEqual(2)
        for (const s of p.stops) expect(s.color).toMatch(/^#[0-9a-f]{6}$/)
      }
      expect(new Set(PRESETS.map((p) => p.type))).toEqual(new Set(['linear', 'radial', 'conic']))
    })
  })
  ```
- [ ] **Step 2:** Run `npx vitest run test/lib/gradient.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `lib/gradient.ts`.**
  - **Head:** linear `${angle}deg`, radial `circle`, conic `from ${angle}deg`. When `interp !== 'default'`, append ` in ${interp}`.
  - **Stops:** `color` plus ` ${pos}%` when `pos !== null`, joined with `', '`.
  - **`tailwindClass`:** `bg-[${css.replace(/, /g, ',').replace(/ /g, '_')}]`.
  - **`PRESETS`:** 8 entries, lowercase hex, covering all three types. Names are plain words (e.g. `Sunrise`, `Ocean`, `Forest`, `Dusk`, `Mint`, `Peach`, `Spotlight` (radial), `Colour wheel` (conic)).
- [ ] **Step 4:** Run `npx vitest run test/lib/gradient.test.ts`. Expected: PASS.
- [ ] **Step 5: Edit `test/tools/CssGradient.test.tsx`.**
  - **Deliberate change:** replace the body of `it('renders a CopyButton')` with `expect(screen.getAllByText('copy')).toHaveLength(2)` and rename it to `'renders a copy button for CSS and for Tailwind'`. The Tailwind panel adds the second button.
  - Append:
  ```tsx
  describe('CssGradient upgrades', () => {
    const body = () => document.body.textContent ?? ''
    it('adds a stop before the last one and removes it again', () => {
      render(<CssGradient />)
      expect(screen.getByRole('button', { name: 'Remove stop 1' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Add stop' }))
      expect(screen.getAllByLabelText(/^Stop \d color$/)).toHaveLength(3)
      expect(body()).toContain('linear-gradient(90deg, #c6f24e 0%, #ffffff 50%, #1a1a2e 100%)')
      fireEvent.click(screen.getByRole('button', { name: 'Remove stop 2' }))
      expect(body()).toContain('linear-gradient(90deg, #c6f24e 0%, #1a1a2e 100%)')
    })
    it('conic gradient', () => {
      render(<CssGradient />)
      fireEvent.click(screen.getByRole('tab', { name: 'Conic' }))
      expect(body()).toContain('conic-gradient(from 90deg, ')
    })
    it('oklch interpolation adds a second line', () => {
      render(<CssGradient />)
      fireEvent.change(screen.getByLabelText('Interpolation'), { target: { value: 'oklch' } })
      expect(body()).toContain('linear-gradient(90deg in oklch, ')
    })
    it('tailwind class output', () => {
      render(<CssGradient />)
      expect(screen.getByText('bg-[linear-gradient(90deg,#c6f24e_0%,#1a1a2e_100%)]')).toBeInTheDocument()
    })
    it('applying a preset replaces the gradient', async () => {
      const { PRESETS, gradientCss } = await import('@/lib/gradient')
      render(<CssGradient />)
      fireEvent.change(screen.getByLabelText('Preset'), { target: { value: PRESETS[1].name } })
      expect(body()).toContain(gradientCss(PRESETS[1]))
    })
  })
  ```
- [ ] **Step 6:** Run `npx vitest run test/tools/CssGradient.test.tsx`. Expected: the new cases and the edited case FAIL; the rest PASS.
- [ ] **Step 7: Rewrite the component around `lib/gradient.ts`.**
  - **Stop state:** `{ id: number; color: string; posText: string }[]`, initialised to `#c6f24e`/`0%` and `#1a1a2e`/`100%`.
  - **Type tabs:** a `Segmented` with `Linear | Radial | Conic`.
  - **Toolbar fields:** `Field "Interpolation"` (`Select`: `default` → `Default`, `srgb` → `sRGB`, `oklch` → `OKLCH`) and `Field "Preset"` (`Select`: `''` → `Custom`, then each preset name). Picking a preset replaces type, angle, interp and stops; any manual edit sets the preset back to `''`.
  - **Angle:** the slider (`aria-label="Gradient angle"`, `Field` label `Angle: N°`) shows for linear and conic.
  - **Each stop:**
    - a colour input with `aria-label="Stop N color"`, and the hex next to it;
    - `Field "Position"` → `TextInput` with `placeholder` = the stop's initial position text (`0%`, `100%`, and `50%` for added stops);
    - a native `Remove` button with `aria-label="Remove stop N"` (see Global Constraints), disabled at 2 stops.
  - **Add stop:** inserts `#ffffff`/`50%` at index `length - 1`.
  - **Output:** preview div unchanged. `Panel "CSS output"` shows `cssOutput(g)` (`whiteSpace: 'pre-wrap'`) with `CopyButton`. `Panel "Tailwind class"` shows `tailwindClass(g)` as the only text of its element, with `CopyButton`.
  - **Styles:** Workbench tokens; drop the uppercase "Stop N" label style (sentence case `Stop 1`).
- [ ] **Step 8:** Run `npx vitest run test/tools/CssGradient.test.tsx test/lib/gradient.test.ts`. Expected: PASS.
- [ ] **Step 9: Fill `lib/tool-content/css-gradient.ts`.**
  - Target intents: "css gradient generator", "conic gradient generator", "tailwind gradient", "oklch gradient".
  - Explain why `in oklch` avoids muddy midpoints, and that older browsers fall back to the first line.
  - Run `npx vitest run test/lib/tool-content.test.ts -t css-gradient`. Expected: PASS.
- [ ] **Step 10:** Commit: `feat(css-gradient): multi-stop, conic, interpolation, presets, tailwind output`.

### Task 7: contrast-checker (starts only after the colour-pages plan's `lib/color-math.ts` extraction is committed)

**Files:**
- Create: `lib/contrast.ts`, `test/lib/contrast.test.ts`
- Modify: `components/tools/ContrastChecker.tsx`, `test/tools/ContrastChecker.test.tsx` (append), `lib/tool-content/contrast-checker.ts` (fill)
- Read first: `lib/color-math.ts`. Import its hex-parse, WCAG contrast and RGB↔HSL helpers; do not copy them.

**Interfaces:**
- Consumes: `lib/color-math.ts` (colour-pages plan); use its exported names as they are.
- Produces:
  ```ts
  export function apcaLc(textHex: string, bgHex: string): number // signed Lc; 0 for invalid input
  export function apcaGuidance(lc: number): string
  export function nearestPassing(fgHex: string, bgHex: string, target: number): string | null // lowercase #rrggbb; fg itself if it already passes
  export function parsePalette(text: string): { colors: string[]; invalid: string[]; truncated: boolean }
  export function contrastMatrix(colors: string[]): number[][] // WCAG ratios, [row][col]
  ```

- [ ] **Step 0:** `test -f lib/color-math.ts || echo MISSING`. If it prints MISSING, stop and report back; don't create your own copy of the maths.
- [ ] **Step 1: Write the failing lib tests** in `test/lib/contrast.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { apcaLc, apcaGuidance, nearestPassing, parsePalette, contrastMatrix } from '@/lib/contrast'
  import { contrastRatio } from '@/lib/qr/contrast' // independent WCAG check for the assertions

  describe('apcaLc (0.0.98G-4g)', () => {
    it('matches published values', () => {
      expect(apcaLc('#000000', '#ffffff')).toBeCloseTo(106.04, 1)
      expect(apcaLc('#ffffff', '#000000')).toBeCloseTo(-107.88, 1)
      expect(apcaLc('#888888', '#ffffff')).toBeCloseTo(63.06, 1)
      expect(apcaLc('#ffffff', '#888888')).toBeCloseTo(-68.54, 1)
      expect(apcaLc('#000', '#fff')).toBeCloseTo(106.04, 1)
      expect(apcaLc('#aabbcc', '#aabbcc')).toBe(0)
    })
    it('guidance bands use |Lc|', () => {
      expect(apcaGuidance(106)).toBe('Preferred for body text')
      expect(apcaGuidance(-80)).toBe('Minimum for body text')
      expect(apcaGuidance(63)).toBe('Minimum for content text (larger or bolder)')
      expect(apcaGuidance(50)).toBe('Large text and headlines only')
      expect(apcaGuidance(35)).toBe('Non-text elements and spot text only')
      expect(apcaGuidance(20)).toBe('Minimum for non-text elements')
      expect(apcaGuidance(5)).toBe('Not readable as text')
    })
  })

  describe('nearestPassing', () => {
    it('returns fg unchanged when it already passes', () => expect(nearestPassing('#000000', '#ffffff', 4.5)).toBe('#000000'))
    it('darkens #777 on white just enough for AA', () => {
      const s = nearestPassing('#777777', '#ffffff', 4.5)!
      expect(s).toMatch(/^#[0-9a-f]{6}$/)
      expect(contrastRatio(s, '#ffffff')).toBeGreaterThanOrEqual(4.5)
      expect(parseInt(s.slice(1, 3), 16)).toBeLessThan(0x77)
      expect(parseInt(s.slice(1, 3), 16)).toBeGreaterThan(0x60) // the closest step, not black
    })
    it('null when nothing can pass', () => expect(nearestPassing('#777777', '#777777', 21)).toBeNull())
  })

  describe('parsePalette + contrastMatrix', () => {
    it('normalises entries and lists junk', () =>
      expect(parsePalette('0f7a4a, #FFF\n10261b zz')).toEqual({ colors: ['#0f7a4a', '#ffffff', '#10261b'], invalid: ['zz'], truncated: false }))
    it('caps at 12', () => {
      const r = parsePalette(Array.from({ length: 13 }, (_, i) => (i + 16).toString(16).repeat(3)).join(' '))
      expect(r.colors).toHaveLength(12); expect(r.truncated).toBe(true)
    })
    it('matrix is symmetric with 1 on the diagonal', () => {
      const m = contrastMatrix(['#000000', '#ffffff', '#777777'])
      expect(m[0][0]).toBeCloseTo(1); expect(m[0][1]).toBeCloseTo(21); expect(m[1][0]).toBeCloseTo(21)
      expect(m[1][2]).toBeCloseTo(4.48, 2)
    })
  })
  ```
- [ ] **Step 2:** Run `npx vitest run test/lib/contrast.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `lib/contrast.ts`.**
  - **APCA (0.0.98G-4g):**
    - `Y = 0.2126729·R^2.4 + 0.7151522·G^2.4 + 0.0721750·B^2.4`, with channels /255 and simple 2.4 gamma;
    - soft clamp: `Y < 0.022 → Y + (0.022 − Y)^1.414`;
    - if `|Ybg − Ytxt| < 0.0005` → 0;
    - normal polarity (`Ybg > Ytxt`): `S = (Ybg^0.56 − Ytxt^0.57)·1.14`, result `S < 0.1 ? 0 : S − 0.027`;
    - reverse: `S = (Ybg^0.65 − Ytxt^0.62)·1.14`, result `S > −0.1 ? 0 : S + 0.027`;
    - return result × 100.
  - **Guidance thresholds** on `|lc|`: ≥ 90, 75, 60, 45, 30, 15, else.
  - **`nearestPassing`:**
    - return `fg` (normalised) if it already passes;
    - otherwise convert to HSL; for `k = 1..200`, test `L − 0.5k` and `L + 0.5k` (within 0–100);
    - return the first passing candidate; if both pass at the same k, return the one with the higher ratio;
    - otherwise `null`.
  - **`parsePalette`:** split on `/[\s,;]+/`; accept 3- or 6-digit hex, with or without `#`, any case; output lowercase `#rrggbb`; dedupe; keep the first 12.
- [ ] **Step 4:** Run `npx vitest run test/lib/contrast.test.ts`. Expected: PASS.
- [ ] **Step 5: Append the failing component tests:**
  ```tsx
  describe('ContrastChecker upgrades', () => {
    it('shows APCA Lc for black on white', () => {
      render(<ContrastChecker />)
      expect(screen.getByText('Lc 106.0')).toBeInTheDocument()
      expect(screen.getByText('Preferred for body text')).toBeInTheDocument()
    })
    it('swap exchanges the colours', () => {
      render(<ContrastChecker />)
      fireEvent.click(screen.getByRole('button', { name: 'Swap' }))
      const inputs = screen.getAllByPlaceholderText(/#/) as HTMLInputElement[]
      expect(inputs[0].value).toBe('#ffffff'); expect(inputs[1].value).toBe('#000000')
      expect(screen.getByText('Lc -107.9')).toBeInTheDocument()
    })
    it('non-text 3:1 badge', () => {
      render(<ContrastChecker />)
      expect(screen.getByText('Non-text 3:1').closest('div')!.textContent).toContain('PASS')
      const inputs = screen.getAllByPlaceholderText(/#/)
      fireEvent.change(inputs[0], { target: { value: '#777777' } }); fireEvent.change(inputs[1], { target: { value: '#888888' } })
      expect(screen.getByText('Non-text 3:1').closest('div')!.textContent).toContain('FAIL')
    })
    it('suggests and applies a passing foreground', () => {
      render(<ContrastChecker />)
      fireEvent.change(screen.getAllByPlaceholderText(/#/)[0], { target: { value: '#999999' } })
      expect(screen.getByText(/Suggested foreground/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Use suggestion' }))
      expect(screen.getByText('AA Normal').closest('div')!.textContent).toContain('PASS')
      expect(screen.queryByText(/Suggested foreground/)).toBeNull()
    })
    it('palette matrix', () => {
      render(<ContrastChecker />)
      fireEvent.change(screen.getByLabelText('Palette'), { target: { value: '000000, ffffff' } })
      expect(screen.getAllByText('21.00')).toHaveLength(2)
      expect(screen.getAllByText('1.00')).toHaveLength(2)
    })
  })
  ```
- [ ] **Step 6:** Run `npx vitest run test/tools/ContrastChecker.test.tsx`. Expected: the new cases FAIL and the 10 existing cases PASS.
- [ ] **Step 7: Update the component.**
  - **Swap:** add a `Button` `Swap` between the two colour groups; it swaps both the text and the picker state.
  - **Results panel:**
    - keep the ratio (`x.xx:1`) and the four existing badges;
    - add `<Badge label="Non-text 3:1" pass={ratio >= 3} />`;
    - below them, an APCA line: an element whose whole text is `Lc ${lc.toFixed(1)}`, an element containing `apcaGuidance(lc)`, and the muted note `APCA is a draft method for WCAG 3, not a conformance requirement.`
  - **Suggestion:** when `!aaNormal`, show `<Notice kind="info">` with the text `Suggested foreground for AA (4.5:1): #xxxxxx`, a swatch and a `Button` `Use suggestion` that sets fg. If `nearestPassing` returns null, the notice says `No foreground with this hue reaches 4.5:1 on this background.`
  - **Palette:** `Panel "Palette matrix"` containing `Field "Palette"` → `TextArea` (`rows={3}`, placeholder `e.g. 0f7a4a, ffffff, 10261b` — **no `#` in the placeholder**, so the existing `getAllByPlaceholderText(/#/)` still returns only fg and bg).
    - When there are 2 or more colours, render a `<table>`: header swatches, and cells holding `ratio.toFixed(2)` as the whole text of the cell, styled `--accent-tint` when ≥ 4.5, else `--danger-tint`.
    - Show `Could not read: …` for invalid entries and `Only the first 12 colours are shown.` when the list was cut. **Don't use the word "invalid"**, because existing tests match `/invalid/i`.
  - **Styles:** switch the `Badge` styles to Workbench tokens, keeping the `PASS`/`FAIL` text.
- [ ] **Step 8:** Run `npx vitest run test/tools/ContrastChecker.test.tsx test/lib/contrast.test.ts`. Expected: PASS.
- [ ] **Step 9: Fill `lib/tool-content/contrast-checker.ts`.**
  - Target intents: "contrast checker", "wcag contrast ratio", "apca contrast checker", "color palette contrast".
  - Explain the AA/AAA thresholds and non-text 3:1. Say plainly that APCA is a draft.
  - Run `npx vitest run test/lib/tool-content.test.ts -t contrast-checker`. Expected: PASS.
- [ ] **Step 10:** Commit: `feat(contrast-checker): APCA, swap, non-text badge, AA suggestion, palette matrix`.

### Task 8: metar-decoder + taf-decoder

**Files:**
- Modify: `lib/metar.ts`, `test/lib/metar.test.ts` (append), `components/tools/MetarDecoder.tsx`, `components/tools/TafDecoder.tsx`, `test/tools/MetarDecoder.test.tsx` (append), `test/tools/TafDecoder.test.tsx` (append), `lib/tool-content/metar-decoder.ts`, `lib/tool-content/taf-decoder.ts`

**Interfaces:**
- Produces (added to `lib/metar.ts`; the existing exports keep their behaviour):
  ```ts
  export type Units = { temp: 'C' | 'F'; pressure: 'hPa' | 'inHg' }
  export type MetarOk = Extract<ReturnType<typeof decodeMetar>, { ok: true }>
  export type TafOk = Extract<ReturnType<typeof decodeTaf>, { ok: true }>
  export function metarSummary(r: MetarOk, units: Units): string
  export function reportedPressure(r: MetarOk): 'hPa' | 'inHg' | null // from the first A/Q group
  export function decodeRemarks(remarks: string, units: Units): Row[]
  export function splitReports(text: string): string[]
  export function tafTimeline(r: TafOk): { spanH: number; bars: { period: number; kind: TafPeriod['kind']; startH: number; endH: number; category: FlightCat | null }[] } | null
  // TafPeriod gains: category: FlightCat | null; startRaw: string; endRaw: string  ('DDHHMM', '' if unknown)
  ```

- [ ] **Step 1: Append the failing lib tests** to `test/lib/metar.test.ts`:
  ```ts
  import { metarSummary, decodeRemarks, splitReports, tafTimeline, reportedPressure } from '@/lib/metar'

  const C_IN = { temp: 'C', pressure: 'inHg' } as const
  const F_HPA = { temp: 'F', pressure: 'hPa' } as const
  const C_HPA = { temp: 'C', pressure: 'hPa' } as const

  describe('metarSummary', () => {
    const kjfk = ok(decodeMetar('KJFK 121651Z 31015G25KT 10SM FEW050 SCT250 22/12 A3002 RMK AO2 SLP165 T02220122'))
    it('US report, °C / inHg', () =>
      expect(metarSummary(kjfk, C_IN)).toBe('Wind from 310° at 15 kt, gusting 25 kt. Visibility 10 statute miles. Few at 5,000 ft, scattered at 25,000 ft. Temperature 22 °C, dew point 12 °C. Altimeter 30.02 inHg.'))
    it('US report, °F / hPa', () =>
      expect(metarSummary(kjfk, F_HPA)).toBe('Wind from 310° at 15 kt, gusting 25 kt. Visibility 10 statute miles. Few at 5,000 ft, scattered at 25,000 ft. Temperature 72 °F, dew point 54 °F. Altimeter 1016.6 hPa.'))
    it('ICAO fog report', () => {
      const r = ok(decodeMetar('METAR VIDP 080530Z 00000KT 0800 R28/1200U FG VV002 12/12 Q1015 NOSIG'))
      expect(metarSummary(r, C_HPA)).toBe('Wind calm. Visibility 800 m. Fog. Vertical visibility 200 ft. Temperature 12 °C, dew point 12 °C. Altimeter 1015 hPa.')
      expect(metarSummary(r, C_IN)).toMatch(/Altimeter 29\.97 inHg\.$/)
      expect(reportedPressure(r)).toBe('hPa')
    })
    it('negative temperatures in °F', () =>
      expect(metarSummary(ok(decodeMetar('CYYZ 081200Z 27010KT 15SM SKC M05/M10 A3010')), { temp: 'F', pressure: 'inHg' })).toContain('Temperature 23 °F, dew point 14 °F.'))
    it('ignores the trend', () =>
      expect(metarSummary(ok(decodeMetar('EGLL 081150Z 24008KT 9999 SCT030 18/09 Q1021 TEMPO 3000 SHRA')), C_HPA)).toBe(
        'Wind from 240° at 8 kt. Visibility 10 km or more. Scattered at 3,000 ft. Temperature 18 °C, dew point 9 °C. Altimeter 1021 hPa.'))
  })

  describe('decodeRemarks', () => {
    const m = (s: string, u = C_HPA) => decodeRemarks(s, u).map((r) => [r.group, r.label, r.meaning])
    it('station type, SLP, T group in both unit sets', () => {
      expect(m('AO2 SLP165 T02220122')).toEqual([
        ['AO2', 'Station type', 'Automated station with a precipitation sensor'],
        ['SLP165', 'Sea-level pressure', '1016.5 hPa'],
        ['T02220122', 'Precise temperature', 'Temperature 22.2 °C, dew point 12.2 °C'],
      ])
      expect(m('SLP165 T02220122', { temp: 'F', pressure: 'inHg' })).toEqual([
        ['SLP165', 'Sea-level pressure', '30.02 inHg'],
        ['T02220122', 'Precise temperature', 'Temperature 72.0 °F, dew point 54.0 °F'],
      ])
      expect(m('AO1 SLP982 SLPNO T10171039')).toEqual([
        ['AO1', 'Station type', 'Automated station without a precipitation sensor'],
        ['SLP982', 'Sea-level pressure', '998.2 hPa'],
        ['SLPNO', 'Sea-level pressure', 'Not available'],
        ['T10171039', 'Precise temperature', 'Temperature −1.7 °C, dew point −3.9 °C'],
      ])
    })
    it('peak wind, wind shift, precipitation, 6-hour temps, tendency, flags', () => {
      expect(m('PK WND 28045/15 PK WND 28045/1715 WSHFT 1715 FROPA WSHFT 30 P0012 60009 70015 10142 21001 52032 $ TSNO PRESRR PRESFR XYZ')).toEqual([
        ['PK WND 28045/15', 'Peak wind', 'From 280° at 45 kt at 15 minutes past the hour'],
        ['PK WND 28045/1715', 'Peak wind', 'From 280° at 45 kt at 17:15 UTC'],
        ['WSHFT 1715 FROPA', 'Wind shift', 'At 17:15 UTC (frontal passage)'],
        ['WSHFT 30', 'Wind shift', 'At 30 minutes past the hour'],
        ['P0012', 'Precipitation (last hour)', '0.12 in'],
        ['60009', 'Precipitation (3 or 6 hours)', '0.09 in'],
        ['70015', 'Precipitation (24 hours)', '0.15 in'],
        ['10142', '6-hour maximum temperature', '14.2 °C'],
        ['21001', '6-hour minimum temperature', '−0.1 °C'],
        ['52032', 'Pressure tendency (3 hours)', 'Increasing steadily or unsteadily; changed 3.2 hPa'],
        ['$', 'Maintenance', 'Station needs maintenance'],
        ['TSNO', 'Sensor status', 'Lightning detector not operating'],
        ['PRESRR', 'Pressure', 'Rising rapidly'],
        ['PRESFR', 'Pressure', 'Falling rapidly'],
        ['XYZ', 'Not decoded', 'XYZ'],
      ])
    })
  })

  describe('splitReports', () => {
    it('one report per station line', () =>
      expect(splitReports('KJFK 121651Z 31015KT 10SM CLR 22/12 A3002\nKLGA 121651Z 30012KT 10SM FEW040 21/11 A3001')).toHaveLength(2))
    it('splits CRLF + indented TAF', () => {
      const r = splitReports('TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250\r\n     FM081800 30012G20KT P6SM SCT050\r\n\r\nMETAR EGLL 081150Z 24008KT CAVOK 18/09 Q1021=\r\nMETAR LFPG 081200Z 22010KT 9999 FEW030 17/08 Q1019=')
      expect(r).toEqual([
        'TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250 FM081800 30012G20KT P6SM SCT050',
        'METAR EGLL 081150Z 24008KT CAVOK 18/09 Q1021=',
        'METAR LFPG 081200Z 22010KT 9999 FEW030 17/08 Q1019=',
      ])
    })
    it('empty → []', () => expect(splitReports('  \n ')).toEqual([]))
  })

  describe('TAF categories and timeline', () => {
    const t = ok(decodeTaf('TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250 FM081800 30012G20KT P6SM SCT050 TEMPO 0820/0824 3SM -SHRA BKN030 PROB30 0902/0906 1SM BR OVC004'))
    it('category per period', () => expect(t.periods.map((p) => p.category)).toEqual(['VFR', 'VFR', 'MVFR', 'LIFR']))
    it('bars in hours from the start of validity', () => {
      const tl = tafTimeline(t)!
      expect(tl.spanH).toBe(30)
      expect(tl.bars.map((b) => [b.kind, b.startH, b.endH])).toEqual([['BASE', 0, 6], ['FM', 6, 30], ['TEMPO', 8, 12], ['PROB', 14, 18]])
    })
    it('month rollover picks a month length that keeps validity ≤ 30 h', () => {
      const r = ok(decodeTaf('TAF XXXX 301730Z 3018/0124 18010KT 9999 SCT030 FM010600 20012KT 9999 BKN020'))
      expect(r.periods.map((p) => p.category)).toEqual(['VFR', 'MVFR'])
      const tl = tafTimeline(r)!
      expect(tl.spanH).toBe(30)
      expect(tl.bars.map((b) => [b.kind, b.startH, b.endH])).toEqual([['BASE', 0, 12], ['FM', 12, 30]])
    })
    it('no validity → null', () => expect(tafTimeline(ok(decodeTaf('TAF KJFK 31010KT P6SM')))).toBeNull())
  })
  ```
- [ ] **Step 2:** Run `npx vitest run test/lib/metar.test.ts`. Expected: the new cases FAIL and the existing cases PASS.
- [ ] **Step 3: Implement in `lib/metar.ts`.**
  - **`metarSummary`:**
    - walk `r.rows` up to the first row labelled `Trend` or `Remarks`;
    - sentences in row order:
      - `Wind` → `Wind ${lcfirst(meaning)}`;
      - the first `Visibility` → `Visibility ${lcfirst(meaning)}`;
      - `Weather` → meaning;
      - `Visibility and cloud` → meaning;
      - all `Cloud` and `Vertical visibility` rows → one sentence, with the first meaning as-is and the rest lowercased-first, joined by `', '`, placed at the first sky row's position;
      - `Temperature / dew point` → rebuilt from its group with `units.temp` (°F = `Math.round(c * 9 / 5 + 32)`, minus sign `−` as in `temp()`);
      - `Altimeter` → `Altimeter ${v}`: inHg `toFixed(2)`; hPa from Q as an integer, hPa from A `toFixed(1)`;
    - skip every other label;
    - join with `'. '` and end with `'.'`.
  - **`decodeRemarks`:**
    - tokenise and uppercase like `tokenize()`;
    - multi-token groups: `PK WND x`, and `WSHFT hhmm|mm` with an optional `FROPA`;
    - SLP: `ppp < 500 ? 1000 + ppp/10 : 900 + ppp/10`; hPa `toFixed(1)`, inHg `(hPa/33.8639).toFixed(2)`;
    - temperatures in `units.temp` to 1 decimal; the sign digit `1` means negative;
    - tendency words for `a = 0..8`, in order:
      - `Increasing, then decreasing`
      - `Increasing, then steady, or increasing more slowly`
      - `Increasing steadily or unsteadily`
      - `Decreasing or steady, then increasing, or increasing more rapidly`
      - `Steady`
      - `Decreasing, then increasing`
      - `Decreasing, then steady, or decreasing more slowly`
      - `Decreasing steadily or unsteadily`
      - `Steady or increasing, then decreasing, or decreasing more rapidly`
    - the tendency value is always in hPa (`ppp/10`).
  - **`splitReports`:**
    - normalise `\r\n` to `\n`;
    - start a new report at a blank line, after a line ending in `=`, or at a trimmed line matching `/^(METAR|SPECI|TAF)\b/i` or `/^[A-Z][A-Z0-9]{3}\s+\d{6}Z\b/i`;
    - otherwise append the line to the current report with one space;
    - trim, and drop empty reports.
  - **`decodeTaf`:**
    - fill `startRaw` and `endRaw` (`DDHHMM`: validity `DDHH` + `00`, FM `DDHHMM`, change groups `DDHH` + `00`);
    - fill `category` per period the way `decodeMetar` does (vis/ceiling from `decodeOne` extras; `null` when the period has neither);
    - the existing BASE/FM `to` back-fill also sets `endRaw`.
  - **`tafTimeline`:**
    - return `null` when `periods[0].startRaw === ''`;
    - `offset(raw)` = `dayDiff*24 + hh - h0 + (mm - m0)/60`, where `dayDiff = d >= d0 ? d - d0 : d + L - d0`;
    - `L` is the first of `[31, 30, 29, 28]` that makes the validity-end offset > 0 and ≤ 30;
    - clamp every bar to `[0, spanH]`.
- [ ] **Step 4:** Run `npx vitest run test/lib/metar.test.ts`. Expected: PASS.
- [ ] **Step 5: Append the failing component tests.**

  `test/tools/MetarDecoder.test.tsx`:
  ```tsx
  describe('MetarDecoder upgrades', () => {
    const KJFK = 'KJFK 121651Z 31015G25KT 10SM FEW050 SCT250 22/12 A3002 RMK AO2 SLP165'
    it('plain-English headline in the reported units', () => {
      render(<MetarDecoder />); paste(KJFK)
      expect(screen.getByText('Wind from 310° at 15 kt, gusting 25 kt. Visibility 10 statute miles. Few at 5,000 ft, scattered at 25,000 ft. Temperature 22 °C, dew point 12 °C. Altimeter 30.02 inHg.')).toBeInTheDocument()
    })
    it('unit toggles change headline and remarks', () => {
      render(<MetarDecoder />); paste(KJFK)
      expect(screen.getByText('30.02 inHg')).toBeInTheDocument() // SLP165 in the reported unit
      fireEvent.click(screen.getByRole('tab', { name: '°F' }))
      expect(screen.getByText(/Temperature 72 °F, dew point 54 °F/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('tab', { name: 'hPa' }))
      expect(screen.getByText('1016.5 hPa')).toBeInTheDocument()
    })
    it('decodes several pasted reports', () => {
      render(<MetarDecoder />)
      paste(`${KJFK}\nEGLL 081150Z 24008KT 200V280 CAVOK 18/09 Q1021`)
      expect(screen.getByRole('region', { name: 'KJFK report' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'EGLL report' })).toBeInTheDocument()
      expect(screen.getAllByText('VFR')).toHaveLength(2)
    })
  })
  ```
  `test/tools/TafDecoder.test.tsx`:
  ```tsx
  describe('TafDecoder upgrades', () => {
    const TAF = 'TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250 FM081800 30012G20KT P6SM SCT050 TEMPO 0820/0824 3SM -SHRA BKN030 PROB30 0902/0906 1SM BR OVC004'
    it('period categories and timeline', () => {
      render(<TafDecoder />); paste(TAF)
      expect(screen.getByRole('group', { name: 'Forecast timeline' })).toBeInTheDocument()
      expect(screen.getByLabelText('Temporarily 8th 20:00 to 8th 24:00 UTC, MVFR')).toBeInTheDocument()
      expect(screen.getAllByText('VFR')).toHaveLength(2)
      expect(screen.getByText('MVFR')).toBeInTheDocument()
      expect(screen.getByText('LIFR')).toBeInTheDocument()
    })
    it('several TAFs', () => {
      render(<TafDecoder />)
      paste(`${TAF}\nTAF EGLL 081100Z 0812/0918 24010KT 9999 SCT030`)
      expect(screen.getByRole('region', { name: 'KJFK forecast' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'EGLL forecast' })).toBeInTheDocument()
    })
  })
  ```
- [ ] **Step 6:** Run `npx vitest run test/tools/MetarDecoder.test.tsx test/tools/TafDecoder.test.tsx`. Expected: the new cases FAIL and the existing 7 PASS.
- [ ] **Step 7: Update the components.**
  - **MetarDecoder:**
    - **Unit toggles:** a `Toolbar` with `Segmented` `°C | °F` (state `'C'`) and `Segmented` `hPa | inHg`. The pressure state starts as `null`; the effective value is `pressure ?? reportedPressure(r) ?? 'hPa'`, decided per report.
    - **Reports:** `splitReports(text)`, at most 20. When more are pasted, show `<Notice kind="info">Only the first 20 reports are decoded.</Notice>`.
    - **One `<section aria-label={`${station} report`}>` per report:**
      - the existing station and badge line;
      - `<p>` holding only the `metarSummary(...)` string;
      - `RowsTable`;
      - when `r.remarks`, an `<h3>Remarks decoded</h3>` and `RowsTable rows={decodeRemarks(r.remarks, units)}`.
    - **Failed report:** shows its `Notice kind="error"` inside a plain `<section>` (no aria-label, since there is no station).
    - **Exports:** keep `CategoryBadge`, `RowsTable`, `TRAINING_NOTICE`, `th`, `td`.
  - **TafDecoder:**
    - **Reports:** `splitReports`, max 20, each in `<section aria-label={`${station} forecast`}>`.
    - **Period headings:** `periodTitle(p)` (unchanged) followed by `<CategoryBadge>` when `p.category`.
    - **Timeline** (above the periods), when `tafTimeline(r)` is not null:
      - `<div role="group" aria-label="Forecast timeline">`;
      - two rows (BASE/FM, and TEMPO/BECMG/PROB), each relatively positioned;
      - each bar is absolutely positioned with `left/width` = `startH/spanH`, `(endH−startH)/spanH` in %;
      - the background comes from the existing `CAT_STYLE` colours, or `--surface-soft` when there is no category. Export `CAT_STYLE` from MetarDecoder if needed;
      - `aria-label` and `title` are both `${periodTitle(p)}, ${p.category ?? 'category unknown'}`;
      - visible text is only `BASE`, `FM`, `TEMPO`, `BECMG` or `PROB${p.prob}`;
      - under the bars, a muted axis line `0 h … ${spanH} h from ${valid start} UTC`.
    - **Bar text must not repeat** "From …", "Temporarily …" or "% probability". The existing tests use those as regex `getByText` matches and would find duplicates.
- [ ] **Step 8:** Run `npx vitest run test/tools/MetarDecoder.test.tsx test/tools/TafDecoder.test.tsx test/lib/metar.test.ts`. Expected: PASS.
- [ ] **Step 9: Update `lib/tool-content/metar-decoder.ts` and `taf-decoder.ts`.**
  - **METAR:** replace "Remarks after RMK are passed through as written" with what is now decoded (common US remarks; others shown as written). Mention the plain-English headline, the °C/°F and hPa/inHg toggles, and pasting several reports.
  - **TAF:** mention the timeline and the per-period category.
  - Run `npx vitest run test/lib/tool-content.test.ts -t "metar-decoder|taf-decoder"`. Expected: PASS.
- [ ] **Step 10:** Commit: `feat(metar,taf): plain-English summary, remarks, unit toggles, multi-report, TAF timeline`.

---

## Integration (sequential, after Tasks 1–8)

### Task 9: Privacy canaries, full gates, bundle check

**Files:**
- Modify: `test/e2e/privacy.spec.ts` (the text-tool slug loop that starts `for (const slug of [ 'krutidev-to-unicode', …`)

- [ ] **Step 1: Add the slugs.** Append `// tool upgrades batch 1 (2026-11-05)` and then `'random-number-generator', 'css-gradient', 'contrast-checker',` to that array. These are the three tools that gain free-text inputs (exclude list, stop position, palette).
- [ ] **Step 2:** Run `npm run verify`.
  - Expected: typecheck, all unit tests (including `test/lib/tool-content.test.ts` for all 10 new slugs) and build all green.
  - In the build output, "First Load JS shared by all" is within ±1 KB of the Task 0 number.
  - `lib/random.ts`, `lib/gradient.ts`, `lib/contrast.ts`, `lib/date-calc.ts` and `lib/conversion-rate.ts` do not appear in the shared chunk.
- [ ] **Step 3:** Run `grep -o '<title>[^<]*' out/tools/css-gradient/index.html out/tools/contrast-checker/index.html`. Expected: each page's tool title. Run `grep -c 'FAQPage' out/tools/css-gradient/index.html`. Expected: ≥ 1 (the content is rendered).
- [ ] **Step 4:** Run `npm run e2e`. Expected: green, including the three new canary cases and the CSP spec.
- [ ] **Step 5:** Run `npx vitest run test/privacy/static-guard.test.ts`. Expected: PASS (no storage, console or network added).
- [ ] **Step 6:** Commit: `test(privacy): canaries for batch-1 upgraded tools`.

Then dispatch one fresh reviewer on the whole branch, with this plan, the spec and the Review Focus list.
