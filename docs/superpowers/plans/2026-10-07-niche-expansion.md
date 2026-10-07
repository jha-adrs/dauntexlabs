# Niche Expansion + SEO Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prune commodity `/convert` pages from the index, add server-rendered about/FAQ content, make "nothing private leaves the device" enforced by tests and CSP, and ship 17 niche tool pages + ~23 niche convert pages.

**Architecture:** Phase 0 changes existing frame/SEO code (`lib/conversions.ts`, `app/sitemap.ts`, `ToolAbout`, `SiteHeader`/`HomeClient` hash search, `Analytics` sanitising, `public/_headers` CSP). Phase 1 adds tools the established way: pure logic in `lib/<topic>.ts` (unit-tested), a thin `'use client'` component composing the kit, a registry entry, a `ToolMount` line, and a `TOOL_CONTENT` entry. New-tool work produces only new files; registry wiring is done centrally so parallel work never conflicts.

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, Vitest + RTL (jsdom), Playwright, `pdf-lib` (existing lazy dep), native Canvas / DOMParser / Intl.

**Spec:** `docs/superpowers/specs/2026-10-07-niche-expansion-design.md`

## Global Constraints

- No network for tool logic: no `fetch`, XHR, WebSocket, `sendBeacon`, `EventSource`, remote resources built from user data.
- User data never in URL (path/query/hash), `document.title`, storage, cookies, or `console.*`.
- Object URLs revoked after use; image outputs re-encoded via Canvas.
- No new runtime dependencies. Libraries only via existing lazy `pdf-lib`. Shared First Load JS stays ~104 KB.
- Privacy copy hedged: "designed to run in your browser" / "processed on your device". Never "never uploaded", "nothing leaves", "no uploads".
- Sentence case UI copy; compose `components/ui/kit.tsx`; light Workbench tokens only (`--accent`, `--danger`, `--warn`, …), never legacy aliases in new code.
- New categories exactly `'Aviation'` and `'India'`, appended to `CATEGORY_ORDER`.
- `isIndexedPair`: non-unit → true; `category === 'Number scale'` → true; `fromKey`/`toKey` ∈ {`Length:nmi`, `Speed:knot`} → true; else false.
- Tool `<title>`/description/canonical unchanged except the deliberate site-wide description hedge (Task 4).
- Conventional commits. Pushes: owner pre-authorised "build and push" for this plan; push only with `npm run verify` + `npm run e2e` green.

## Review Focus

1. **Search term leakage after the hash change** — a user searching from a tool page must not produce any request (document or GA) carrying the term. → Task 3 canary test `header search term never leaves the page`.
2. **CSP breaking the site** — Next inline bootstrap, `next/font` files, blob downloads, the Markdown-to-PDF print iframe and GA must all still work under the CSP. → Task 3 CSP e2e asserts zero violations on home, a tool page, a convert page and `markdown-to-pdf`.
3. **Legacy font tables producing garbled Hindi** — conversion must round-trip a fixed corpus and match known pairs. → Task 10 tests.
4. **Parsers on messy real files** (folded vCard/ICS lines, QUOTED-PRINTABLE, CRLF, BOM, KML without altitude) must not crash and must report skipped items. → Tasks 7, 8 tests.
5. **Aviation maths at edge inputs** (wind ≥ TAS, negative altitude, 0 kt wind) must give an explicit error or a correct finite value, never `NaN`. → Task 6 tests.

---

## Phase 0 — cleanup + privacy (push 1)

### Task 0: Baseline

- [ ] `npm run build > .superpowers/baseline2/build.txt`; save head tags for `index`, `tools/jwt-tool/index`, `tools/keyword-density/index`, `convert/kilometers-to-miles/index`, `convert/knots-to-kilometers-per-hour/index` (same grep as rebrand plan Task 0); record sitemap count (369) and First Load JS (104 kB).

### Task 1: `/convert` pruning

**Files:** Modify `lib/conversions.ts`, `app/sitemap.ts`, `app/convert/[slug]/page.tsx`. Test `test/lib/conversions.test.ts` (extend), `test/lib/sitemap.test.ts` (new).

**Interfaces — Produces:** `export function isIndexedPair(p: Pair): boolean` (lib/conversions.ts).

- [ ] **RED:** add tests: `isIndexedPair(getPair('kilometers-to-miles')!) === false`; `knots-to-kilometers-per-hour` true; `meters-to-nautical-miles` true; `decimal-to-binary` (number base) true; `png-to-jpg` true; count of non-indexed unit pairs === 220. `sitemap()` (import `app/sitemap.ts` default) contains no `/convert/kilometers-to-miles/` and does contain `/convert/knots-to-kilometers-per-hour/`. Run → fail (not exported).
- [ ] **GREEN:** implement:

```ts
const INDEXED_UNIT_KEYS = new Set(['Length:nmi', 'Speed:knot'])
/** Commodity unit pairs are noindexed (Google answers them in-SERP); niche pairs stay indexed. */
export function isIndexedPair(p: Pair): boolean {
  if (p.family !== 'unit') return true
  if (p.category === 'Number scale') return true
  return INDEXED_UNIT_KEYS.has(p.fromKey) || INDEXED_UNIT_KEYS.has(p.toKey)
}
```

  `app/sitemap.ts`: `...PAIRS.filter(isIndexedPair).map(...)`. `generateMetadata` in `app/convert/[slug]/page.tsx`: add `robots: isIndexedPair(pair) ? undefined : { index: false, follow: true }`.
- [ ] Verify: `npm test`, build; `grep -c '<url>' out/sitemap.xml` = 149; `grep -o '<meta name="robots"[^>]*>' out/convert/kilometers-to-miles/index.html` → `noindex, follow`; none on `knots-to-kilometers-per-hour`.
- [ ] Commit `feat(seo): noindex commodity unit conversion pages`.

### Task 2: `ToolAbout` + content for 10 existing pages

**Files:** Create `lib/tool-content.ts`, `components/ToolAbout.tsx`, `test/frame/ToolAbout.test.tsx`. Modify `app/tools/[slug]/page.tsx`, `app/globals.css`.

**Interfaces — Produces:** `export interface ToolContent { intro: string[]; steps: string[]; faq: { q: string; a: string }[] }`, `export const TOOL_CONTENT: Record<string, ToolContent>`, `export default function ToolAbout({ tool }: { tool: Tool })` (server component; returns `null` with no entry).

- [ ] **RED:** tests: renders `About Keyword Density Analyzer`, a `How to use` ordered list with N items, FAQ `<details>` count = faq length, first open; emits `<script type="application/ld+json">` whose parsed JSON is `@type: FAQPage` with matching `mainEntity` length; returns nothing for a slug without content (`base64`). Every `TOOL_CONTENT` key is a real tool slug; every entry has ≥ 1 intro paragraph, 3–6 steps, 3–6 FAQs, total words 300–700; no entry text matches `/never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?/i`.
- [ ] **GREEN:** component:

```tsx
import JsonLd from '@/components/JsonLd'
import { TOOL_CONTENT } from '@/lib/tool-content'
import type { Tool } from '@/lib/tools'

// Server-rendered about / how-to / FAQ under a tool — indexable text, no client JS.
export default function ToolAbout({ tool }: { tool: Tool }) {
  const c = TOOL_CONTENT[tool.slug]
  if (!c) return null
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <section className="tool-about">
      <JsonLd data={faqSchema} />
      <h2>About {tool.name}</h2>
      {c.intro.map((p, i) => <p key={i}>{p}</p>)}
      <h2>How to use</h2>
      <ol>{c.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <h2>FAQ</h2>
      {c.faq.map((f, i) => (
        <details className="faq" key={i} open={i === 0}>
          <summary>{f.q}<span className="plus">+</span></summary>
          <div className="ans">{f.a}</div>
        </details>
      ))}
    </section>
  )
}
```

  Mount `<ToolAbout tool={tool} />` in the live branch after `.tool-foot-note`. CSS: `.tool-about { margin-top: 40px; max-width: 760px } .tool-about h2 { font-size: 20px; font-weight: 700; margin: 28px 0 10px } .tool-about p, .tool-about li { color: var(--mute); font-size: 16px; line-height: 1.7 } .tool-about ol { padding-left: 1.3em }`.
  Write content (300–600 words each) for: keyword-density, sql-to-csv, cidr-calculator, morse-code, meta-tag-generator, hash-generator, date-calculator, date-difference, json-pivot, random-number-generator. Read each tool component first so steps and FAQs describe what it actually does.
- [ ] Verify tests, build; JSON-LD present in `out/tools/keyword-density/index.html`; title/description/canonical unchanged vs baseline.
- [ ] Commit `feat(seo): server-rendered about/how-to/FAQ for 10 tool pages`.

### Task 3: Privacy hardening

**Files:** Modify `components/SiteHeader.tsx`, `components/HomeClient.tsx`, `components/Analytics.tsx`, `public/_headers`, `playwright.config.ts`, `package.json` (`e2e` script), `test/frame/SiteHeader.test.tsx`, `test/frame/HomeClient.test.tsx`. Create `test/privacy/static-guard.test.ts`, `test/e2e/privacy.spec.ts`, `test/e2e/csp.spec.ts`, `test/e2e/headers.ts`.

**Interfaces — Produces:** `readInitialFilters(search: string, hash?: string)`; e2e static server on `http://localhost:4173` serving `out/` with `public/_headers` applied by route interception (`test/e2e/headers.ts` exports `applySiteHeaders(page)`).

- [ ] **RED (unit):**
  - SiteHeader: replace the "plain GET form" test with: uncontrolled mode submit → `window.location.assign` called with `/#q=merge%20pdf` and default prevented (spy `assign` via `vi.spyOn(window.location, 'assign')` or inject `navigate` prop default). Form has no `action`/`method` and input has no `name` (so a no-JS submit cannot leak).
  - HomeClient: `readInitialFilters('', '#q=merge%20pdf')` → query `merge pdf`; legacy `?q=x` still read; after mount with `?q=x`, `history.replaceState` called to remove the query.
  - static guard: scans `components/**`, `lib/**`, `app/**` (`.ts/.tsx`) and fails on `/\bfetch\(|XMLHttpRequest|new WebSocket|sendBeacon|EventSource|indexedDB|document\.cookie|history\.pushState/`, on `/localStorage|sessionStorage/` outside `components/ConsentBanner.tsx`, `components/Analytics.tsx`, and on `/console\.(log|info|debug|warn|error)/` outside template-literal sample content in `components/tools/FileGenerators.tsx`. Write it so the current tree passes after Task 3 changes (expect RED first only for the new SiteHeader/HomeClient behaviour).
- [ ] **GREEN (unit):** SiteHeader uncontrolled `onSubmit`: `e.preventDefault(); const q = inputRef.current?.value.trim(); window.location.assign(q ? '/#q=' + encodeURIComponent(q) : '/')`; remove `action`, `method`, `name`. HomeClient: `readInitialFilters(location.search, location.hash)`; prefer `#q=`; if `?q=` present, `history.replaceState(null, '', location.pathname + (cat ? '?cat=' + encodeURIComponent(cat) : '') + location.hash)` — keep `?cat=` (non-sensitive, category names only). Also listen to `hashchange` to re-seed (homepage → homepage search from header uses controlled mode anyway).
- [ ] **Analytics:** replace config with `gtag('config', ID, { anonymize_ip: true, send_page_view: false })` and a client effect that sends `gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_path: location.pathname, page_title: document.title, page_referrer: document.referrer ? new URL(document.referrer).origin : '' })` on mount and on every pathname change (`usePathname`). Analytics becomes a component with `useEffect`; keep consent-default script unchanged.
- [ ] **CSP:** append to `public/_headers` under `/*`:

```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; img-src 'self' data: blob: https://*.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' blob: about:; worker-src 'self' blob:; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'
```

- [ ] **e2e infra:** `package.json` `"e2e": "next build && playwright test"`. `playwright.config.ts` `webServer` becomes an array: existing dev server (3000) + `{ command: 'npx serve out -l 4173', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI }`. `test/e2e/headers.ts` parses `public/_headers` `/*` block and `applySiteHeaders(page)` uses `page.route('http://localhost:4173/**', async r => { const res = await r.fetch(); await r.fulfill({ response: res, headers: { ...res.headers(), ...SITE_HEADERS } }) })`.
- [ ] **RED/GREEN (e2e) `csp.spec.ts`** (baseURL 4173, headers applied): collect `securitypolicyviolation` events via `page.addInitScript`; visit `/`, `/tools/json-formatter/`, `/convert/png-to-jpg/`, `/tools/markdown-to-pdf/` (type text, trigger its preview) → zero violations; `page.evaluate(() => fetch('https://example.com').then(() => 'sent', () => 'blocked'))` → `blocked`.
- [ ] **e2e `privacy.spec.ts`** (baseURL 4173, headers applied): helper `canaryRun(page, path, act)` records every request (URL, headers, `postData`), console messages; after `act(canary)` asserts: request hosts ⊆ {localhost, *.google-analytics.com, *.analytics.google.com, www.googletagmanager.com}; no URL/header/body contains canary; `localStorage`/`sessionStorage` dump, `location.href`, `document.title` don't contain canary; no console text contains it. Cases now: header search from `/tools/json-formatter/` (type canary, Enter → lands on `/#q=…`, assert no *request* carries canary — the fragment is local); `hash-generator` (type canary); `encryption` (encrypt canary with password); `jwt-tool` (paste a JWT whose payload contains canary); `markdown-to-pdf` (type canary); `image-compressor` (upload `test/e2e/png.ts` PNG, compress, download); `merge-pdf` (two generated PDFs whose text includes canary — build with `pdf-lib` in the test). Phase 1 tasks add their own cases.
- [ ] Verify `npm run verify && npm run e2e` green.
- [ ] Commit `feat(privacy): hash-based search, sanitised analytics, CSP, privacy tests`.

### Task 4: Hedged privacy copy

**Files:** `app/layout.tsx` (description, OG, Twitter), `app/page.tsx` (WebSite JSON-LD description), `app/convert/[slug]/page.tsx` (image lede), `components/ConsentBanner.tsx`, `app/privacy/page.tsx` (describe CSP + path-only analytics), tool hint strings found by `grep -rniE "never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?|no telemetry" components lib app`.

- [ ] **RED:** add to static guard: same regex over `app/`, `components/`, `lib/` string content must have zero hits (allow the privacy page's explicit explanatory sentence only if phrased hedged — simplest: zero hits anywhere).
- [ ] **GREEN:** rewrite each hit in house style, e.g. "No uploads, no accounts, no telemetry" → "Designed to run in your browser — no sign-up"; "nothing is uploaded" → "processed on your device"; consent: "Your tool data is designed to stay on your device — tools run in your browser."; tool hints "Merged on your device · nothing is uploaded" → "Merged on your device". Keep titles unchanged.
- [ ] Verify; head-tag diff vs baseline differs **only** in description/OG/Twitter description + JSON-LD description strings.
- [ ] Commit `fix(copy): hedge absolute privacy claims`.

### Task 5: Phase 0 gate + push

- [ ] `npm run verify && npm run e2e`; sitemap 149; sweep (`node .superpowers/shots.mjs`) over home + 10 content pages clean.
- [ ] Update `CLAUDE.md`: privacy rules + CSP + tests, `ToolAbout`/`TOOL_CONTENT` convention, `/convert` indexing rule, e2e now builds. Commit `docs: CLAUDE.md privacy enforcement + tool content`.
- [ ] `git push origin main`; watch CI (`gh run watch`); confirm live: `curl -sI https://dauntexlabs.com/ | grep -i content-security-policy` present; homepage loads.

---

## Phase 1 — new tools (pushes 2 and 3)

**Per-tool contract** (applies to Tasks 6–12): new files only — `lib/<topic>.ts`, `components/tools/<Name>.tsx`, `test/lib/<topic>.test.ts`, `test/tools/<Name>.test.tsx`, and content in `lib/tool-content/<slug>.ts` exporting `default: ToolContent` (**Ruling:** per-slug content files instead of one big `lib/tool-content.ts` so parallel work never conflicts; `lib/tool-content.ts` imports and merges them — cost if wrong: one extra import line per tool). Logic returns `{ ok: true, … } | { ok: false, error: string }`, never throws to UI. Components compose the kit, sentence case, hedged copy, revoke object URLs, no storage/console/network. Each task appends canary cases to `test/e2e/privacy.spec.ts` in Task 13 (central).

### Task 5b: Shared infra

- [ ] `lib/tools.ts`: append `'Aviation'`, `'India'` to `Category` union + `CATEGORY_ORDER`. `app/tools/[slug]/page.tsx` `SCHEMA_CATEGORY`: both → `'UtilitiesApplication'`.
- [ ] `lib/tool-content.ts`: support merging `lib/tool-content/*.ts` (explicit imports list).
- [ ] Extract cron parsing from `components/tools/CronExplainer.tsx` into `lib/cron.ts` (`FIELDS`, `parseField`, `parseCron`, `ParsedCron`, `describe`, `nextRuns` exported); component imports them; existing `CronExplainer` tests green.
- [ ] Commit `refactor: shared cron parser; Aviation + India categories`.

### Task 6: Aviation (4 tools) — `lib/aviation.ts`

**Interfaces:** `densityAltitude({ pressureAltFt, oatC, dewpointC? }) → { ok, densityAltFt, isaTempC, isaDevC }`; `windCorrection({ tasKt, courseDeg, windFromDeg, windKt }) → { ok, wcaDeg, headingDeg, groundSpeedKt }`; `trueAirspeed({ casKt, pressureAltFt, oatC }) → { ok, tasKt, mach }`; `crosswind({ runwayDeg, windFromDeg, windKt }) → { ok, headwindKt (negative = tailwind), crosswindKt, side: 'left'|'right'|'none' }`.
**Vectors (tests):** DA at PA 5000 ft, OAT 30 °C ≈ 8,000–8,400 ft (rule-of-thumb DA = PA + 120×(OAT−ISA) → 5000 + 120×(30−5.1) ≈ 7,988 ft; precise formula within ±250 ft); ISA at 5000 ft = 5.1 °C. WCA: TAS 120, course 090, wind 360/20 → WCA ≈ −9.6° (heading ≈ 080), GS ≈ 118 kt. TAS: CAS 150 kt, PA 8000 ft, OAT 0 °C → TAS ≈ 170 kt (±2). Crosswind: runway 27 (270°), wind 300/20 → headwind 17.3, crosswind 10.0 right. Edge: wind ≥ TAS with crosswind component ≥ TAS → `{ ok:false }`; windKt 0 → WCA 0, GS = TAS; negative altitude allowed (Dead Sea), finite.
**Components:** `DensityAltitudeCalculator`, `WindCorrectionAngle`, `TrueAirspeedCalculator`, `CrosswindComponent` (numeric `TextInput`s, results in `Panel`, units in labels, a one-line "for training/planning only, not a substitute for your POH/E6B" notice).
**Slugs/names:** `density-altitude-calculator` "Density Altitude Calculator"; `wind-correction-angle` "Wind Correction Angle Calculator"; `true-airspeed-calculator` "True Airspeed (TAS) Calculator"; `crosswind-component` "Crosswind Component Calculator".

### Task 7: `cron-to-systemd-timer` — uses `lib/cron.ts`, new `lib/systemd.ts`

**Interfaces:** `cronToSystemd(expr: string, opts: { name: string; command: string; persistent: boolean }) → { ok, onCalendar: string, timer: string, service: string } | { ok:false, error }`.
**Vectors:** `*/15 * * * *` → `*-*-* *:00/15:00`; `0 9 * * 1-5` → `Mon..Fri *-*-* 09:00:00`; `30 4 1 * *` → `*-*-01 04:30:00`; `0 0 * * 0` → `Sun *-*-* 00:00:00`; `5 0 * 8 *` → `*-08-* 00:05:00`; `@daily` → `daily`; `@hourly` → `hourly`; `0 0 1,15 * *` → `*-*-01,15 00:00:00`; `0 22 * * 1-5` ; `0 */2 * * *` → `*-*-* 00/2:00:00`; invalid `61 * * * *` → error. Both `dom` and `dow` restricted → produce two `OnCalendar=` lines (cron OR semantics) and say so. Timer file includes `[Timer] OnCalendar=… Persistent=true|false Unit=<name>.service` and `[Install] WantedBy=timers.target`.

### Task 8: `vcf-to-csv` (`lib/vcard.ts`) + `ics-viewer` (`lib/ics.ts`)

**Interfaces:** `parseVcards(text) → { ok, contacts: Contact[], skipped: number }` (`Contact = { fn, n:{family,given}, emails[], phones[{type,value}], org, title, adr[], note, bday, url }`); `contactsToCsv(contacts, preset: 'generic'|'google'|'outlook') → string`. `parseIcs(text) → { ok, events: IcsEvent[], skipped }` (`IcsEvent = { summary, start: Date|null, end, allDay, location, description, rrule?: string, tzid?: string }`); `eventsToCsv(events, timeZone) → string`; `describeRrule(rrule) → string` (e.g. `FREQ=WEEKLY;BYDAY=MO,WE` → "Weekly on Monday, Wednesday").
**Vectors:** vCard 2.1 with `ENCODING=QUOTED-PRINTABLE;CHARSET=UTF-8` name `=C3=A9` → "é"; folded lines (CRLF + space); BOM; 3.0 multiple `TEL;TYPE=CELL`; 4.0 `TEL;VALUE=uri:tel:+1…`; file with one broken card → skipped 1. ICS: `DTSTART;VALUE=DATE:20261007` all-day; `DTSTART;TZID=Asia/Kolkata:20261007T090000` → correct UTC instant; `DTSTART:20261007T033000Z`; folded `DESCRIPTION`; escaped `\,` `\n`. CSV fields with commas/quotes/newlines quoted per RFC 4180.

### Task 9: `gpx-converter` (`lib/geo.ts`)

**Interfaces:** `parseGeo(text, kind: 'gpx'|'kml'|'geojson'|'auto') → { ok, tracks: { name, points: { lat, lon, ele?, time? }[] }[], waypoints: … }`; `toGeoJSON / toGPX / toKML / toCSV(data)`; `stats(track) → { distanceKm, elevationGainM, elevationLossM, durationS?, bounds }` (haversine, R = 6371.0088 km).
**Vectors:** two points (0,0)→(0,1) = 111.19 km ±0.1; GPX with `<ele>` 100→150→120 → gain 50, loss 30; KML `<coordinates>lon,lat[,alt]</coordinates>` without alt; GeoJSON LineString/MultiLineString; round trip GPX→GeoJSON→GPX preserves points; malformed XML → `{ ok:false }`.

### Task 10: Legacy Hindi fonts (`lib/legacy-fonts.ts`) + `LegacyFontConverter` + 4 wrappers

**Interfaces:** `type LegacyFont = 'krutidev' | 'chanakya' | 'devlys' | 'shivaji'`; `toUnicode(text, font) → string`; `fromUnicode(text, font) → string`; `looksLikeUnicodeDevanagari(text) → boolean`. Component `LegacyFontConverter({ font })`: two `TextArea`s, direction `Segmented` ("Legacy → Unicode" / "Unicode → Legacy"), copy + download `.txt`, notice when input direction looks wrong.
**Tables:** Kruti Dev 010 mapping (ordered multi-char-first array of `[legacy, unicode]`, plus reordering rules: short-i matra `f` moves after the following consonant; reph `Z` moves before the preceding consonant cluster; nukta/halant handling). DevLys 010 shares the Kruti Dev layout (document this). Chanakya and Shivaji get their own tables. Write tables from documented character maps; record sources in a header comment; no copied code.
**Vectors:** Kruti Dev `Hkkjr` ↔ `भारत`; `fgUnh` ↔ `हिन्दी`; `deZ` ↔ `कर्म`; `iz;ksx` ↔ `प्रयोग`; `{k=` ↔ `क्षत्र` (verify), plus a 200-character corpus round trip (`fromUnicode(toUnicode(x)) === x` for legacy corpus). Chanakya/Shivaji: ≥ 10 known word pairs each from public reference pages, cited in the test file.
**Slugs/names:** `krutidev-to-unicode` "Kruti Dev to Unicode Converter"; `chanakya-to-unicode` "Chanakya to Unicode Converter"; `devlys-to-unicode` "DevLys to Unicode Converter"; `shivaji-to-unicode` "Shivaji to Unicode Converter (Marathi)". Category India.

### Task 11: India Canvas tools — `aadhaar-masker`, `photo-date-stamp`

**AadhaarMasker:** `FileDrop` (image only; PDF out of scope — notice) → canvas preview; pointer drag draws rectangles (mouse + touch via Pointer Events); "Undo", "Clear boxes"; "Add 8-digit guide" overlay toggle (visual hint only); export re-encodes via `canvas.toBlob` (PNG default, JPG option) → `downloadBlob`; source image and object URLs released on reset/unmount. Copy states masking is manual and the image is processed on your device. Pure helper `lib/redact.ts`: `normalizeRect(start, end, scale) → { x, y, w, h }` (tested), `applyRedactions(ctx, rects, color)`.
**PhotoDateStamp:** photo + name + date (date input, default today, format DD/MM/YYYY) strip appended below (configurable height %, font size auto-fit); optional signature image joined below; output size presets (width × height px) + JPEG quality; pure helpers `lib/stamp.ts` `fitText(measure, text, maxWidth, maxFont) → fontPx`, `formatDateIN(date) → 'DD/MM/YYYY'` (tested).
Tests follow existing image-tool pattern (flow-only in jsdom; e2e in Task 13 asserts real output bytes are PNG/JPEG).

### Task 12: `amount-in-words-rupees` (`lib/rupees.ts`) + Number scale + JFIF convert pages + `pdf-metadata-remover` + `homoglyph-detector`

- **Rupees:** `rupeesInWords(amount: string, lang: 'en'|'hi', opts: { only: boolean }) → { ok, words }`. Vectors: `0` → "Zero Rupees Only"; `1` → "One Rupee Only"; `99.5` → "Ninety-Nine Rupees and Fifty Paise Only"; `100000` → "One Lakh Rupees Only"; `123456789.05` → "Twelve Crore Thirty-Four Lakh Fifty-Six Thousand Seven Hundred Eighty-Nine Rupees and Five Paise Only"; Hindi `100000` → "एक लाख रुपये मात्र"; more than 2 decimals → error; negative → error; up to 99,99,99,99,99,999.99.
- **Number scale:** `lib/conversions.ts` unit category `{ name: 'Number scale', units: { thousand: 1e3, lakh: 1e5, million: 1e6, crore: 1e7, billion: 1e9 } }` (labels "Thousand", "Lakh", "Million", "Crore", "Billion"); tests: `crore-to-million` 1 → 10; `lakh-to-million` 10 → 1; pages indexed.
- **JFIF:** `IMAGE_FORMATS.jfif = { key: 'jfif', label: 'JFIF', mime: 'image/jpeg', note: 'JPEG File Interchange Format — a JPEG by another name', inputOnly: true }`; `buildPairs` skips pairs whose `to` is input-only; `ImageConverter`/`ConvertImage` accept `.jfif`. Tests: `jfif-to-jpg`, `jfif-to-png`, `jfif-to-webp` exist; `jpg-to-jfif` does not.
- **PdfMetadataRemover:** lazy `pdf-lib`; show Title/Author/Subject/Keywords/Creator/Producer/CreationDate/ModDate; "Remove all" sets each to empty / removes, also drops the XMP `Metadata` entry from the catalog if present; editable fields; save → `downloadBlob`. Test (real pdf-lib in Node, like MergePdf tests): create PDF with author "CANARY", run remove, load result → author undefined, XMP absent. Encrypted PDF → error notice.
- **HomoglyphDetector:** `lib/confusables.ts` (lazy import) `findConfusables(text) → { index, char, codePoint, looksLike, script }[]`, `skeleton(text) → string`, `ZERO_WIDTH` set (U+200B–U+200D, U+2060, U+FEFF, U+00AD, U+180E). Vectors: `pаypal` (Cyrillic а) → 1 hit at index 1 looks like `a`; `Ηello` (Greek Eta) → hit; `a​b` → zero-width hit; plain ASCII → none. Data: hand-built subset of Unicode confusables (Cyrillic, Greek, fullwidth Latin, common math alphanumerics), Unicode licence attribution comment.

### Task 13: Wiring, content, privacy cases, gates, pushes

- [ ] Registry entries (17) in `lib/tools.ts` with blurbs + keywords from research target queries; `ToolMount` lines (17); `lib/tool-content.ts` imports all 17 `lib/tool-content/<slug>.ts`.
- [ ] `test/e2e/privacy.spec.ts`: canary cases for every new tool (vcf/ics/gpx files containing canary; aadhaar/photo-stamp with generated PNG + canary name; pdf metadata with canary author; rupees/homoglyph/fonts typing canary; aviation typing numbers — assert no non-allowlisted requests).
- [ ] Gates: `npm run verify && npm run e2e`; sitemap count = 149 + 17 + number-scale pairs (20) + 3 jfif = 189 (test computes it); sweep over all new pages at 1280/390 clean; First Load JS ~104 kB; each new tool's chunk listed separately in build output.
- [ ] Push 2: dev/pro tools + aviation + number scale/JFIF (commit set A). Push 3: India tools (commit set B). Before each push: gates green; after: `gh run watch`, live smoke (`curl` new tool URL 200, page shows tool name).
- [ ] Update `CLAUDE.md`: tool count (123 live), 16 categories, new libs, per-tool content convention.
