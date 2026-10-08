# Niche Batch 2 + QR Designer + Category Hubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the QR generator into a free designer (+ UPI page), ship 14 niche tool pages (India, Aviation, personal files), research-gate 3 legacy font pages, and add `/category/india/` and `/category/aviation/` hubs.

**Architecture:** Same pattern as batch 1: pure logic in `lib/<topic>.ts` (unit-tested with published vectors), a thin `'use client'` component composing `components/ui/kit.tsx`, per-slug `lib/tool-content/<slug>.ts`. Tasks 1–10 create **new files only** (plus the one file each task owns: `QrCodeGenerator.tsx`, `lib/aviation.ts`, `lib/legacy-fonts.ts`) so builders can run in parallel. Registry, `ToolMount`, `TOOL_CONTENT`, hubs and canaries are wired centrally (Tasks 11–12).

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, Vitest + RTL (jsdom), Playwright, `qrcode-generator` (existing lazy dep), native Canvas / `TextDecoder` / `FileReader`.

**Spec:** `docs/superpowers/specs/2026-10-08-niche-batch-2-design.md`

## Global Constraints

- No network for tool logic: no `fetch`, XHR, WebSocket, `sendBeacon`, `EventSource`; no remote resource URLs built from user data.
- User data never in URL (path/query/hash), `document.title`, storage, cookies or `console.*`.
- Object URLs revoked after use. Logos read with `FileReader` into memory only.
- No new runtime dependencies. QR via existing `qrcode-generator`, **dynamically imported inside the handler**. Shared First Load JS stays ~104 KB.
- Privacy copy hedged ("designed to run in your browser", "processed on your device"). Static guard regex must stay green.
- QR copy exactly: "Free, no sign-up, no watermark. Static QR code — it never expires and scanning it never goes through our servers."
- Sentence case; kit components; Workbench tokens only (`--accent`, `--danger`, `--warn`, `--line`, `--mute`…), never legacy aliases.
- Tool components take no props, except `LegacyFontConverter({ font })` and `QrCodeGenerator({ initialType? })`.
- Logic returns `{ ok: true, … } | { ok: false, error: string }`; never throws into UI.
- Aviation tools carry the existing "for training and planning only" notice.
- Hubs at `/category/<slug>/`, only `india` and `aviation`.
- Fonts ship only if verified against ≥ 2 independent sources + real text; otherwise not built (Shivaji stays `maintenance`).
- Conventional commits. Push with gh account `jha-adrs` after `npm run verify` + `npm run e2e` are green (owner pre-approved).

## Review Focus

1. **Styled QR codes that do not scan** (dots/fluid/diamond + logo + gradient). Expect: every preset decodes back to the input. → Task 12 decode-back e2e (jsQR on real Chromium pixels).
2. **EML remote content loading** (tracking pixel, CSS `url()`, `<link>`). Expect: zero requests to the tracker host. → Task 12 canary + Task 10 unit test that srcdoc carries the meta CSP and no `allow-scripts`.
3. **HAR secrets surviving redaction** (JWT in a response body, token in `postData.params`, cookie in a `Cookie` header and `cookies[]`). Expect: none of them in output when its category is on. → Task 9 tests.
4. **Wi-Fi/MeCard escaping** (SSID or password containing `;`, `,`, `:`, `\`, `"`). Expect: escaped per ZXing spec, so the phone joins the right network. → Task 1 tests.
5. **METAR groups the decoder does not know** (e.g. `NOSIG`, `WS R27`, `////`). Expect: shown raw, never dropped, no crash. → Task 6 tests.

---

### Task 0: Baseline

- [ ] `npm run build > .superpowers/sdd/2026-10-08-niche-batch-2/baseline-build.txt 2>&1`; record First Load JS (expect ~104 kB) and `grep -c '<url>' out/sitemap.xml` (expect 188).

---

## Builder tasks (parallel; new files only unless stated)

**Per-tool contract** for Tasks 1–10: files `lib/<topic>.ts`, `components/tools/<Name>.tsx`, `test/lib/<topic>.test.ts`, `test/tools/<Name>.test.tsx`, `lib/tool-content/<slug>.ts` (`export default { intro, steps, faq } satisfies ToolContent` from `./types`; 300–700 words, 3–6 steps, 3–6 FAQs, hedged). Read `components/tools/Base64.tsx`, `components/tools/IcsViewer.tsx` and `lib/tool-content/ics-viewer.ts` first as style references. RED first: run the new test file, see it fail, then implement. Run `npx vitest run <your test files>` and `npx tsc --noEmit` before reporting. Do **not** edit `lib/tools.ts`, `components/ToolMount.tsx`, `lib/tool-content.ts` or `test/e2e/*`. Report: files created, exported signatures, test counts.

### Task 1: QR libraries — `lib/qr/*`

**Files:** Create `lib/qr/payloads.ts`, `lib/qr/matrix.ts`, `lib/qr/render-svg.ts`, `lib/qr/export.ts`, `lib/qr/contrast.ts`, `test/lib/qr-payloads.test.ts`, `test/lib/qr-matrix.test.ts`, `test/lib/qr-render.test.ts`, `test/lib/qr-contrast.test.ts`.

**Interfaces — Produces:**

```ts
// payloads.ts
export type QrType = 'url'|'text'|'wifi'|'vcard'|'mecard'|'email'|'sms'|'phone'|'whatsapp'|'geo'|'event'|'upi'
export type Result = { ok: true; text: string } | { ok: false; error: string }
export function buildPayload(type: QrType, f: Record<string, string>): Result
export const UPI_ID = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/
// matrix.ts
export type Ec = 'L'|'M'|'Q'|'H'
export interface QrMatrix { size: number; dark: boolean[][]; isEye(r: number, c: number): boolean }
export async function makeMatrix(text: string, ec: Ec): Promise<QrMatrix>   // lazy import('qrcode-generator')
// render-svg.ts
export type ModuleShape = 'square'|'rounded'|'dots'|'classy'|'diamond'|'vbars'|'hbars'|'fluid'
export type EyeFrame = 'square'|'rounded'|'circle'|'leaf'
export type EyeBall = 'square'|'rounded'|'circle'|'diamond'
export type Fill = { kind: 'solid'; color: string } | { kind: 'linear'|'radial'; from: string; to: string; angle?: number }
export interface QrStyle { module: ModuleShape; eyeFrame: EyeFrame; eyeBall: EyeBall; fill: Fill; eyeColor: string; background: string | 'transparent'; quiet: number /* modules, 0–8 */; logo?: { dataUrl: string; scale: number /* 0.1–0.25 */; clear: boolean }; frame: 'none'|'box'|'badge'; cta: string }
export function renderSvg(m: QrMatrix, s: QrStyle): string
export const PRESETS: { id: string; label: string; style: QrStyle }[]  // 6 presets
// export.ts
export async function svgToBlob(svg: string, px: number, mime: 'image/png'|'image/jpeg'): Promise<Blob>   // Image + canvas; px clamped 256–4096; JPEG fills white under transparent
// contrast.ts
export type Warning = { kind: 'contrast'|'inverted'|'ec-raised'; message: string }
export function contrastRatio(a: string, b: string): number                     // WCAG, hex #rgb/#rrggbb
export function scanWarnings(s: QrStyle, ec: Ec): { warnings: Warning[]; ec: Ec } // ec raised to 'H' when logo.scale > 0.2
```

- [ ] **RED — payloads** (`test/lib/qr-payloads.test.ts`):
  - `buildPayload('wifi', { ssid: 'My;Net', password: 'p:a,s"s\\', security: 'WPA', hidden: 'false' })` → `WIFI:T:WPA;S:My\;Net;P:p\:a\,s\"s\\;H:false;;`
  - wifi `security: 'nopass'` → `WIFI:T:nopass;S:x;;` (no `P:`); empty SSID → `{ ok:false }`.
  - `upi`: `{ pa: 'shop@okhdfc', pn: 'A & B', am: '150.5', tn: 'Tea' }` → `upi://pay?pa=shop%40okhdfc&pn=A%20%26%20B&am=150.50&cu=INR&tn=Tea`. `pa: 'bad'` → error; `am: '-1'`, `am: '1.234'`, `am: '100001'` → error ("UPI amounts are capped at ₹1,00,000"). Empty `am` → no `am=` parameter.
  - `vcard`: `{ name: 'Asha Rao', phone: '+91 98450 00000', email: 'a@x.in', org: 'X' }` → starts `BEGIN:VCARD\r\nVERSION:3.0\r\n`, contains `N:Rao;Asha;;;`, `FN:Asha Rao`, `TEL;TYPE=CELL:+91 98450 00000`, ends `END:VCARD`. `;` and `,` in values escaped with `\`.
  - `mecard` `{ name: 'Rao,Asha', phone: '1' }` → `MECARD:N:Rao\,Asha;TEL:1;;`.
  - `email` → `mailto:a@x.in?subject=Hi%20there&body=x`; `sms` → `SMSTO:+911234:hello`; `phone` → `tel:+911234`; `whatsapp` `{ phone: '+91 98450-00000', text: 'hi' }` → `https://wa.me/919845000000?text=hi`; `geo` `{ lat: '12.97', lon: '77.59' }` → `geo:12.97,77.59`, lat `91` → error.
  - `event` `{ title: 'Demo', start: '2026-10-08T09:00', end: '2026-10-08T10:00' }` → contains `BEGIN:VEVENT`, `SUMMARY:Demo`, `DTSTART:20261008T090000`, `DTEND:20261008T100000`, `END:VEVENT`; end before start → error.
  - `url` without scheme `example.com` → `https://example.com`; `text` empty → error.
- [ ] **RED — matrix:** `makeMatrix('hi', 'M')` size 21; 200-char text gives size > 21; `isEye(0,0)`, `isEye(0,size-1)`, `isEye(size-1,0)`, `isEye(6,6)` true, `isEye(size-1,size-1)` false, `isEye(8,8)` false; `dark[0][0]` true.
- [ ] **RED — render:** with `module:'square'` the SVG (parse with `DOMParser`, `image/svg+xml`) has exactly `count(dark && !isEye)` module elements marked `data-m`, plus 3 `data-eye-frame` and 3 `data-eye-ball` groups; every shape in `ModuleShape` renders without throwing and yields a parseable SVG with a `viewBox`; `fill.kind:'linear'` adds a `<linearGradient>` in `<defs>`; `logo` set adds one `<image href="data:…">`, and with `clear:true` no `data-m` module lies under the logo box; `background:'transparent'` → no background `<rect>`; `frame:'box', cta:'Scan me'` → `<text>` with `Scan me` and viewBox taller than wide; `cta` with `<&>` is XML-escaped. `PRESETS.length === 6`.
- [ ] **RED — contrast:** `contrastRatio('#000','#fff')` ≈ 21; `#777` on `#888` < 4 → `contrast` warning; light module on dark background → `inverted` warning; logo scale 0.22 with ec `M` → returns `ec:'H'` + `ec-raised` warning; gradient uses darkest stop.
- [ ] **GREEN:** implement. Notes: Wi-Fi/MeCard escape `\ ; , : "` with `\`. `fluid`: draw each dark module as a rounded rect and fill the gaps to dark right/bottom neighbours with plain rects so neighbours merge. `classy`: rounded top-left + bottom-right corners only. `vbars`/`hbars`: merge runs into one rounded rect. Eyes always drawn as separate groups (frame 7×7 ring, ball 3×3) so module shapes never distort finder patterns. `export.ts` is browser-only; no unit test (covered in Task 12 e2e).
- [ ] Verify `npx vitest run test/lib/qr-*.test.ts` green; `npx tsc --noEmit`.
- [ ] Commit `feat(qr): payload builders, matrix wrapper, SVG renderer, scan warnings`.

### Task 2: QR designer component + UPI page

**Files:** Rewrite `components/tools/QrCodeGenerator.tsx`; create `components/tools/UpiQrCodeGenerator.tsx`, `lib/tool-content/qr-code-generator.ts` (new — none exists yet), `lib/tool-content/upi-qr-code-generator.ts`; rewrite `test/tools/QrCodeGenerator.test.tsx`; create `test/tools/UpiQrCodeGenerator.test.tsx`.

**Interfaces — Consumes:** everything Task 1 produces. **Produces:** `export default function QrCodeGenerator({ initialType }: { initialType?: QrType })`; `UpiQrCodeGenerator` = `<QrCodeGenerator initialType="upi" />`.

- [ ] **RED (component tests):** content-type `Select` labelled "Content" lists 12 types; typing a URL renders an `<svg>` preview (await `findByRole('img', { name: /qr code preview/i })`); choosing "Wi-Fi" shows SSID/password/security fields; clicking a preset button changes the preview markup; uploading a logo (`FileDrop`, PNG) shows "Error correction raised to H" notice; contrast warning shown when colours `#777777` / `#888888`; "Download SVG" calls `URL.createObjectURL` with a Blob of type `image/svg+xml` and revokes it; the exact free/no-watermark copy is present. UPI wrapper: content type preselected "UPI payment", fields "UPI ID", "Payee name", "Amount (optional)", "Note"; invalid UPI ID shows an error and no preview.
- [ ] **GREEN:** layout — `Toolbar` (Content select) → per-type fields (`TextInput`/`TextArea`) → `IO`: left `Panel` "Design" (presets row; module/eye-frame/eye-ball pickers as `Segmented` or small buttons with `aria-label`; colour `<input type="color">` inside `Field`s; gradient `Toggle` + second colour; background colour + "Transparent" toggle; logo `FileDrop` accept `image/*` read by `FileReader.readAsDataURL`, with remove + size slider 10–25%; frame `Select` + CTA `TextInput`; quiet zone; EC `Select`), right `Panel` "Preview" (`<div role="img" aria-label="QR code preview" dangerouslySetInnerHTML={{ __html: svg }}>` — svg is generated by our own renderer with escaped text), warnings as `Notice kind="warn"`, export buttons: PNG size `Select` (256/512/1024/2048/4096) + "Download PNG", "Download JPEG", "Download SVG", `CopyButton` "Copy SVG". Debounce re-render 150 ms. Filenames `qr-code.png|jpg|svg` (never derived from content).
- [ ] Verify tests + `npx tsc --noEmit`.
- [ ] Commit `feat(qr): free QR designer with shapes, logos, frames; UPI QR page`.

### Task 3: `gstin-validator` + `aadhaar-validator`

**Files:** Create `lib/gstin.ts`, `lib/verhoeff.ts`, `components/tools/GstinValidator.tsx`, `components/tools/AadhaarValidator.tsx`, tests, `lib/tool-content/gstin-validator.ts`, `lib/tool-content/aadhaar-validator.ts`.

**Interfaces — Produces:**

```ts
export function gstinCheckChar(first14: string): string
export type GstinInfo = { ok: true; gstin: string; state: string; stateCode: string; pan: string; entity: string; entityNo: string } | { ok: false; gstin: string; error: string }
export function validateGstin(input: string): GstinInfo      // trims, uppercases
export function verhoeffCheck(digits: string): number         // check digit to append
export function verhoeffValid(digits: string): boolean
export function validateAadhaar(input: string): { ok: true; masked: string } | { ok: false; error: string }  // strips spaces/hyphens
```

- [ ] **RED vectors** (verified 2026-10-08 with the mod-36 algorithm):
  - valid: `27AAPFU0939F1ZV` (Maharashtra, PAN `AAPFU0939F`, entity "Firm"), `29AAACB2894G1ZJ` (Karnataka, "Company"), `33AAACH7409R1Z8` (Tamil Nadu).
  - invalid check char: `07AAACR5055K1Z8` → error mentions check character (expected `9`).
  - bad format `27AAPFU0939F1YV` (14th not `Z`) → format error; state `40` → unknown state; lowercase input accepted.
  - mod-36: factor 1 at even index, 2 at odd; `sum += floor(p/36) + p%36`; check = `(36 - sum%36) % 36` over `0-9A-Z`.
  - PAN 4th char → entity: P Individual, C Company, H HUF, F Firm, A AOP, T Trust, B BOI, L Local authority, J Artificial juridical person, G Government, K Krish (AJP).
  - Verhoeff: `verhoeffCheck('236') === 3`; `verhoeffValid('2363')`; `verhoeffCheck('23412341234') === 9`; `validateAadhaar('2341 2341 2349')` ok, masked `XXXX XXXX 2349`; `234123412348` → check-digit error; `134123412349` (starts 1) → error; 11 digits → error.
  - Batch: component given 3 lines → table 3 rows, "Download CSV" uses `toCsv` from `lib/csv-write.ts`.
- [ ] **GREEN:** state table 01–38 + 97 (Other territory) + 99 (Centre jurisdiction). Aadhaar UI: number masked by default, `Toggle` "Show full number"; notice "This checks the format and check digit only. It cannot tell you whether an Aadhaar number was issued." Link to `/tools/aadhaar-masker/`.
- [ ] Verify; commit `feat(india): GSTIN and Aadhaar format validators`.

### Task 4: `hindi-typing-keyboard`

**Files:** Create `lib/hindi-keyboard.ts`, `components/tools/HindiTypingKeyboard.tsx`, tests, `lib/tool-content/hindi-typing-keyboard.ts`.

**Interfaces — Consumes:** `toUnicode(text, 'krutidev')` from `lib/legacy-fonts.ts` (Remington Gail = Kruti Dev key layout; reuse handles pre-base `ि` and reph reordering). **Produces:**

```ts
export type Layout = 'remington' | 'inscript'
export const INSCRIPT: Record<string, string>               // key char (with shift) → Devanagari
export function typeKeys(keys: string, layout: Layout): string   // raw key sequence → Unicode
export const CHART: Record<Layout, { key: string; out: string }[][]>  // rows for the on-screen chart
```

- [ ] **RED:** InScript: `typeKeys('k','inscript') === 'क'`, `'kd'` → `क्`, `'ke'` → `का`, `'kf'` → `कि`, `'kdk'` → `क्क`, `'jhl'` → `रपत`. Remington: `typeKeys('Hkkjr','remington') === 'भारत'`, `'fgUnh'` → `हिन्दी`, `'deZ'` → `कर्म`. Component: choose layout, type into the input textarea (`fireEvent.change` with raw keys) → output textarea shows Unicode; `CopyButton` and "Download .txt" present; chart renders 4 rows.
- [ ] **GREEN:** InScript map from the BIS IS 13194 / Microsoft InScript layout (cite in header comment; ≥ 2 sources). Component keeps raw keys in state and derives Unicode (`typeKeys`) so backspace works on raw keys. Practice mode out of scope.
- [ ] Commit `feat(india): Hindi typing keyboard (Remington Gail, InScript)`.

### Task 5: Legacy fonts — research gate

**Files:** Modify `lib/legacy-fonts.ts`, `test/lib/legacy-fonts.test.ts`; create on success `components/tools/WalkmanChanakyaToUnicode.tsx`, `components/tools/ShreeLipiToUnicode.tsx`, content files; write findings to `.superpowers/sdd/2026-10-08-niche-batch-2/fonts-research.md`.

- [ ] For each of Walkman-Chanakya 901, Shree-Lipi (Shree-Dev-0714), Shivaji (remaining glyphs): find ≥ 2 independent published character maps (WebSearch/WebFetch of reference tables — no copied code) and ≥ 10 real word pairs from public text.
- [ ] Gate per font: tables agree on every mapped glyph and all word pairs convert exactly → **pass**; otherwise → **fail** (do not build; record why).
- [ ] Pass: extend `LegacyFont` union + `FONT_SUPPORT`, RED tests with the word pairs (cite sources in test comments) → GREEN tables; wrapper `<LegacyFontConverter font="…" />`; content file. Shivaji pass → report "flip to live" for Task 11.
- [ ] Report pass/fail per font with sources. Commit `feat(india): <font> to Unicode` per passing font, or `docs: legacy font research notes` if none pass.

### Task 6: `metar-decoder` + `taf-decoder` — `lib/metar.ts`

**Files:** Create `lib/metar.ts`, `components/tools/MetarDecoder.tsx`, `components/tools/TafDecoder.tsx`, tests, 2 content files.

**Interfaces — Produces:**

```ts
export type Row = { group: string; label: string; meaning: string }   // raw group kept
export type FlightCat = 'VFR'|'MVFR'|'IFR'|'LIFR'
export function decodeMetar(text: string): { ok: true; station: string; rows: Row[]; category: FlightCat | null; remarks: string } | { ok: false; error: string }
export type TafPeriod = { kind: 'BASE'|'FM'|'TEMPO'|'BECMG'|'PROB'; from: string; to: string; prob?: number; rows: Row[] }
export function decodeTaf(text: string): { ok: true; station: string; issued: string; valid: string; periods: TafPeriod[] } | { ok: false; error: string }
export function flightCategory(ceilingFt: number | null, visSm: number | null): FlightCat
```

- [ ] **RED vectors:**
  - `KJFK 121651Z 31015G25KT 10SM FEW050 SCT250 22/12 A3002 RMK AO2 SLP165` → station KJFK; time "12th, 16:51 UTC"; wind "From 310° at 15 kt, gusting 25 kt"; vis "10 statute miles"; clouds "Few at 5,000 ft", "Scattered at 25,000 ft"; temp 22 °C dew 12 °C; altimeter "30.02 inHg (1016.6 hPa)"; category VFR; remarks `AO2 SLP165` raw.
  - `METAR VIDP 080530Z 00000KT 0800 R28/1200U FG VV002 12/12 Q1015 NOSIG` → calm wind; vis "800 m"; RVR runway 28 1,200 m rising; "Fog"; vertical visibility 200 ft; `Q1015` → "1015 hPa (29.97 inHg)"; LIFR; `NOSIG` → "No significant change expected".
  - `EGLL 081150Z 24008KT 200V280 CAVOK 18/09 Q1021` → variable 200°–280°; CAVOK; VFR.
  - `-TSRA BR BKN008CB OVC015` → "Light thunderstorm with rain", "Mist", "Broken at 800 ft (cumulonimbus)"; ceiling 800 → IFR.
  - Unknown group `WS R27` / `////` / `ZZZZ` → row with label "Not decoded", meaning = raw; nothing dropped (joined groups == input groups).
  - `flightCategory`: ceiling 400 → LIFR; 900 → IFR; 2500 → MVFR; vis 4 SM → MVFR; null/null → VFR.
  - TAF: `TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250 FM081800 30012G20KT P6SM SCT050 TEMPO 0820/0824 3SM -SHRA BKN030 PROB30 0902/0906 1SM BR OVC004` → 4 periods (BASE, FM 08 18:00, TEMPO 08 20:00–08 24:00, PROB30 09 02:00–06:00); `P6SM` → "More than 6 statute miles"; empty input → error.
- [ ] **GREEN:** weather codes per WMO 4678 (intensity `-`/`+`/`VC`, descriptors MI BC PR DR BL SH TS FZ, phenomena DZ RA SN SG IC PL GR GS UP BR FG FU VA DU SA HZ PY PO SQ FC SS DS). Components: `TextArea` paste → table (`Panel`), flight-category badge (colours from tokens), training notice, "Paste a METAR from your briefing source — this page does not fetch weather."
- [ ] Commit `feat(aviation): METAR and TAF decoders`.

### Task 7: Aviation calculators (4) — extend `lib/aviation.ts`

**Files:** Modify `lib/aviation.ts`, `test/lib/aviation.test.ts`; create `components/tools/CloudBaseCalculator.tsx`, `PressureAltitudeCalculator.tsx`, `FlightTimeFuelCalculator.tsx`, `WeightAndBalanceCalculator.tsx`, component tests, 4 content files.

**Interfaces — Produces** (reuse existing `Fail` type):

```ts
export function cloudBase(i: { tempC: number; dewC: number }): { ok: true; baseFt: number; baseFt400: number; rhPct: number } | Fail
export function pressureAltitude(i: { elevationFt: number; altimeter: number; unit: 'inHg'|'hPa' }): { ok: true; pressureAltFt: number; ruleOfThumbFt: number } | Fail
export function flightTimeFuel(i: { distanceNm: number; groundSpeedKt: number; burnPerHour: number; reserveMin: number; fuel: 'avgas'|'jeta'; unit: 'gal'|'L'|'lb' }): { ok: true; minutes: number; tripFuel: number; reserveFuel: number; totalFuel: number; totalLb: number } | Fail
export type WbRow = { item: string; weight: number; arm: number }
export function weightBalance(rows: WbRow[], env: { minCg: number; maxCg: number; maxWeight: number }): { ok: true; totalWeight: number; totalMoment: number; cg: number; within: boolean; reasons: string[] } | Fail
```

- [ ] **RED vectors:** cloud base 25 °C / 15 °C → 4,000 ft (spread ÷ 2.5 × 1000), 4,000 (400 ft/°C × 10 = 4,000), RH ≈ 54 % (Magnus a=17.625, b=243.04; ±1); dew > temp → error. Pressure altitude: elev 0, 1003.25 hPa → 274 ft (±1; `PA = elev + (1 − (hPa/1013.25)^0.190284) × 145366.45`); elev 1000, 29.42 inHg → 1,467 ft (±1), rule of thumb `1000 + (29.92 − 29.42) × 1000 = 1500`; 1013.25 hPa → PA = elev. Flight: 150 nm @ 120 kt → 75 min; 10 gal/h, reserve 45 → trip 12.5, reserve 7.5, total 20 gal, 120 lb (avgas 6 lb/gal; Jet A 6.7); L unit converts 1 gal = 3.78541 L; ground speed 0 → error. W&B: rows 1500@85, 340@87, 180@95; env 82–93, max 2300 → total 2020, moment 174,180, CG 86.23 (±0.01), within; max 2000 → not within, reason mentions weight; empty rows → error.
- [ ] **GREEN:** components with numeric inputs, unit `Segmented`, results `Panel`; W&B has add/remove row buttons and states "Enter the numbers from your aircraft's POH — there is no aircraft database." Pressure altitude links to `/tools/density-altitude-calculator/`.
- [ ] Commit `feat(aviation): cloud base, pressure altitude, flight time/fuel, weight & balance`.

### Task 8: `subtitle-sync-fixer` — `lib/subtitles.ts`

**Interfaces — Produces:**

```ts
export type Cue = { start: number; end: number; text: string }   // ms
export function parseSubtitles(text: string): { ok: true; format: 'srt'|'vtt'; cues: Cue[]; skipped: number } | { ok: false; error: string }
export function shift(cues: Cue[], ms: number): Cue[]                        // clamps at 0
export function resync(cues: Cue[], a: { from: number; to: number }, b: { from: number; to: number }): Cue[]   // linear map
export function fixOverlaps(cues: Cue[]): Cue[]                              // sort by start; end = min(end, next.start - 1)
export function toSrt(cues: Cue[]): string
export function toVtt(cues: Cue[]): string
export function parseTime(s: string): number | null                         // '00:01:02,500' | '01:02.500' | '-1.5s' style offsets not needed
```

- [ ] **RED:** SRT with BOM + CRLF + 2 cues parses; VTT with header, `NOTE` block, cue settings (`line:0`) and cue ids parses; malformed cue skipped (count 1). `shift(+1500)` moves `00:00:01,000` → `00:00:02,500`; `shift(-5000)` clamps to 0. `resync` with cue at 10 s → 12 s and cue at 100 s → 104 s maps 55 s → 58 s. `toSrt` renumbers from 1 with `,` milliseconds; `toVtt` starts `WEBVTT` with `.`. Multi-line cue text preserved. Component: file load or paste, "Shift by (ms)" + Apply, two-point resync fields, output format `Segmented` (SRT/VTT), download named `<original-base>.synced.srt|vtt`.
- [ ] Commit `feat(files): subtitle sync fixer (shift, drift resync, SRT/VTT)`.

### Task 9: `har-sanitizer` — `lib/har.ts`

**Interfaces — Produces:**

```ts
export type Category = 'cookies'|'auth'|'query'|'jwt'|'bodies'
export type Finding = { category: Category; where: string; name: string; preview: string }  // preview masked
export function maskSecret(v: string): string            // first 3 chars + '…' + ` (${len} chars)`; < 8 chars → '••••'
export function analyzeHar(text: string): { ok: true; har: unknown; findings: Finding[] } | { ok: false; error: string }
export function redactHar(har: unknown, on: Set<Category>): { text: string; count: number }  // JSON.stringify(_, null, 2)
```

- [ ] **RED:** fixture HAR (built in the test) with: request `Cookie` header + `cookies[]`, response `Set-Cookie` + `cookies[]`, `Authorization: Bearer <jwt>`, `X-Api-Key`, query `?access_token=…&page=2`, `postData.params` `password=…`, `postData.text` JSON with `"refresh_token":"…"`, response `content.text` containing a JWT (`eyJ…`). With all categories on: output contains none of the secret values, still contains `page=2` and URL host; `count` equals number of findings. With only `cookies` on: JWT still present. Header-name match case-insensitive (`authorization`, `x-auth-token`, `proxy-authorization`). Query/params name regex `/token|key|secret|session|code|password|auth|sig/i`. JWT regex `/eyJ[\w-]+\.[\w-]+\.[\w-]*/g` replaced everywhere (incl. `url`, `headers`, bodies). Redacted value literal `[REDACTED]`; in URLs `REDACTED` (no brackets, stays a valid URL). Invalid JSON / no `log.entries` → error. `maskSecret` never returns the full value.
- [ ] **GREEN:** component: `FileDrop` `.har` (and paste), findings table grouped by category with per-category `Toggle`s (all on by default; `bodies` = drop request/response bodies entirely, off by default), summary "N values will be redacted", "Download sanitized HAR" → `<base>.sanitized.har`.
- [ ] Commit `feat(files): HAR sanitizer`.

### Task 10: `eml-viewer` — `lib/eml.ts`

**Interfaces — Produces:**

```ts
export type Attachment = { filename: string; mime: string; bytes: Uint8Array }
export type Email = { headers: { name: string; value: string }[]; subject: string; from: string; to: string; date: string; text: string; html: string | null; attachments: Attachment[] }
export function decodeWords(s: string): string                       // RFC 2047 B and Q
export function parseEml(raw: string | Uint8Array): { ok: true; email: Email } | { ok: false; error: string }
export const SANDBOX_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'"
export function safeSrcdoc(html: string): string                     // prepends <meta http-equiv="Content-Security-Policy" content=SANDBOX_CSP>, strips <script>, <meta http-equiv=refresh>, <base>
```

- [ ] **RED:** `decodeWords('=?UTF-8?B?4KS54KS/4KSo4KWN4KSm4KWA?=')` → `हिन्दी`; `=?ISO-8859-1?Q?Caf=E9_ok?=` → `Café ok`; adjacent encoded words joined without the space. Single-part `text/plain; charset=utf-8` quoted-printable with soft line breaks (`=\r\n`) and `=C3=A9` decodes. `multipart/alternative` inside `multipart/mixed` with base64 PDF attachment: text + html found, attachment filename (RFC 2231 `filename*=UTF-8''r%C3%A9sum%C3%A9.pdf` → `résumé.pdf`) and bytes length correct. Folded headers unfolded. `safeSrcdoc('<img src="https://tracker.example/p.gif"><script>x</script>')` starts with the CSP meta and contains no `<script`. Missing blank line between headers and body → still parses headers. Component: iframe has `sandbox=""` (no `allow-scripts`, no `allow-same-origin`) and `srcDoc` beginning with the CSP meta; attachment download creates and revokes an object URL; notice "Remote images and trackers in this email are blocked."
- [ ] **GREEN:** charset via `new TextDecoder(charset, { fatal: false })` with `utf-8` fallback for unknown labels.
- [ ] Commit `feat(files): EML viewer with blocked remote content`.

---

## Integration (central, sequential)

### Task 11: Category hubs

**Files:** Create `lib/hubs.ts`, `app/category/[slug]/page.tsx`, `test/frame/CategoryHub.test.tsx`, `test/lib/hubs.test.ts`. Modify `components/CategoryNav.tsx`, `app/tools/[slug]/page.tsx` (crumb), `components/Footer.tsx`, `app/sitemap.ts`, `test/lib/indexing.test.ts` (sitemap tests), `app/globals.css` (only if hub layout needs a class).

**Interfaces — Produces:**

```ts
export interface Hub { slug: 'india' | 'aviation'; category: Category; title: string; description: string; intro: string[]; faq: { q: string; a: string }[] }
export const HUBS: Hub[]
export function hubForCategory(c: Category): Hub | undefined
export const hubHref = (h: Hub) => `/category/${h.slug}/`
```

- [ ] **RED:** hubs test: 2 hubs, intro 150–300 words, 3–5 FAQs, hedged wording regex passes. Page test (render the server component like `ToolAbout` tests): H1 = hub title; lists every live tool of the category as a link to `/tools/<slug>/`; `ItemList` JSON-LD with matching count; FAQPage JSON-LD; `generateMetadata` gives canonical `https://dauntexlabs.com/category/india/`. `CategoryNav` link mode: India → `/category/india/`, Aviation → `/category/aviation/`, Utilities → `/?cat=Utilities`; button mode unchanged. Tool page crumb for an India tool links to `/category/india/`. Sitemap includes both hub URLs; count = 3 + live tools + indexed pairs + hubs (computed in the test).
- [ ] **GREEN:** page: `generateStaticParams` from `HUBS`, `dynamicParams = false`, reuse `SiteHeader`, `CategoryNav`, `ToolCard`, `JsonLd`, `.faq` details markup from `ToolAbout`. Footer: "India tools" and "Aviation tools" links.
- [ ] Commit `feat(seo): India and Aviation category hubs`.

### Task 12: Wiring, privacy canaries, decode-back e2e, gates, docs, push

- [ ] `lib/tools.ts`: entries for `upi-qr-code-generator`, `gstin-validator`, `aadhaar-validator`, `hindi-typing-keyboard`, `metar-decoder`, `taf-decoder`, `cloud-base-calculator`, `pressure-altitude-calculator`, `flight-time-fuel-calculator`, `weight-and-balance-calculator`, `subtitle-sync-fixer`, `har-sanitizer`, `eml-viewer` (+ passing fonts from Task 5); update `qr-code-generator` blurb/keywords (styled, logo, SVG, Wi-Fi, free no watermark). Categories: `upi-qr-code-generator`, `gstin-validator`, `aadhaar-validator`, `hindi-typing-keyboard` → `'India'`; six aviation tools → `'Aviation'`; `subtitle-sync-fixer` → `'Converters'`; `har-sanitizer` → `'Data Tools'`; `eml-viewer` → `'Utilities'`; `qr-code-generator` stays `'Generators'`. `ToolMount` lines; `lib/tool-content.ts` imports.
- [ ] `test/e2e/privacy.spec.ts`: typed canaries for `gstin-validator`, `aadhaar-validator`, `hindi-typing-keyboard`, `metar-decoder`, `taf-decoder`, aviation calculators; QR cases (Wi-Fi password = canary; UPI ID `canary@okhdfc` lowercase canary; vCard name; logo file named `<canary>.png`); file cases `subtitle-sync-fixer` (SRT with canary text), `har-sanitizer` (HAR whose cookie/token values contain canary), `eml-viewer` (email with canary subject + `<img src="https://tracker.example/<canary>.gif">` — assert no request to `tracker.example`).
- [ ] **Ruling:** decode-back uses `jsqr` as a **devDependency** (test-only, never bundled) instead of `BarcodeDetector`, which Linux CI Chromium lacks — the spec's fallback would skip the check on every CI run. `test/e2e/qr.spec.ts`: for each preset (and one with a logo at 25 %), type `https://dauntexlabs.com/test`, click "Download PNG" (1024), read the download, decode pixels in the page via canvas `getImageData` → pass to Node → `jsQR` → equals the input. Also SVG download parses (`DOMParser`, no `parsererror`) and PNG starts with `89 50 4E 47`.
- [ ] Gates: `npm run verify > …/verify.txt; npm run e2e > …/e2e.txt`; sitemap count matches test; First Load JS ~104 kB; QR chunk separate; screenshot sweep (`node .superpowers/shots.mjs`) of new pages + hubs at 1280/390 — no horizontal scroll.
- [ ] `CLAUDE.md`: tool counts, hubs (`lib/hubs.ts`, `/category/<slug>/`), QR designer libs, `initialType` prop exception.
- [ ] Final whole-branch review (fresh reviewer, most capable model) → fix Critical/Important RED→GREEN → push `git push origin main` as `jha-adrs`; `gh run watch`; live smoke: `curl -s https://dauntexlabs.com/tools/upi-qr-code-generator/ | grep -o '<title>[^<]*'`, `/category/india/` 200.
