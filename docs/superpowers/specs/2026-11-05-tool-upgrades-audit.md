# Tool upgrades audit — which existing tools to deepen

Date: 2026-11-05. Advisory only; no code changed.

## Why this audit

Search Console (last ~4 weeks) shows the site is *seen* for a handful of commodity queries but ranks on page 7-9 for most of them (css gradient ~81, random number ~84, meta tag ~75, sql formatter ~78, cidr ~70). Three queries already sit on page 1: **conversion-rate calculator (6.3)**, **date calculator (9)**, **yards to nautical miles (9.8)**, plus `#c6f24e` (8.9, handled by the separate hex-colour pages plan). The audit asks: which *existing* tools, if made clearly better than the page-1 incumbents, would convert impressions into clicks or move from page 8 to page 1-2 — within the site's constraints (no network, no new runtime deps unless pure-client + lazy, ~105 KB first-load budget, hedged privacy copy).

Two cross-cutting findings came first, because they are cheaper than any feature work:

1. **Only 43 of 137 tools have a `lib/tool-content/<slug>.ts` About/FAQ block.** None of the GSC-visible Web & CSS / Formatter / Marketing tools have one (`css-gradient`, `contrast-checker`, `sql-formatter`, `email-signature-generator`, `conversion-rate-calculator`, `unit-converter`, `color-converter`, `image-compressor`, `image-resizer`, `merge-pdf` all missing). A tool page that is a bare widget with a one-line blurb will not outrank a competitor with 600 words and FAQ schema regardless of features. Every upgrade below should ship with its content block (step 4 of "Adding a tool" in CLAUDE.md).
2. **Several tools are "minimum viable" against page-1 competitors** (two-stop gradient, IPv4-only CIDR, dialect-less SQL formatter, integer-only RNG). These are cases where the ranking gap is explained by the feature gap.

Ranking formula: (search value x user value) / effort. S = under half a day, M = 1-2 days, L = 3+ days. Bundle risk is about the *per-tool* chunk unless stated; nothing here touches the shared first-load bundle except registry text.

---

## Ranked upgrades

### 1. `css-gradient` — multi-stop, conic, presets, Tailwind output

- **Now:** exactly two colour stops in fixed state, linear or radial only, output is one `background:` line — `components/tools/CssGradient.tsx:7-12` (state), `:28-35` (type segmented), `:23` (output).
- **Competitors** (cssgradient.io, ColorSpace, Josh Comeau's gradient generator): unlimited stops with a draggable bar, conic gradients, easing / colour-space interpolation (`in oklch`), named presets, repeating gradients, Tailwind class output, text-gradient snippet.
- **Upgrade:** stops as an array with add/remove/reorder and per-stop position; add `conic`; add `in oklch` / `in srgb` interpolation toggle (modern CSS, no lib); 8-12 presets; second output panel with Tailwind (`bg-[linear-gradient(...)]`) and a "text gradient" snippet; random-gradient button. Keep the hand-drawn preview.
- **Why it wins:** this is the only GSC query with clicks today (2 at position ~81). The competitor set is strong but static, and most do not do oklch interpolation or conic + Tailwind in one place. Pair with a content block that targets "css gradient generator", "conic gradient generator", "tailwind gradient".
- **Effort:** M. **Deps/bundle:** none (pure React + CSS). **Privacy:** none.

### 2. `cidr-calculator` — IPv6, subnet splitting, address-in-range check

- **Now:** single IPv4 CIDR in, eight rows out — `components/tools/CidrCalculator.tsx:161` (`192.168.1.0/24` state), `:175` (field labelled "IPv4 CIDR"), `:185-192` (rows). No IPv6, no binary view, no subnetting.
- **Competitors** (ipaddressguide, subnet-calculator.com, jodies.de/ipcalc, mxtoolbox): IPv6 support, binary/hex representation, "split into N subnets" or "subnets of /X" table, "is this IP inside this block", RFC1918 / reserved-range flags, netmask-to-CIDR reverse lookup, CSV export.
- **Upgrade:** IPv6 (BigInt arithmetic, compress/expand), binary rows, "divide into subnets" table with copy/CSV, "contains IP?" check, private/reserved badge, accept `netmask` forms (`192.168.1.0 255.255.255.0`).
- **Why it wins:** ~70 position with impressions means Google already associates the page with the query; IPv6 + subnetting is what separates page-1 results from page-7 ones, and network admins dislike pasting internal ranges into ad-heavy sites — the privacy angle is real here.
- **Effort:** M. **Deps:** none (BigInt is native). **Privacy:** none; inputs stay in state.

### 3. `sql-formatter` — dialect, indent style, minify, keyword case options

- **Now:** one textarea and one toggle (`uppercase`) — `components/tools/SqlFormatter.tsx:255-256`; hand-written formatter with no dialect awareness.
- **Competitors** (sqlformat.org, poorsql, codebeautify, dpriver): dialect picker (MySQL / PostgreSQL / T-SQL / BigQuery / SQLite), indent 2/4/tab, comma-first vs comma-last, keyword case upper/lower/preserve, **minify / one-line**, line-width wrap, clause alignment, file upload + download.
- **Upgrade:** dialect select (affects quoting characters, `LIMIT`/`TOP`, backticks vs double quotes, `::` casts), indent/comma style, minify mode, "preserve case" option, `.sql` file drop and download, basic syntax error hint (unbalanced parens/quotes). A `sql-formatter` npm lib exists but is ~100 KB and not required; extend `lib`-level hand code and keep it in the per-tool chunk.
- **Why it wins:** "sql formatter" is a high-volume developer query with a genuine privacy angle (people paste production queries with table names and literal values). Position 78 with a single toggle is expected; dialect + minify is the table-stakes gap.
- **Effort:** M-L (the formatter rewrite is the cost). **Deps:** none recommended. **Privacy:** add a `privacy.spec.ts` canary (query text must not leak); already fine.

### 4. `random-number-generator` — decimals, dice/coin modes, exclusions, seeded/sorted output

- **Now:** integer min/max/count, unique toggle, separator — `components/tools/RandomNumberGenerator.tsx:71-78`; output is a flat list.
- **Competitors** (calculator.net RNG, random.org, numbergenerator.org, Google's own widget): decimal places, "exclude these numbers", sort ascending, dice (d6/d20, multiple dice with sum), coin flip, pick-from-list, lottery presets (6/49 etc.), history, big-number display with a "spin" state, seeded reproducible mode.
- **Upgrade:** decimals (0-6), exclude list, sort toggle, modes: *Numbers / Dice / Coin / Lottery*; large single-result display; copy-as-column; optional seed (xorshift) for reproducible sequences. Keep `crypto.getRandomValues` as the default source.
- **Why it wins:** 81 impressions at position ~84 is the largest impression count in GSC. The head term is commodity, but Google tends to surface rich single-page tools for "random number generator 1-100", "dice roller", "coin flip" long-tails; one richer page targets all of them. Ignore the gambling "aviator" variant per brief.
- **Effort:** S-M. **Deps:** none. **Privacy:** none.

### 5. `contrast-checker` — APCA, suggested fixes, bulk palette, sample UI preview

- **Now:** fg/bg hex + pickers, WCAG ratio with four badges, 16px/18px text preview — `components/tools/ContrastChecker.tsx:80-83`, `:204-213`.
- **Competitors** (WebAIM, Coolors contrast, Accessible Palette, Polypane, Who Can Use): lightness sliders with live "nudge to pass" suggestions, **APCA (WCAG 3 draft) score**, UI-component (3:1 non-text) check, colour-blindness simulation, bulk "check every pair in this palette" matrix, shareable result, swap button, alpha/transparent foreground.
- **Upgrade:** APCA Lc value alongside WCAG 2 (algorithm is small, public, implement inline), "suggest nearest passing colour" (walk L in HSL until pass), fg/bg swap, non-text 3:1 badge, palette matrix (paste N hex codes, get an N x N pass/fail grid with CSV copy), colour-vision simulation of the preview via matrix filters (SVG `feColorMatrix`, no lib).
- **Why it wins:** GSC already shows impressions. WebAIM owns the head term but does not do APCA or a palette matrix; designers search "contrast checker apca" and "colour palette contrast matrix" with no dominant answer. Also feeds the hex-colour pages (out of scope here) with internal links.
- **Effort:** M. **Deps:** none. **Privacy:** none.

### 6. `metar-decoder` + `taf-decoder` — plain-language summary, flight category badge, multi-report, unit toggle

- **Now:** paste one report, get a group-by-group table — `components/tools/MetarDecoder.tsx:65`, `lib/metar.ts:215` (`decodeMetar`), `:281` (`decodeTaf`); `flightCategory()` exists at `lib/metar.ts:17` but there is no headline summary, no unit conversion, and one report at a time.
- **Competitors** (aviationweather.gov decoder, metar-taf.com, checkwx, e6bx): plain-English paragraph ("Wind 270 at 12 gusting 20, visibility 10 miles, few clouds at 2,500 ft, VFR"), VFR/MVFR/IFR/LIFR colour badge, °C/°F and hPa/inHg toggles, density-altitude derived from the METAR (station elevation input), multi-line paste (decode several stations at once), RMK section decoding (SLP, T-group precise temps, peak wind), TAF timeline per period with validity window in local time.
- **Upgrade:** one-sentence summary + category badge at the top, remarks decoding, unit toggles, multi-report paste, and a "compute density altitude from this METAR" link that pre-fills `density-altitude-calculator` via `/#` fragment (never query string). For TAF: a simple horizontal period strip with local-time conversion.
- **Why it wins:** aviation is the declared niche and the Aviation hub exists; competitors here are either government (no UX) or ad-heavy. METAR/TAF decoders are the highest-volume aviation tool queries and this one is the thinnest in the set (106 / 68 lines). Content blocks already exist for both.
- **Effort:** M. **Deps:** none. **Privacy:** none (reports are public data; still keep out of URL unless user triggers the hand-off via fragment).

### 7. `conversion-rate-calculator` — reverse modes, significance, funnel

- **Now:** conversions / visits -> one percentage; an unused-looking currency select — `components/tools/ConversionRateCalculator.tsx:43-57`, `:65`.
- **Competitors** (Optimizely, VWO, HubSpot, Omni): solve for any of the three (rate, conversions needed, visits needed), compare two periods with relative change, revenue per visitor when AOV is given (this is what the currency select should feed), multi-step funnel (visits -> leads -> customers) with step-by-step drop-off, benchmark table by industry.
- **Upgrade:** mode segmented *Rate / Visits needed / Conversions needed*; optional "average order value" that turns the currency select into revenue-per-visitor and projected revenue; "compare two periods" panel; 3-5 step funnel table with drop-off percentages and a copyable summary. Add the missing content block.
- **Why it wins:** position **6.3** today for "calculate conversion" with a thin page — this is the closest tool to page-1 clicks and the cheapest to deepen. A funnel + revenue view matches what marketers actually type ("conversion rate to revenue", "how many visitors do I need").
- **Effort:** S. **Deps:** none. **Privacy:** none.

### 8. `date-calculator` — business days, multi-unit add, repeat schedule, Indian holidays

- **Now:** start + add/subtract one amount of one unit -> date and weekday — `components/tools/DateCalculator.tsx:76-79`.
- **Competitors** (timeanddate, calculator.net date calculator): add years *and* months *and* days together, business-day mode (skip weekends, optional holiday list), "from today" shortcut, result in several formats (ISO, long, Unix, week number, day of year), repeat every N days list, countdown.
- **Upgrade:** multi-unit add in one go, business-day toggle with weekend selection (Sat-Sun vs Fri-Sat vs Sun only — relevant in India/Gulf) and a paste-your-holidays box, "today" button, extra output formats, "next 10 occurrences" list. Content block already exists; extend FAQ with "working days" wording.
- **Why it wins:** position 9 already; business-day arithmetic is the feature people bounce back for and most incumbents put it in a separate tool. Low effort; pure date math.
- **Effort:** S. **Deps:** none. **Privacy:** none.

### 9. `image-compressor` + `image-resizer` — batch, target size, presets, EXIF-safe output

- **Now:** both take one file — `components/tools/ImageCompressor.tsx:27` (`files[0]`), state at `:20-21` (format + quality only); resizer has width/height/lock and 25/50/75/200 % buttons — `components/tools/ImageResizer.tsx:31-33`, `:167`.
- **Competitors** (Squoosh, TinyPNG, iLoveIMG, ImageResizer.com): batch (drop 20 files, download a zip), **compress to a target KB** (binary search on quality — note: the exam-photo-to-KB tool is planned separately; the generic "under 100 KB / 200 KB / 1 MB" presets still belong here and should share the same helper), side-by-side before/after slider, resize by percent *or* by longest edge *or* to social presets (Instagram 1080, OG 1200x630, YouTube thumb 1280x720, passport 35x45 mm at 300 dpi), DPI metadata, strip metadata toggle.
- **Upgrade:** multi-file drop for both, per-file results list and a zip download (a tiny store-only zip writer, no deflate, is ~60 lines and avoids JSZip), target-size presets in the compressor via quality bisection, before/after comparison, social/size presets in the resizer, "longest edge" mode, crop-to-aspect. Share the quality-bisection helper with the planned exam-photo tool so both don't diverge.
- **Why it wins:** image tools are the "personal-file privacy" niche; single-file-only is the first thing a user hits when comparing with Squoosh. Batch + zip is the one feature that makes a privacy-first tool credible against upload sites.
- **Effort:** M. **Deps:** none if the zip writer is inline (store-only ZIP is trivial; CRC32 table is ~20 lines). **Privacy:** revoke object URLs for every file; re-encode via Canvas (already the policy).

### 10. `weight-and-balance-calculator` — envelope chart, aircraft presets, fuel burn CG shift

- **Now:** rows of item/weight/arm, min/max CG, max weight, textual within-limits notice — `components/tools/WeightAndBalanceCalculator.tsx:16-19`, `:64-87`. No chart, no fuel burn, no saved aircraft.
- **Competitors** (e6bx W&B, FlyingWB, Garmin Pilot, free "C172 weight and balance calculator" pages): CG envelope *graph* with takeoff and landing points plotted, polygon envelope (not just two limits), presets for C150/C152/C172/PA-28/DA40, fuel in gallons auto-converted to pounds, landing CG after burn, moment/1000 display, save/load aircraft profiles locally, print-friendly sheet.
- **Upgrade:** SVG envelope with polygon points (paste from the POH), takeoff + landing CG plotted, fuel-burn input, gallons/litres to lb/kg, 4-6 trainer presets, `localStorage` save of *aircraft* profiles (aircraft arm/limits only, never the flight's weights — keep user-entered loads out of storage per privacy rules, or put it behind an explicit "remember this aircraft" button and say so in content), print stylesheet.
- **Why it wins:** "weight and balance calculator c172" style queries are high-intent niche searches with weak free competition; this tool is already in the aviation hub and currently loses to any page with a graph.
- **Effort:** M. **Deps:** none (inline SVG). **Privacy:** storage use must be limited to aircraft constants and disclosed; the static guard test scans for `localStorage` so expect a deliberate allowlist entry.

### 11. `keyword-density` — phrases (2-3 word), TF-IDF-ish weighting, URL-free HTML paste, stuffing warning

- **Now:** single-word counts with stop-word toggle, top-N, min length — `components/tools/KeywordDensity.tsx:80-83`.
- **Competitors** (SEOReviewTools, Small SEO Tools, Prepostseo): 1/2/3-word phrase tabs, paste HTML and count only visible text (strip tags, scripts), separate counts for title/H1/H2/meta, "target keyword" input with density and position (first 100 words?), stuffing warning above ~3 %, export CSV. Most of them fetch a URL — which this site cannot do, so sell the "paste your draft, nothing uploaded" angle.
- **Upgrade:** n-gram tabs, HTML-paste mode (DOMParser, client-side), target-keyword panel with occurrences in headings, stuffing/under-use notice, CSV download, Hindi/Devanagari tokenisation (ties into the India niche; most competitors break on it).
- **Why it wins:** impressions at 16-25 already; adding phrases is the single most-asked feature and Devanagari support is a differentiator nobody else has.
- **Effort:** S-M. **Deps:** none. **Privacy:** none.

### 12. `meta-tag-generator` + `serp-preview` + `open-graph-generator` — merge into one with live previews

- **Now:** three separate thin forms — `components/tools/MetaTagGenerator.tsx:42-48` (seven fields, no preview), `SerpPreview.tsx:45-47`, `OpenGraphGenerator.tsx:37-43`. The user has to re-type the same title/description three times.
- **Competitors** (metatags.io, Rank Math / Yoast previews): one form -> Google desktop + mobile SERP, Facebook/LinkedIn/X card, Slack/WhatsApp previews, pixel-width title truncation (not char count), JSON-LD `WebSite`/`Article` snippet, favicon + language + charset lines, copy-all.
- **Upgrade:** keep the three slugs for SEO but make the components share state through a single `MetaTagsStudio` body (wrappers like `UpiQrCodeGenerator` already do this for QR); add pixel-width truncation using Canvas `measureText`, OG/X card mock-ups using the pasted image URL (rendered as `<img>` — note this *is* a network request by the browser to the user's own URL; show a hint and make the image preview opt-in to keep the privacy promise honest), JSON-LD output.
- **Why it wins:** meta tag generator sits at ~75 with impressions; the preview is what metatags.io ranks on. Consolidating also removes three duplicated code paths.
- **Effort:** M. **Deps:** none. **Privacy:** the OG image preview must be opt-in and disclosed in content; everything else is local.

### Honourable mentions (do after the above)

- **`unit-converter`** — only eight categories (`components/tools/UnitConverter.tsx:107-110`): add pressure (hPa/inHg — aviation), fuel economy (km/l, mpg, l/100 km — India), cooking, and a conversion *table* panel (the "liters to gallons table" query in GSC is a table query, and the `/convert/` pages answer it better than the tool today; cross-link both ways).
- **`color-converter`** — outputs only hex/rgb/hsl (`ColorConverter.tsx:71-76`): add HSB, CMYK, OKLCH, named colour, and tints/shades strip. Feeds the hex-colour page plan.
- **`email-signature-generator`** — 15 impressions, seven text fields and one layout (`EmailSignatureGenerator.tsx:93-99`): add 3-4 layouts, social links, Gmail/Outlook paste instructions, a "copy as rich text" button (ClipboardItem with `text/html`). S effort.
- **`merge-pdf` / `split-pdf`** — add page-count/size per file and a zip for "each page separately" split (`SplitPdf.tsx` has no zip, so "each" presumably triggers N downloads); reuse the inline zip writer from item 9.

---

## Tools that are weak, duplicative, or not worth investing in

1. **`conversion-rate-calculator`'s currency select** (`ConversionRateCalculator.tsx:43,65`) — currently stateful but unused in the result; either wire it to AOV/revenue (item 7) or remove it. As is, it is dead UI.
2. **`serp-preview` + `open-graph-generator` + `meta-tag-generator`** as three separate codebases — duplicative; fold into one body (item 12) and keep the slugs as thin wrappers.
3. **`hashtag-generator`** — a client-side tool cannot look up trending or related hashtags, which is the entire user intent for this query; every competitor is data-backed. Low ceiling. Do not invest; consider removing from the homepage's featured positions.
4. **`citation-generator`** — competes with Zotero/Scribbr/MyBib, which auto-fill from DOI/ISBN/URL lookups (network). A manual-entry form cannot win; keep for completeness, no investment.
5. **`lorem-ipsum`, `tip-calculator`, `water-intake`** — pure commodity queries that Google answers in-SERP or via dominant sites; near-zero impressions expected and nothing differentiating is possible. Keep, do not spend time.

(Also flagged: `pdf-to-images` is still on maintenance because pdf.js is heavy; that is a sound call under the bundle budget and is listed only to say "leave it".)

---

## Sequencing suggestion

1. Content blocks for the GSC-visible tools that lack them (css-gradient, contrast-checker, sql-formatter, email-signature, conversion-rate, unit-converter, color-converter, image-compressor/resizer, merge-pdf) — one short batch, S effort each, do first.
2. Items 7, 8, 4 (page-1 or high-impression, S effort).
3. Items 1, 2, 5 (Web & CSS / dev tools with existing impressions, M effort).
4. Items 6, 10 (aviation niche, M effort).
5. Items 3, 9, 11, 12.

Every item: add/extend `test/tools/<Name>.test.tsx`, add a canary to `test/e2e/privacy.spec.ts` where new text/file input appears, and check the `npm run build` First Load JS line stays ~105 KB.
