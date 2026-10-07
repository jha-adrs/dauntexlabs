# Niche expansion + SEO cleanup — design

**Date:** 2026-10-07
**Status:** Draft, awaiting review
**Follows:** `2026-10-07-light-rebrand-design.md` (shipped). Implements growth lever **A** from `2026-07-11-programmatic-conversion-pages-design.md` (deepen tool pages), redirected at niche queries.

## Why

Google Search Console, 3 months to 2026-10-06: 20.8K impressions, 6 clicks, average position 76.

| Section | Pages | Impressions | Clicks | Avg position |
|---|---|---|---|---|
| `/convert/` plain units | 220 | 16,791 | 1 | 78.5 |
| `/convert/` nautical / knots | 22 | 1,430 | 0 | 61.1 |
| `/convert/` number bases | 12 | 91 | 0 | 77.6 |
| `/tools/` | 82 | 2,523 | 5 | 68.7 |

Head terms ("km to miles", "json formatter", "pdf to word") are owned by Google's own widgets and large sites. The site already does best on **niche** queries: knots and nautical miles, "javascript pivot json data" (json-pivot got one of the six clicks), "query params to json", "keyword density analyzer" (position ~50).

**Strategy (owner's call):** go after niche, often paywalled or upload-only tools that few people need, run them entirely in the browser, and stop spending crawl and quality signal on commodity unit pages.

Candidate research (2026-10-07, no paid keyword data) used two research passes plus the owner's Google Trends India export. "Rankable" is a judgement of how weak today's page-1 results are, not search volume.

## Decisions already made (brainstorm, 2026-10-07)

| Question | Decision |
|---|---|
| Plain unit `/convert` pages | **B:** `noindex` + drop from sitemap. Nautical/knots, number-base, image and new number-scale pages stay indexed. Pages keep working. |
| Niche data source | No paid data. Web research + Trends export + GSC. |
| Audience | **Both:** India-specific niches and global dev/pro niches. |
| Batch | **All 13 candidates**, about 17 new pages. |
| Content storage | Typed content file rendered on the server (`lib/tool-content.ts`). |
| Privacy | **Nothing the user types or loads may reach any server, log or third party.** Section 4 makes this enforceable. |

## Scope

**In scope**

- Phase 0: `/convert` pruning, the server-rendered about/how-to/FAQ block, content for 10 existing tool pages, privacy-copy hedging, privacy hardening (Section 4).
- Phase 1: 13 new tools / page groups (Section 3), each shipping with its content block.

**Out of scope**

- HEIC → JPG (decoder ≥ 1.3 MB, crowded results), exam photo KB-resizer (saturated), GST/salary/tax calculators (owned by fintechs), curl → code, x509 decoder, protobuf, Parquet, EXIF remover (crowded).
- OCR of any kind (Aadhaar masker is manual redaction).
- Map tiles or any network-backed preview for geo files.
- Category hub pages, backlinks/outreach, Semrush.
- Changing GA4 itself beyond the hardening in Section 4.

## 1. Phase 0a — `/convert` pruning

**Where:** `lib/conversions.ts` (rule), `app/convert/[slug]/page.tsx` (`generateMetadata`), `app/sitemap.ts` (filter). All **reused** files.

- New exported predicate `isIndexedPair(p: Pair): boolean` in `lib/conversions.ts`:
  - `p.family !== 'unit'` → indexed (number base, image).
  - `p.category === 'Number scale'` → indexed (new, Section 3).
  - `p.fromKey` or `p.toKey` is `Length:nmi` or `Speed:knot` → indexed.
  - Everything else → **not** indexed.
- `generateMetadata` for a pair that is not indexed adds `robots: { index: false, follow: true }`. Title, description, canonical, OG unchanged.
- `app/sitemap.ts` emits only indexed pairs.
- The convert hub (`/convert/`) still links to every pair (people use them); links are `follow`.
- Expected sitemap count: 369 − 220 = 149, plus new tool pages and new convert pages from Phase 1 (≈ 149 + 17 tools + ~20 number-scale + 3 jfif ≈ 189). Tests assert the exact figure computed from the registries, not a hardcoded number.
- Reversible: flipping `isIndexedPair` back restores everything.

## 2. Phase 0b — about / how-to / FAQ block

**Where:**

| Piece | File | New / reused |
|---|---|---|
| Content data | `lib/tool-content.ts` — `export const TOOL_CONTENT: Record<string, ToolContent>` | **new** |
| Renderer | `components/ToolAbout.tsx` — server component, no `'use client'` | **new** — considered reusing the FAQ markup inline in `app/convert/[slug]/page.tsx`; extracting it into a component is the reuse |
| Mount point | `app/tools/[slug]/page.tsx` — rendered after the tool panel and foot note, before "Popular conversions" | reused |
| Styles | `app/globals.css` — `.tool-about` section; FAQ reuses existing `details.faq` styles | reused |

```ts
export interface ToolContent {
  /** 1–3 short paragraphs: what it is, who needs it, why on-device matters for it. */
  intro: string[]
  /** "How to use" — 3–6 imperative steps. */
  steps: string[]
  /** 3–6 Q&As. Plain text; rendered and emitted as FAQPage JSON-LD. */
  faq: { q: string; a: string }[]
}
```

- `ToolAbout` renders `<section className="tool-about">` with `<h2>About {tool.name}</h2>`, intro paragraphs, `<h2>How to use</h2>` ordered list, `<h2>FAQ</h2>` with `<details className="faq">` (first one open). It also emits a FAQPage JSON-LD via the existing `JsonLd` component.
- Tool with no entry → renders nothing, emits nothing (no empty headings).
- Content is static HTML in the page, so Google indexes it. No client JS added.
- **Content rules:** 300–600 words per tool; written for a normal person; target the tool's real long-tail queries in natural language; privacy statements hedged ("designed to run in your browser"); no claims we cannot verify; no keyword stuffing.
- **First 10 existing pages** (by GSC impressions): `keyword-density`, `sql-to-csv`, `cidr-calculator`, `morse-code`, `meta-tag-generator`, `hash-generator`, `date-calculator`, `date-difference`, `json-pivot`, `random-number-generator`.
- SEO check changes: tool-page `<title>`/description/canonical stay byte-identical; a FAQPage JSON-LD block is **added** on pages with content (expected diff).

## 3. Phase 1 — new tools

Every new tool:

- Registry entry in `lib/tools.ts` (`slug`, `name`, `category`, `blurb`, `keywords`).
- `components/tools/<Name>.tsx` (`'use client'`, composes the kit) + `ToolMount` line.
- Pure logic in `lib/<topic>.ts` with unit tests (the component stays thin).
- A `TOOL_CONTENT` entry from day one.
- Passes the privacy audit (Section 4).

### Categories

`lib/tools.ts` `CATEGORY_ORDER` gains **`Aviation`** and **`India`** (appended at the end; 16 categories). `SCHEMA_CATEGORY` in `app/tools/[slug]/page.tsx` maps both (`Aviation` → `UtilitiesApplication`, `India` → `UtilitiesApplication`). The homepage sidebar and grouped grid pick them up automatically.

### Tools

| Slug(s) | Category | Logic file | What it does | Notes |
|---|---|---|---|---|
| `density-altitude-calculator` | Aviation | `lib/aviation.ts` (new) | Pressure altitude + OAT (+ optional dew point) → density altitude, ISA deviation | ISA standard-atmosphere formula |
| `wind-correction-angle` | Aviation | `lib/aviation.ts` | TAS, course, wind dir/speed → WCA, heading, ground speed | Wind triangle |
| `true-airspeed-calculator` | Aviation | `lib/aviation.ts` | IAS/CAS, pressure altitude, OAT → TAS (+ Mach) | Compressible-flow formula, CAS≈IAS stated |
| `crosswind-component` | Aviation | `lib/aviation.ts` | Runway heading, wind → headwind/tailwind + crosswind (L/R) | |
| `cron-to-systemd-timer` | Utilities | `lib/cron.ts` (new, **extracted** from `CronExplainer.tsx`) | Cron line (+ command) → `OnCalendar=` + `.timer` + `.service` files, download both | `CronExplainer` switches to the extracted parser; its tests must stay green |
| `vcf-to-csv` | Data Tools | `lib/vcard.ts` (new) | `.vcf` (vCard 2.1/3.0/4.0, multi-contact, folded lines, QUOTED-PRINTABLE) → CSV; presets: generic, Google Contacts, Outlook | |
| `ics-viewer` | Data Tools | `lib/ics.ts` (new) | `.ics` → table (summary, start, end, location, recurrence text) in the viewer's time zone; export CSV | Folded lines, `TZID`, all-day events; RRULE shown as text, not expanded |
| `gpx-converter` | Data Tools | `lib/geo.ts` (new) | GPX/KML/GeoJSON in → GeoJSON/GPX/KML/CSV out + stats (distance, elevation gain/loss, duration, bounds) | `DOMParser`; haversine; no map |
| `pdf-metadata-remover` | PDF Tools | inline, lazy `pdf-lib` | Show Title/Author/Subject/Keywords/Creator/Producer/dates; clear all or edit; save new PDF | `pdf-lib` already a lazy dep; note XMP stream removal limits in FAQ |
| `homoglyph-detector` | Text Tools | `lib/confusables.ts` (new, lazy-imported) | Highlight characters that look like ASCII but are not (Cyrillic а, Greek ο, …), invisible/zero-width chars; "skeleton" ASCII version | Hand-built subset of Unicode `confusables.txt` (~2,000 entries) + zero-width set; Unicode data is under the Unicode licence — attribute in a code comment and the FAQ |
| `aadhaar-masker` | India | inline Canvas | Load photo/scan of Aadhaar → user drags box(es) → solid fill → download PNG/JPG; optional "mask first 8 digits" guide overlay | Manual redaction, said plainly. **No OCR, no auto-detect, no network.** Strips EXIF by virtue of Canvas re-encode |
| `photo-date-stamp` | India | inline Canvas | Photo + name + date strip (exam style); photo + signature joiner; output JPG at chosen size | Re-encode via Canvas |
| `amount-in-words-rupees` | India | `lib/rupees.ts` (new) | Amount → Indian words with lakh/crore grouping, paise, "Only" suffix; English + Hindi | Shares grouping logic idea with `number-to-words`, separate file (Indian scale differs) |
| `krutidev-to-unicode`, `chanakya-to-unicode`, `devlys-to-unicode`, `shivaji-to-unicode` | India | `lib/legacy-fonts.ts` (new) + `components/tools/LegacyFontConverter.tsx` (shared) | Both directions; live preview in Unicode; copy/download `.txt` | Each slug's component is a 3-line wrapper passing `font`. Mapping tables written from documented character maps, not copied code of unknown licence |

### New `/convert` pages (reuse `lib/conversions.ts`)

- **Number scale** — new unit category `Number scale` with units `thousand` (1e3), `lakh` (1e5), `million` (1e6), `crore` (1e7), `billion` (1e9). Pairs auto-generate (~20). Indexed via `isIndexedPair`. Formula/table/FAQ come from the existing generic unit page.
- **JFIF → JPG/PNG/WebP** — `IMAGE_FORMATS` gains `jfif` with an `inputOnly` flag; `buildPairs` skips pairs whose **to** format is input-only. 3 new pages. `ImageConverter` accepts `.jfif` (JFIF is JPEG; Canvas decodes natively).

## 4. Privacy guarantees (owner requirement: nothing private reaches a server, log or third party)

"Private" = anything a user types, pastes, uploads or produces in a tool, and the tool's outputs.

### Current exposure found (2026-10-07 audit)

- **GA4 receives the full page URL.** `gtag('config', …)` sends `page_location` including the query string. The rebrand's header search on non-home pages submits `GET /?q=<search>`, so search terms reach Google Analytics **and** Cloudflare request logs.
- No tool logs input to the console, writes it to storage, or puts it in the URL (grep audit: only consent flags in `localStorage`; no `fetch`/XHR/WebSocket/`sendBeacon` anywhere in `components`, `lib`, `app`).
- No Content-Security-Policy, so nothing *enforces* the no-network rule if a future change or a bundled library tried to send data.

### Rules (binding for all existing and new code)

1. **No network for tool logic.** No `fetch`, XHR, WebSocket, `sendBeacon`, `EventSource`, remote `<img>`/`<script>`/`<link>`/`<iframe>` src built from user data, and no new third-party origins.
2. **User data never goes into the URL** (path, query or hash), `document.title`, or anything GA can read.
3. **No persistence of user data.** No `localStorage`/`sessionStorage`/IndexedDB/cookies for tool input or output. (Consent flags stay.)
4. **No logging.** No `console.*` with user data in shipped code.
5. **Object URLs revoked** after download/preview teardown.
6. **Image outputs re-encoded via Canvas** (drops EXIF/GPS) where the tool outputs an image.

### Hardening (this spec)

| Change | Where | Effect |
|---|---|---|
| Header search no longer puts the query in the URL. Non-home pages navigate to `/#q=<encoded>`; `HomeClient` reads `location.hash` (and still accepts legacy `?q=` once, then clears it with `history.replaceState`). The no-JS fallback form is removed — the header search requires JS, like the tools themselves. | `components/SiteHeader.tsx`, `components/HomeClient.tsx` | URL fragments are never sent in HTTP requests (no Cloudflare log), and GA4 `page_location` is set explicitly below |
| GA4 gets a sanitised URL: `gtag('config', ID, { page_location: location.origin + location.pathname, page_referrer: <origin-only>, anonymize_ip: true })`, and a Next route-change listener re-sends `page_view` with the same sanitised `page_location` while `send_page_view` / enhanced-measurement history events are disabled (`send_page_view: false` + manual `page_view`). | `components/Analytics.tsx` | GA never sees query strings or fragments |
| **Content-Security-Policy** header: `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; img-src 'self' data: blob: https://*.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'` | `public/_headers` | The browser itself blocks any request to any other host. Even a buggy tool or compromised library cannot send data elsewhere. The only allowed third party is GA, which by the rules above never receives user data |
| Privacy policy + consent banner wording hedged and updated to describe the above | `app/privacy/page.tsx`, `components/ConsentBanner.tsx` | Accurate disclosure |

`'unsafe-inline'` for scripts is needed for Next's static-export inline bootstrap; tightening to hashes is out of scope.

### Enforcement (tests)

- **Static guard test** (`test/privacy/static-guard.test.ts`, Vitest): scans `components/`, `lib/`, `app/` source for `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `localStorage`/`sessionStorage`/`indexedDB`/`document.cookie` (allowlist: `ConsentBanner.tsx`, `Analytics.tsx`), `console.` (allowlist: string literals inside `FileGenerators.tsx` sample files), `history.pushState`/`location.search =`. Fails the build gate on any new hit.
- **Canary network test** (`test/e2e/privacy.spec.ts`, Playwright, real Chromium): for every *new* tool plus the existing file/text tools most likely to hold private data (image compressor/converter/resizer, merge/split PDF, encryption, PGP, JWT, hash, file viewer, markdown-to-pdf), load a fixture or type a unique canary string (`CANARY-<random>`), run the tool's main action, and assert:
  - every request went to `localhost` or a GA origin;
  - no request URL, header or post body contains the canary;
  - `localStorage`/`sessionStorage` contain no canary;
  - `location.href` and `document.title` contain no canary;
  - no console message contains the canary.
- **CSP test** (Playwright): page served with the `_headers` CSP (via a small static server that applies `public/_headers`) loads with zero CSP violations on homepage, one tool page and one convert page; an injected `fetch('https://example.com')` from the page is blocked.

## 5. Privacy copy hedging

Replace absolute claims with the hedged house style ("designed to run in your browser", "your files are processed on your device"). Known locations:

- `app/layout.tsx` — site meta description and OG/Twitter descriptions ("No uploads, no accounts, no telemetry" → "Designed to run in your browser — no sign-up."). **Deliberate metadata change** on every page that inherits it.
- `app/page.tsx` — WebSite JSON-LD description.
- `app/convert/[slug]/page.tsx` — image lede "nothing is uploaded".
- `components/ConsentBanner.tsx` — "what you type into a tool is never uploaded".
- Tool hints/labels (`grep -rniE "never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?" components lib app`), ~8 files. Changing a visible hint string inside a tool file is allowed (copy only, no logic).

## 6. Data flow

- **Tool page:** static HTML (header, crumbs, h1, blurb, panel, `ToolAbout` content + FAQ JSON-LD, related) → browser loads the tool chunk (`ssr:false`) → all processing in memory in the tab → output via `downloadBlob` / clipboard. Nothing leaves the tab.
- **Search from a tool page:** submit → `location.assign('/#q=…')` → homepage `HomeClient` reads the hash → filters. No server sees the term.
- **Analytics (only after consent):** page path only.

## 7. Error handling / edge cases

- Parsers (`vcard`, `ics`, `geo`, legacy fonts) never throw to the UI: they return `{ ok: false, error }` with a human message shown in a `Notice`; partial results (e.g. 3 of 4 contacts parsed) are shown with a count of skipped items.
- Large files: tools process in memory; show a warning above 50 MB (GPX/ICS/VCF) instead of freezing silently.
- `pdf-metadata-remover` on an encrypted PDF → clear error, no crash.
- Legacy-font conversion of text that is already Unicode (or mixed) → detected and explained.
- Aviation inputs out of physical range (negative TAS, |wind| > TAS for WCA) → inline error, no NaN output.
- `#q=` with non-matching or malformed encoding → treated as plain text; empty state shows "Clear search".

## 8. Testing

- Unit tests per new `lib/*.ts` with known vectors: aviation (published worked examples, e.g. FAA/E6B textbook values, stated in the test), cron→systemd (≥ 15 cron forms incl. `@daily`, lists, ranges, steps), vCard (2.1 QP, 3.0, 4.0, folded lines, multiple contacts), ICS (all-day, TZID, folded, RRULE text), geo (round trips GPX↔GeoJSON↔KML; distance on a known track), rupees (0, 1, 99.5, 1,00,000, 12,34,56,789.05 in English + Hindi), legacy fonts (round trip on a fixed corpus + known Kruti Dev ↔ Unicode pairs), confusables (Cyrillic/Greek samples, zero-width).
- Component tests in the existing `test/tools/` style for each new tool (render → input → assert output/download).
- `ToolAbout` tests: renders sections + FAQ for a tool with content; renders nothing without; JSON-LD shape.
- `isIndexedPair` tests + sitemap count computed from registries + `noindex` meta present on `kilometers-to-miles`, absent on `knots-to-kilometers-per-hour` and `crore-to-million`.
- Privacy: static guard, canary e2e, CSP e2e (Section 4).
- `npm run verify` + `npm run e2e` green; shared First Load JS stays ~104 KB; visual sweep at 1280/390 over all new pages clean.

## 9. Files

| File | Change | New / reused |
|---|---|---|
| `lib/conversions.ts` | `isIndexedPair`, `Number scale` category, `jfif` input-only format | reused |
| `app/sitemap.ts` | filter by `isIndexedPair` | reused |
| `app/convert/[slug]/page.tsx` | `robots` noindex for non-indexed pairs; hedged image lede | reused |
| `lib/tool-content.ts` | content for 10 existing + 17 new tool slugs | **new** |
| `components/ToolAbout.tsx` | server-rendered about/how-to/FAQ + FAQPage JSON-LD | **new** |
| `app/tools/[slug]/page.tsx` | mount `ToolAbout`; `SCHEMA_CATEGORY` for Aviation/India | reused |
| `lib/tools.ts` | 2 categories, 17 tool entries | reused |
| `components/ToolMount.tsx` | 17 lines | reused |
| `lib/aviation.ts`, `lib/cron.ts`, `lib/vcard.ts`, `lib/ics.ts`, `lib/geo.ts`, `lib/confusables.ts`, `lib/rupees.ts`, `lib/legacy-fonts.ts` | pure logic | **new** (`lib/cron.ts` extracted from `CronExplainer.tsx`) |
| `components/tools/*.tsx` | 13 tool components + shared `LegacyFontConverter` + 4 thin font wrappers | **new** |
| `components/tools/CronExplainer.tsx` | import parser from `lib/cron.ts` | reused |
| `components/tools/ImageConverter.tsx` | accept `.jfif` | reused |
| `components/SiteHeader.tsx`, `components/HomeClient.tsx`, `test/frame/*` | search via `#q=` (the SiteHeader "plain GET form" test is replaced by a hash-navigation test) | reused |
| `components/Analytics.tsx` | sanitised `page_location`, manual page views | reused |
| `public/_headers` | CSP | reused |
| `app/layout.tsx`, `app/page.tsx`, `app/privacy/page.tsx`, `components/ConsentBanner.tsx`, ~8 tool hint strings | hedged copy | reused |
| `app/globals.css` | `.tool-about` styles; styles for new tools only if the kit lacks them | reused |
| `test/privacy/*`, `test/e2e/privacy.spec.ts`, `test/lib/*`, `test/tools/*` | tests | **new** |
| `CLAUDE.md` | tool count, categories, privacy rules + CSP, tool-content convention | reused |

## 10. Rollout

Phase 0 ships first (one push), then Phase 1 in two pushes (dev/pro tools, then India tools) so each can be checked in the sweep. Each push: `npm run verify` + `npm run e2e` (incl. privacy) green. Push to `main` deploys — owner confirms each push. Re-check GSC ~6 weeks after Phase 1: impressions/clicks per new tool, and whether pruned pages left the index.
