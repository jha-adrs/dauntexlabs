# Niche batch 2 + QR designer + category hubs — design

**Date:** 2026-10-08
**Status:** Draft, awaiting review
**Follows:** `2026-10-07-niche-expansion-design.md` (shipped 2026-10-07). Same rules, same pipeline: pure logic in `lib/`, thin kit component, `lib/tool-content/<slug>.ts`, privacy canary, final review.

## Why

Batch 1 started two clusters (Aviation, India) plus personal-file converters. Tools rank better inside a cluster of related pages, so batch 2 deepens those clusters, adds category hub pages that tie them together, and turns the QR generator — a high-demand tool where competitors gate styling, logos and SVG behind sign-up, watermarks or expiring "dynamic" codes — into a full free designer.

## Decisions (brainstorm 2026-10-08)

| Question | Decision |
|---|---|
| Scope | **All** proposed tools + 2 hub pages + QR designer (owner: "YES, all of them"). |
| QR designer | Shapes, eye styles, logo, colours/gradients, frames + CTA text, many content types, PNG/SVG/JPEG export. Free, no sign-up, no watermark, no expiry. |
| Legacy fonts | Walkman-Chanakya, Shree-Lipi and finishing Shivaji are **research-gated**: ship a font only if its map is verified against ≥ 2 independent sources + real text (same bar as Kruti Dev). Unverified fonts stay unbuilt / in maintenance. |

## Scope

**In scope:** 14 new tool pages (+ up to 3 font pages if verified), QR generator rebuild, `upi-qr-code-generator` page, `/category/india/` and `/category/aviation/` hubs.

**Out of scope:** live weather fetching (METAR/TAF are paste-in only), any dynamic/tracked QR (static only — scanning never touches our server), QR decoding/scanning from camera, OCR, Bing/backlink outreach (owner action), hub pages for the other 14 categories.

## 1. QR designer (rebuild of `qr-code-generator`)

**Where:** `components/tools/QrCodeGenerator.tsx` (rewritten), new `lib/qr/` folder:

| File | Responsibility | New / reused |
|---|---|---|
| `lib/qr/payloads.ts` | Content-type → QR string builders: URL, text, Wi-Fi (`WIFI:T:WPA;S:…;P:…;H:false;;` with escaping), vCard 3.0, MeCard, email (`mailto:` with subject/body), SMS (`SMSTO:`), phone (`tel:`), WhatsApp (`https://wa.me/<num>?text=`), geo (`geo:lat,lon`), calendar event (iCalendar `VEVENT`), UPI (`upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…`) | **new** |
| `lib/qr/matrix.ts` | Wrap `qrcode-generator` (existing lazy dep): text + EC level → boolean matrix; identifies finder-pattern (eye) and alignment regions | **new** wrapper of existing lib |
| `lib/qr/render-svg.ts` | Matrix + style → SVG string. Module shapes: square, rounded, dots, classy (rounded on one diagonal), diamond, vertical/horizontal bars (merged runs), fluid (rounded joins between neighbours). Eye frame shapes: square, rounded, circle, leaf; eye ball shapes: square, rounded, circle, diamond. Colours: solid or linear/radial gradient for modules, separate eye colours, background colour or transparent. Logo: user image embedded as `data:` URL centred, with optional cleared quiet area behind it, max 25% of width. Frame: none / box with CTA text below ("Scan me", custom) / rounded badge | **new** |
| `lib/qr/export.ts` | SVG → PNG/JPEG via `Image` + Canvas at chosen pixel size (256–4096); SVG download as-is | **new** |
| `lib/qr/contrast.ts` | Scannability warnings: WCAG contrast between module colour (darkest gradient stop) and background < 4:1 → warn; inverted (light modules on dark) → warn some scanners fail; logo > 20% with EC < H → auto-raise EC to H and say so | **new** |

UI (kit only): content-type `Segmented`/`Select` with per-type fields; "Design" panel with shape pickers rendered as small live previews (buttons with `aria-label`), colour inputs, gradient toggle, logo `FileDrop` (image only, read with `FileReader` into a data URL in memory), frame + CTA text, quiet-zone size, EC level; live SVG preview; export buttons (PNG size presets, SVG, JPEG); "Copy SVG". Presets row: 6 ready-made styles.

Copy: "Free, no sign-up, no watermark. Static QR code — it never expires and scanning it never goes through our servers." (accurate: static codes encode the content directly.)

**Privacy:** Wi-Fi passwords, contact details, UPI IDs and logos stay in memory; no storage; logo object URLs revoked; canary covers Wi-Fi password, UPI ID, vCard name and logo file name.

**Tests:** payload builders (escaping of `;,:\"` in Wi-Fi/MeCard, UPI amount formatting/validation, vCard folding not needed < 75 chars), matrix wrapper (version grows with length; eye regions at 3 corners), SVG renderer (snapshot-free structural tests: correct module count for square style, eyes drawn separately, logo element present when set, gradient defs when gradient on), contrast warnings, component flow tests. e2e: PNG and SVG downloads are valid (PNG magic, SVG parses), and — key correctness check — every preset style **decodes back to the input** in real Chromium using the browser's `BarcodeDetector` when available (skip with a note if unavailable in headless).

### `upi-qr-code-generator` (India)

Separate page (own SEO target "upi qr code generator") rendering the same designer with the UPI content type preselected and UPI fields first (UPI ID validated `^[\w.-]{2,256}@[a-zA-Z]{2,64}$`, payee name, optional amount ≤ 1,00,000 per NPCI P2M guidance shown as a hint, note). Implemented as a thin wrapper: `QrCodeGenerator` gains an optional `initialType` prop (the only tool component allowed a prop, like `LegacyFontConverter`).

## 2. India tools

| Slug | Logic | Notes |
|---|---|---|
| `gstin-validator` | `lib/gstin.ts` | Format `^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`, state code table (01–38 + 97/99), embedded PAN extraction, entity-type from PAN 4th char, mod-36 check digit (GSTN algorithm). Batch mode: paste many lines → table + CSV (via `lib/csv-write.ts`). Vectors: published valid GSTINs from government examples; flipped check digit → invalid. |
| `aadhaar-validator` | `lib/verhoeff.ts` | Verhoeff check digit, 12 digits, first digit not 0/1. Shows "format valid", never "Aadhaar exists" (no lookup — say so). Masks display to last 4 digits by default with a show toggle. Cross-links to `aadhaar-masker`. Vectors: Verhoeff reference vectors (e.g. 236 → check 3). |
| `hindi-typing-keyboard` | `lib/hindi-keyboard.ts` | Type with Remington (Gail) or InScript layout on an English keyboard → Unicode Devanagari in a textarea (keydown mapping, handles pre-base matra reordering for Remington). On-screen layout chart. Copy + download. Practice mode out of scope. |
| `walkman-chanakya-to-unicode`, `shree-lipi-to-unicode`, finish `shivaji-to-unicode` | extend `lib/legacy-fonts.ts` | **Research-gated** (see Decisions). |

## 3. Aviation tools (`lib/aviation.ts` extended, new `lib/metar.ts`)

| Slug | What |
|---|---|
| `metar-decoder` | Paste a METAR/SPECI → plain-English table: station, time, wind (incl. variable, gusts), visibility (SM and metres, CAVOK), RVR, weather (intensity/descriptor/phenomena per WMO 4678), clouds (FEW/SCT/BKN/OVC, CB/TCU, VV), temp/dew point, altimeter (A/Q), RMK passed through raw. Flight category (VFR/MVFR/IFR/LIFR) computed. Unknown groups shown raw, never dropped. |
| `taf-decoder` | Same lib; TAF validity, FM/TEMPO/BECMG/PROB groups as a timeline table. |
| `cloud-base-calculator` | Temp + dew point (°C/°F) → estimated cloud base AGL (spread ÷ 2.5 °C × 1000 ft rule, and the 400 ft/°C form), relative humidity from Magnus formula. |
| `pressure-altitude-calculator` | Field elevation + altimeter (inHg or hPa) → pressure altitude; links to density altitude. |
| `flight-time-fuel-calculator` | Distance + ground speed → time; fuel burn rate → fuel required + reserve (30/45 min presets), units gal/L/lb (avgas 6 lb/gal, Jet A 6.7 lb/gal). |
| `weight-and-balance-calculator` | Rows of item / weight / arm → total weight, moment, CG; user-entered envelope limits (min/max CG, max weight) → in/out of limits. No aircraft database (user enters their POH numbers — stated). |

All carry the existing "training and planning only" notice.

## 4. Personal-file tools

| Slug | Logic | Notes |
|---|---|---|
| `subtitle-sync-fixer` | `lib/subtitles.ts` | SRT/VTT parse; shift all by ± ms; two-point linear resync (fix drift: map cue A→time A', cue B→time B'); convert SRT↔VTT; fix numbering/overlaps; download. |
| `har-sanitizer` | `lib/har.ts` | Load `.har` → list of what will be redacted (cookies, `Authorization`, `Set-Cookie`, `X-Api-Key`/`token`-like headers, query params matching token/key/secret/session/code/password, JWT-looking values anywhere, request/response bodies optionally) with per-category toggles; redacted HAR download; summary count. Never displays full secret values (masked). |
| `eml-viewer` | `lib/eml.ts` | Parse RFC 5322 + MIME (multipart, base64, quoted-printable, RFC 2047 encoded headers, charsets via `TextDecoder`); show headers, plain text, HTML body in a sandboxed iframe (`sandbox` with no scripts, `srcdoc` with a meta CSP `default-src 'none'; img-src data:; style-src 'unsafe-inline'` so remote images/tracking pixels never load), attachments listed with download (object URLs revoked). |

## 5. Category hubs

**Where:** new route `app/category/[slug]/page.tsx` (`generateStaticParams` from a `HUBS` registry in new `lib/hubs.ts`: `india`, `aviation`), server component, metadata + canonical + `CollectionPage`/`ItemList` JSON-LD. Content: H1, 150–300-word intro (in `lib/hubs.ts`), grid of the category's tools (reuses `ToolCard`), short FAQ (reuses `details.faq`). Linked from: tool page breadcrumb category crumb (when a hub exists), `CategoryNav` link mode (hub URL instead of `/?cat=` for those two), footer, sitemap. The homepage sidebar (button mode) is unchanged.

Why a new route and not `/tools/<category>/`: `/tools/[slug]` is the tool route; a category slug there would collide with tool slugs.

## 6. Privacy (unchanged rules, new risks)

- QR: Wi-Fi password, UPI ID, contact data and logo stay in memory — canary cases for each.
- EML: remote content inside the email must never load (sandbox + meta CSP + site CSP `img-src`); test with an email containing `<img src="https://tracker.example/pixel.gif">` → no request to that host.
- HAR: the file itself is full of secrets; canary: a HAR whose cookies/tokens contain the canary → no request carries it, and the redacted output contains no canary where redaction is on.
- GSTIN/Aadhaar/UPI: inputs never in URL/storage/console (static guard + canary).
- No new third-party origins; CSP unchanged.

## 7. Testing / rollout

Per-tool unit tests with published vectors (cite sources), component tests, canary e2e for every new tool, QR decode-back e2e, hub page metadata + JSON-LD tests, sitemap count computed from registries, sweep at 1280/390, `npm run verify` + `npm run e2e` green, final whole-branch review, then push (owner pre-approved pushing with the `jha-adrs` account). Fonts ship in the same push only if verified; otherwise they are listed as "not shipped" in the report.

## 8. Files (summary)

New: `lib/qr/{payloads,matrix,render-svg,export,contrast}.ts`, `lib/gstin.ts`, `lib/verhoeff.ts`, `lib/hindi-keyboard.ts`, `lib/metar.ts`, `lib/subtitles.ts`, `lib/har.ts`, `lib/eml.ts`, `lib/hubs.ts`, `app/category/[slug]/page.tsx`, ~15 tool components + content files + tests.
Changed: `components/tools/QrCodeGenerator.tsx` (rewrite), `lib/aviation.ts` (extend), `lib/legacy-fonts.ts` (gated), `lib/tools.ts`, `components/ToolMount.tsx`, `lib/tool-content.ts`, `components/CategoryNav.tsx` (hub links), `app/tools/[slug]/page.tsx` (crumb → hub), `components/Footer.tsx`, `app/sitemap.ts`, `test/e2e/privacy.spec.ts`, `CLAUDE.md`.
