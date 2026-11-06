# Advisor impact review — will the 2026-11-05 plans move clicks?

Date: 2026-11-06 · Advisory only, no product code changed.
Inputs: `2026-11-05-exam-photo-tools` (plan + design + `2026-10-09-exam-form-research`), `2026-11-05-color-pages` (plan + design), `2026-11-05-tool-upgrades-batch-1` (plan + design + audit).
Evidence: GSC after ~4 weeks — ~1,000 queries with impressions, almost no clicks; best positions are long-tail convert pages (`yards to nautical miles` 9.8, `128 oz in gallons` 13, `1.49 billion in million` 21) and `calculate conversion` 6.3; commodity dev tools sit at 60–85.

## The one-paragraph answer

The site's problem is authority, not inventory. 205 indexed URLs, clean static HTML, hubs, breadcrumbs, FAQ schema on 44 tools — Google *sees* the site for ~1,000 queries and ranks it on page 6–9 for all commodity terms. No feature upgrade turns a page-8 "random number generator" into page 1 within 3 months on a one-month-old domain; Google's own widgets and DA-80 incumbents own those SERPs. Pages that are already near page 1 are all **long-tail, exact-intent pages that nobody else bothered to build** (nautical units, Indian number scale). That is the only pattern that has worked, and the only one worth paying for now. Of the three plans, **exam-photo tools** is the only one that follows that pattern; **colour pages** should be cut (its headline evidence is an artefact); **tool upgrades** should shrink to the content blocks plus two half-day upgrades on pages already at positions 6–9.

Two facts found in the repo that change the picture:

1. **`#c6f24e` is not demand.** It is the site's old accent colour, hard-coded as the default colour in `components/tools/BoxShadowGenerator.tsx:39` and `components/tools/FileGenerators.tsx`. It gets 13 impressions because the string is in our HTML, not because people want a colour page. The colour-pages design cites it as its lead evidence.
2. **Internal linking is already fine.** `out/index.html` links all 139 tool pages statically; every tool page links 5–6 siblings, the category hub and the footer; `/convert/` is cross-linked from its parent tools. There is no cheap internal-link win left.

---

## 1. Verdict per piece

Scale for "3-month click estimate": **~0** = under 5 clicks/month, **trickle** = 5–50, **some** = 50–200. Nothing in these plans is plausibly above "some" by February 2027.

### Plan A — Exam & form photo tools

| Piece | 3-month estimate | Why | Verdict |
|---|---|---|---|
| Fit engine `lib/photo-fit.ts` + `PhotoFitter` UI (Tasks 1–3) | n/a (enabler) | Largest cost in all three plans (~2–3 days). Everything below depends on it. The engine is also exactly what `image-compressor` lacks (target KB), so it is reusable product value even if SEO is slow. | **BUILD** |
| Size pages `resize-image-to-{10,20,50,100,200}kb` | ~0 | Head terms ("resize image to 20kb" is #1 autocomplete). pi7, 11zon, imresizer, iloveimg, compressjpeg all have exact-slug pages with years of links. A new domain will not enter the top 30 in 3 months. Seven pages that differ by one number are also the thin-content pattern Google deindexes on young sites. | **SHRINK to 3**: `20kb`, `50kb`, `100kb` (the three autocomplete #1–#3). Drop `10kb`, `200kb`. Each must have a genuinely different worked example (which photo, what quality lands where), not a swapped number. |
| `resize-signature-to-20kb` | ~0 as a standalone | Same query is covered by `ssc-signature-size` ("signature resize 10 to 20 kb" is the SSC query). | **CUT** — fold into the SSC page copy and keywords. |
| `increase-image-size-in-kb` | trickle | Medium demand, *weak* competition (pi7 and a few blog posts; most resizers cannot go up). Distinct intent, one page, clear answer. Best size-page bet. | **BUILD** |
| Exam pages: NEET, JEE Main, CUET (NTA) | trickle, seasonal | JEE Main session 2 / NEET 2027 / CUET 2027 forms open Jan–Mar 2027 — inside the window if indexed by late Dec. Competition is coaching sites (adda247, testbook) and NTA itself; they answer "what size" but most do not *make* the file in-browser with current 2026 specs. | **BUILD** (first priority among exam pages) |
| Exam pages: RRB, SSC signature | trickle | Signature-only pages with specific numbers ("30–49 kb", "6cm x 2cm") are narrow, exact-match queries with stale competitors (many still say SSC photo 20–50 KB). RRB CEN 09/2025 applications run into Feb 2026 cycles; SSC CGL ~June. | **BUILD** |
| Exam pages: IBPS, SBI, TNPSC, CTET, UPSC | ~0 now, trickle at their next cycle (Aug–Sep 2027 for IBPS/SBI; CTET May; UPSC Feb) | Out of season for the next 3 months but nearly free once the data file exists; they age into value. "handwritten declaration for ibps" is a real gap. | **BUILD** (same data file, no extra engineering) |
| PAN, passport, Indian visa | trickle | Non-seasonal, moderate demand ("photo resizer for pan card" is #1 under its stem). Competitors are the same resizer sites. | **BUILD** |
| `/photo/` hub + registry card + India-hub link | n/a | Required for crawl paths; cheap. | **BUILD** |
| Name/date strip, whitening, DPI patch, padding | n/a | The strip (TNPSC/UPSC "photo with name and date") and padding ("increase image size in kb") are the two differentiators competitors lack; keep. Whitening is cheap. | **BUILD** |
| e2e byte-level checks (Task 7) | n/a | Non-negotiable: a wrong-KB file gets a form rejected, which is the one way this tool earns a bad reputation. | **BUILD** |

**Plan verdict: BUILD, shrunk from 20 to 17 pages.** Realistic outcome by Feb 2027: a trickle from NTA/RRB/SSC/PAN pages and `increase-image-size-in-kb`; nothing from the size pages. Honest expectation: this is a 6–12-month asset that pays at each exam cycle, not a 3-month win. It is still the best of the three because it is the only plan that creates pages with unique, exact-intent answers in the India niche the site has chosen.

### Plan B — Programmatic colour pages (~370 pages)

| Piece | 3-month estimate | Why | Verdict |
|---|---|---|---|
| 148 CSS-named colour pages | ~0 | "tomato color code" / "#ff6347": Google shows its own colour-picker widget in-SERP, then htmlcolorcodes, colorhexa, color-hex, encycolorpedia, w3schools — all DA 60–90 with identical computed data. There is nothing to be *more correct* about. | **CUT** |
| 242 Tailwind v3 shade pages | ~0 | "slate-500 hex" is answered by tailwindcss.com, uicolors, and Google's widget. Tailwind v3 palette is also being superseded by v4's OKLCH palette, so the data goes stale. | **CUT** |
| A–Z hub, sitemap, footer link | n/a | Only useful with the pages. | **CUT** |
| `lib/color-math.ts` extraction (Task 1) | n/a | Pure refactor; only needed by the contrast-checker upgrade, which is deferred below. | **DEFER** (do it inside the contrast task if that ever runs) |

**Plan verdict: CUT.** Adding 370 near-duplicate computed pages to a 205-URL site with low authority is the fastest way to get "Crawled – currently not indexed" across the board and dilute crawl budget away from the pages that are working. The lead evidence (`#c6f24e`) is our own default value echoing back. If the owner wants a colour play later, the evidence-gated version is: watch whether `color-converter` / `contrast-checker` ever get impressions for named-colour queries; if yes, add a *single* "CSS named colours table" page, not 370.

### Plan C — Tool upgrades batch 1

| Piece | 3-month estimate | Why | Verdict |
|---|---|---|---|
| About/FAQ content for 10 bare tools (Tasks 0–2) | ~0 clicks directly; indexing + rich result eligibility | 93 of 137 tool pages are a widget plus one sentence. That is thin content by Google's definition and a plausible reason pages hover at 60–80 rather than indexing properly. Cheap (S each), no risk, and it is the one piece that helps *every* other plan. Won't move a head term to page 1 on its own. | **BUILD** (all 10; write `css-gradient`, `contrast-checker`, `conversion-rate-calculator` copy for **today's** features, since their upgrades are cut/deferred) |
| `random-number-generator` modes (Task 3) | ~0 | 81 impressions at position 84 is the *worst* signal in GSC, not the best: Google has native widgets for random number, dice roll and coin flip, then calculator.net and random.org. No feature set reaches page 1 here. The modulo-bias fix is correctness, not clicks. | **CUT** (fold a one-line bias fix into any future touch; no modes) |
| `conversion-rate-calculator` solve-for + AOV (Task 4) | trickle | Only page on page 1 (6.3) for a commodity-ish query, with a dead currency select. S effort; the solve-for modes match "how many visitors do I need" long-tails. Low volume, but it is the cheapest page to protect and deepen. | **BUILD**, but **SHRINK**: solve-for modes + AOV wiring + content block. Drop "compare with previous period". |
| `date-calculator` business days (Task 5) | trickle | Position 9 for "date calculator" is a head term we will not hold, but **"add working days to a date"** / "business days calculator" long-tails are what timeanddate buries in a separate tool. S effort. | **BUILD**, **SHRINK**: business-day mode (weekend choice + pasted holidays) and the Today button. Drop multi-unit rows and extra output formats (ISO week, Unix, DD/MM) — nobody searches for those on a date-add page. |
| `css-gradient` multi-stop/conic/oklch/Tailwind (Task 6) | ~0 | 2 clicks at position 81. cssgradient.io, Josh Comeau, ColorSpace, hypercolor (Tailwind) own every variant including "conic gradient generator". M effort for a page whose gap is authority, not features. | **DEFER** — content block only now. Re-check GSC 2026-12-15; build only if the page reaches ≤ 30. |
| `contrast-checker` APCA/matrix (Task 7) | ~0 | WebAIM owns the head term; "apca contrast checker" is owned by apcacontrast.com and Myndex (the APCA authors). The palette matrix is a nice feature with no search demand. Also blocked on the cut colour-pages extraction. | **DEFER** — content block only. |
| `metar-decoder` + `taf-decoder` headline/RMK/multi/timeline (Task 8) | ~0 in 3 months | "metar decoder" intent is mostly *live* ("decode KJFK metar"), served by aviationweather.gov and metar-taf.com, which fetch the report; a paste-only tool is structurally second. Aviation batch-2 pages are not visible yet, so there is no evidence the hub is gaining. The RMK table, 20-report split and TAF timeline are gold-plating for a page with no impressions. | **DEFER**; when (if) aviation pages show impressions, build **only** the plain-English headline + category badge (half a day), not the rest. |

**Plan verdict: SHRINK** to content blocks + two S upgrades. Roughly 2 days instead of 8–10.

---

## 2. What would move the needle more for the same effort

Checked and **not** worth doing (already fine): internal links, crawlability (all links are in static HTML), page weight (105 KB shared, self-hosted fonts), sitemap/robots, canonicals, structured data on tool pages. `lastmod` in the sitemap and title-tag modifiers were considered and rejected: titles only matter once there are impressions to convert, and the pages with impressions are at 60–85 where CTR is irrelevant.

Clearly higher value than any plan above, in order:

1. **Authority: get 10–20 real links.** This is the whole gap. A static tool site with a real privacy story (CSP-enforced, e2e-tested no-leak canaries) is exactly the kind of thing that gets listed. Concrete, zero-owner-effort prep the controller can do: write the launch posts and submission texts into `docs/launch/` for Show HN, r/webdev + r/privacy + r/india (exam photo angle, once live), Product Hunt, AlternativeTo (as an alternative to pi7/11zon/iloveimg), the "awesome-privacy" / "awesome-selfhosted-style" GitHub lists, and the Cloudflare Pages / Next.js showcase. The **only owner action** in this whole document is pressing "post" on those — flag it once, do not block on it.
2. **One GSC Page-indexing export.** Before building 17 more pages, know how many of the existing 205 are "Crawled – currently not indexed". If it is a large share, the content blocks (item 3 below) and the launch links are the fix, and new pages should wait until the share improves. The controller cannot pull this; ask the owner once, alongside item 1, and proceed regardless.
3. **Content blocks for *all* 93 bare tool pages, not just 10.** Same unit cost as the 10 in Plan C; it addresses thinness site-wide, which is the most likely indexing drag. Batch them 10 at a time after the exam tool ships. Prioritise by GSC impressions (any page with ≥ 1 impression first).
4. **Worked-example tables on the `/convert/` pages that are already ranking 9–21** (number scale, nautical, oz→gallon). GSC shows users arrive with a specific number (`1.49 billion in million`, `128 oz in gallons`). The pages already have reference tables; make sure the table rows cover the values people type (common round values plus fractional ones) and that the H2 says "X oz in gallons" in words. Half a day, and it is the only place the site is within reach of page 1.
5. **Static OG image** (one 1200×630 PNG in `public/`, referenced from `app/layout.tsx`). Zero search value, but every launch post from item 1 renders a blank card without it. Fifteen minutes.

Not recommended: more programmatic families, a blog, or any page-speed work.

---

## 3. The three value calls (decided; no owner input needed)

1. **Passport photo KB range → `kb: [0, 1000]`, no padding, quality cap 0.95, `whiteBg` off.** The ICAO guideline sets no file-size limit and asks for a photo "unaltered by computer software", so inventing a 20 KB floor (which would pad the file) or a 250 KB ceiling (which would degrade quality) both work against the only official instruction we have. A 630×810 JPEG at q 0.95 lands around 150–300 KB, well under any upload form's ceiling. The note stays: "Passport Seva's guideline sets no file-size limit; this keeps quality high and the file under 1 MB." If the controller can fetch Passport Seva's own "upload photo" instruction page during Task 2 and it states a range, use that range verbatim and cite it; otherwise ship `[0, 1000]`.
2. **SSC signature → 6.0 × 2.0 cm (472×157 px at 200 dpi), one preset, note the 4.0 × 2.0 annexure.** The body of the notice says 6×2, the annexure says 4×2, and the portal enforces only JPG and 10–20 KB; pixels are "about". 6×2 matches the live query "signature resize 6cm x 2cm" and gives the larger, clearer scan. Do not add a second 4×2 option (YAGNI); one sentence in the note covers it.
3. **PAN photo → portrait 197×276 (2.5 cm wide × 3.5 cm tall), signature landscape 354×157.** Protean writes both as height × width ("3.5 × 2.5", "2 × 4.5"); reading the signature as 2 tall × 4.5 wide is the only sensible orientation, so the same convention makes the photo 3.5 tall × 2.5 wide — which is also how the photo appears on the physical card. Confirmed as planned.

---

## 4. Ordered execution list (runs without owner input)

Each item names the plan task it maps to; cuts above are applied. Commit per task, do not push.

**0. Launch prep (parallel, no code) — ~2 h**
- Write `docs/launch/posts.md`: Show HN text, Reddit posts (r/webdev, r/privacy; r/india once item 1 ships), Product Hunt blurb, AlternativeTo entry, two GitHub awesome-list PR texts. Flag to the owner once at the end: "post these; export GSC Page-indexing." Do not wait for either.
- Add a static OG image (`public/og.png`, referenced in `app/layout.tsx` `openGraph.images`). Keep it under 100 KB.

**1. Exam photo tools — Plan A, Tasks 0–7, shrunk — ~3–4 days**
- Task 0 baseline as written.
- Task 1 `lib/photo-fit.ts`, Task 2 `lib/photo-presets.ts` in parallel. In Task 2 apply: size pages = `resize-image-to-20kb`, `-50kb`, `-100kb`, `increase-image-size-in-kb` only (drop 10kb, 200kb, `resize-signature-to-20kb`; move the signature keywords into `ssc-signature-size`); passport `kb: [0, 1000]`, `whiteBg: false`; SSC 472×157; PAN 197×276 / 354×157. Keep all 13 exam/form pages. The pinned-value test in the plan is updated to match (passport bounds, 4 size slugs, 17 presets total).
- Task 3 `PhotoFitter`, then Tasks 4 + 5, then Task 6 wiring (sitemap, India hub copy, footer, registry card), then Task 7 e2e + privacy canaries + bundle gate. Each size page's `intro` must contain a different worked example (different source photo size/quality path), per the design's thin-content mitigation.
- Final review as written.

**2. `/convert/` worked-example sweep — ~half a day**
- For the number-scale, nautical and volume pairs that GSC already shows (positions 9–21): make sure the reference table includes the specific values seen in queries (e.g. 1.49 billion, 128 oz) and common fractional rows; phrase the example H2 as the query is typed. No new pages, no new routes.

**3. Content blocks, batch 1 — Plan C, Tasks 0–2 — ~1 day**
- The 10 slugs in the design. `css-gradient`, `contrast-checker`, `conversion-rate-calculator` copy describes **current** behaviour (the conversion-rate block is rewritten in item 4 when the upgrade lands; the other two stay as-is).

**4. `conversion-rate-calculator` — Plan C, Task 4, shrunk — ~half a day**
- Solve-for modes (rate / visits needed / conversions needed), AOV + currency formatting (fixes the dead select), content block. Skip the compare-period panel. `lib/conversion-rate.ts` + tests as planned.

**5. `date-calculator` business days — Plan C, Task 5, shrunk — ~half a day**
- Business-day mode (weekend choice, pasted holidays), Today button, `lib/date-calc.ts` in UTC, update the existing content FAQ. Skip multi-unit rows and extra output formats.

**6. Content blocks, batches 2–n — ~1 day per 10**
- Remaining ~83 bare tool pages, ordered by GSC impressions, then by category weight (India, Aviation, Image/PDF first). Same shape test applies automatically.

**7. Privacy canaries + full gates** (`npm run verify`, `npm run e2e`) after items 1, 4, 5 — already in each plan's final task.

**Gated, not scheduled — re-read GSC on 2026-12-15 and again 2027-01-15:**
- `css-gradient` ≤ position 30 → run Plan C Task 6 as written.
- Any aviation tool page with ≥ 20 impressions → METAR/TAF **headline + category badge only** (not Task 8 in full).
- Any `/photo/` page with impressions → add the next-cycle exam pages that were out of scope (UPSSSC, BPSC, GDS) *only after* their official notices can be read.
- Named-colour queries appearing on `color-converter` → one "CSS named colours" table page, not the 370-page family.

**Cut outright:** colour pages (all 7 tasks), RNG modes, contrast-checker APCA/matrix, the `lib/color-math.ts` extraction (until contrast is unblocked), the 10 kb / 200 kb / signature-20kb size pages, compare-period in conversion-rate, multi-unit rows and extra formats in date-calculator.

## Expectation setting

If everything above ships by mid-December: by early February 2027 expect a trickle (tens of clicks/month) concentrated on NTA/RRB/SSC exam pages, `increase-image-size-in-kb`, PAN, and the `/convert/` pages already near page 1 — *if* the launch links land. Without links, expect the same trickle to take 6+ months. No item here plausibly produces hundreds of clicks/month by February; anyone promising that for a one-month-old domain on commodity terms is guessing.
