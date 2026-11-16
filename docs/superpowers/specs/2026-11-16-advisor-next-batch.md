# Advisor ruling — next batch (quick wins, AI citation, new tools)

Date: 2026-11-16 · Advisory only, no product code changed. Follows `2026-11-06-advisor-impact-review.md`; its cuts and gates stand unless stated here.
Evidence: GSC 2026-10-17..11-13 (17 clicks, ~5,300 impressions, 733 queries), repo read, SERP spot checks on 2026-11-16.

## What the new data says

1. **The Indian number-scale `/convert/` pages are the only cluster Google trusts.** 221 of 733 queries (318 impressions) are lakh/crore/million/billion queries, and dozens sit at positions 4–11 ("150 crore in billion" 4, "6 crore in billion" 6, "4000 cr in billion" 9.5, "billions to lakhs" 9.7). Twenty pages produce this. Nothing else on the site ranks this consistently.
2. **They earn 0 clicks at those positions, and the snippet is partly to blame.** The title is "Crores to Billions — dauntexlabs" and the meta description reads "1 crores = 0.01 billions (B) Designed to run…" (wrong plural, missing full stop — `exampleText()` in `lib/conversions.ts`).
3. **`date-calculator` (529 impressions, position 26.5) has a title with no search term in it:** "Date Add / Subtract — dauntexlabs". Queries are "date add", "date adder", "add days to date", "year subtractor", "today minus 730 days".
4. **Tool page titles are just `tool.name`** (`app/tools/[slug]/page.tsx`), so there is no way to write a search-facing title without renaming the card and H1.
5. Everything at positions 50–90 (keyword density, RNG, meta tags, CIDR, A/B test) is commodity and unchanged. The 14 RNG clicks are gambling traffic and count as zero.
6. The year-arithmetic queries ("2026 minus 1992", "28 plus 26") are answered by Google's calculator; no page will win a click there.

## 1. Quick wins on existing pages (ordered by expected effect)

| # | Page | Exact change | Why it moves clicks |
|---|---|---|---|
| 1 | All Number-scale `/convert/` pages (20 today) | In `generateMetadata` of `app/convert/[slug]/page.tsx`, for `category === 'Number scale'` only: title `"{From} to {To} Converter ({abbr} to {abbr})"` in the singular, e.g. "Crore to Billion Converter (Cr to Bn)". Abbreviations: K, Lakh, Mn, Cr, Bn. Fix `exampleText()` so number-scale reads "1 crore = 0.01 billion." (singular, full stop). For lakh pairs add "(also written lac)" to the description. H1, slug and canonical unchanged. | 318 impressions at mostly page-1/2 positions with 0 clicks. Queries say "crore in billion", "cr to bn", "converter"; the title says none of those. Expected: a handful of clicks per month now, growing with section 4A. |
| 2 | `/tools/date-calculator/` | Add optional `title?: string` to `Tool` in `lib/tools.ts`; `generateMetadata` uses `tool.title ?? tool.name` (title and OG title). Set title "Date Calculator: Add or Subtract Days, Weeks, Months or Years". Blurb: "Add or subtract days, weeks, months, years or business days from any date, for example 30 days before today or 90 days after a date." `name` (card, H1) unchanged. | Largest impression count of any non-commodity page, at 26.5 after the Nov 6 upgrade. The title is the cheapest ranking and CTR lever left on it. |
| 3 | `/tools/tip-calculator/` | Same field: title "Tip Calculator with Bill Split (Tip per Person)". Blurb: "Enter the bill, tip percentage and number of people to get the tip, the total and each person's share." | Position 6.6, 47 impressions, 0 clicks. Small, but it is one registry line once #2 exists. Expect 1–3 clicks/month. |
| 4 | Number-scale worked values (`WORKED_VALUES` in `lib/conversions.ts`) | Replace with values seen in GSC, still at most 6 each: crore `[1, 2.5, 100, 250, 1000, 4000]`, lakh `[1, 2.5, 10, 25, 40, 100]`, million `[0.05, 0.5, 1.5, 10, 100, 3800]`, billion `[1, 1.49, 2, 2.5, 3.8, 7.5]`, thousand `[100, 1500, 5000, 10000, 50000]`. | Users arrive with large crore values (100–60,000); the page shows 1–100. Ten-minute rider on #1. |
| 5 | Owner action: GSC "Request indexing" | `/photo/`, `/photo/increase-image-size-in-kb/`, the NEET/JEE/SSC/RRB/PAN photo pages, `/category/india/`, `/category/aviation/`, `/tools/metadata-remover/`, and after today's ship the new pages in section 4. | Ten-day-old pages with zero impressions are not indexed. Nothing else in this document matters for them until they are. |

**No change, on purpose:** `fraction-calculator` (8 impressions), `percentage-calculator` (9), `json-pivot` (14), `text-diff` (10), `encryption` (25), `date-difference` (27), `morse-code` (52 at 34). Too few impressions for a title to convert anything. Do not touch them.

## 2. AI-citation work

Assistants cite what their search index returns. ChatGPT search leans on Bing's index; so the lever is being indexed there, not a manifest file.

| Item | Verdict | Reason |
|---|---|---|
| Bing Webmaster Tools: import the site from GSC, submit `sitemap.xml` (owner, 10 min) | **GO — top item** | The site has no Bing presence that we know of. This is the precondition for ChatGPT-search and Copilot citations and costs no code. |
| Unblock `PerplexityBot` in Cloudflare (owner) | **GO** | It is a search crawler, same class as OAI-SearchBot which is already allowed. Blocking it guarantees zero Perplexity citations. |
| GA4 custom channel group "AI assistants" (source matches `chatgpt.com|chat.openai.com|perplexity.ai|claude.ai|copilot.microsoft.com|gemini.google.com`) (owner, GA admin, no code) | **GO** | It is the measurement gate for everything below. `components/Analytics.tsx` already sends the referrer origin, which is all the rule needs. |
| `public/llms.txt` from the registry | **CUT (gated)** | No major assistant has confirmed reading it for search answers, and Google has said it does not. Zero expected clicks. Revisit only if the GA4 channel shows ≥ 10 AI-referral sessions in 28 days. |
| Quotable fact tables on pages lacking them | **CUT as a project** | The pages that would be cited (number scale, `/photo/` specs) already carry tables and FAQ schema. The new pages in section 4 ship with theirs. A sweep across 138 tools is content work without a traffic case. |
| Preset-only deep links | **CUT (gated)** | No evidence assistants deep-link into tools; adds URL-state surface next to a strict "no user input in the URL" rule. Same gate as `llms.txt`. |
| Unblock GPTBot / ClaudeBot (training) | **No ruling needed** | No effect on clicks either way. Leave as is. |

## 3. Keyword-density upgrade

**CUT.** 2,046 impressions at position 54 is the same signal the RNG gave last time: a commodity head term owned by long-established SEO-tool sites, and Google is only testing us deep on page 5–6. The page already has its content block. No feature set moves it 45 places in a quarter. Gate: if the page averages ≤ 20 in the 2026-12-15 export, do a title and n-gram pass then, and nothing before.

## 4. New tools to ship today (ordered by expected impact)

Shared rules for all four: fully client-side, no network, no user input in URL/title/storage/console, kit components only, no new runtime dependencies, `npm run verify` green, shared First Load JS stays ~105 KB. Each tool follows the five "Adding a tool" steps in `CLAUDE.md`.

### 4A. Number-scale expansion: trillion, lakh crore, arab (programmatic set, +32 pages)

- **What:** three new units in the `Number scale` category of `lib/conversions.ts`: `trillion` (label "Trillions", 1e12, Tn), `lakhcrore` (label "Lakh crores", 1e12, L Cr), `arab` (label "Arab", 1e9). Pages generate from the existing pair builder, e.g. `/convert/lakh-crores-to-trillions/`, `/convert/crores-to-trillions/`, `/convert/arab-to-crores/`, `/convert/billions-to-arab/`.
- **Why:** it extends the only cluster with page-1 positions. GSC already shows "50k crore in billion", "60000 cr in billion", "25000 cr in billion": people converting budget- and market-cap-sized figures, which in India are quoted in lakh crore and compared with trillions. SERP check: "lakh crore to trillion" and "arab to crore" are held by small calculator sites (calculationcalculator.com, worksheetgenius.com, a `pages.dev` site, togetherbuying.in whose page prints 0 for every value). No strong incumbent.
- **Not in scope:** kharab, neel, padma, hundred; currency (no rupee/dollar rates, that needs a network); a new route or template. Skip pairs whose factor ratio exceeds 1e7 (thousand ↔ trillion, thousand ↔ lakh crore) so no page shows nine zeros of padding: 8 units give 56 ordered pairs, minus 4 = 52, so 32 new pages.
- **Files:** `lib/conversions.ts` (units, ratio filter in `buildPairs` for Number scale only, `WORKED_VALUES` for the three units, number-scale output never in e-notation), `test/lib/conversions.test.ts`, `test/lib/indexing.test.ts`, `test/lib/worked-examples.test.ts`. Sitemap and hub derive automatically. **Reuse:** the whole `/convert/` pipeline, `isIndexedPair`, `workedExamples`.
- **Acceptance (pure arithmetic, powers of ten):**
  - 1 lakh crore = 1 trillion; 1 trillion = 1,00,000 crore = 1,000 billion = 10,000,000 lakh.
  - 1 arab = 100 crore = 1 billion = 1,000 million; 1 lakh crore = 1,000 arab.
  - 150 crore = 1.5 billion; 4,000 crore = 40 billion; 60,000 crore = 600 billion = 0.6 trillion; 50 lakh crore = 50 trillion.
  - 1 lakh in trillions renders `0.0000001`, not `1.0000e-7`; 100 trillion in lakhs renders `1,000,000,000`.
  - `getPair('thousands-to-trillions')` is undefined; `getPair('lakh-crores-to-trillions')` is defined and indexed; every new pair has 1–6 worked examples; sitemap count equals `PAIRS.filter(isIndexedPair).length`.
  - Titles follow quick win #1 ("Lakh Crore to Trillion Converter").

### 4B. `indian-number-format` — Indian Number Format Converter (category: India)

- **What:** type a number or a phrase ("2.5 crore", "50 thousand crore", "1.5 lakh", "3.8 billion", "12345678") and see, at once: digits with Indian commas, digits with international commas, the value in lakh / crore / lakh crore, the value in thousand / million / billion / trillion, words in both systems, and the count of zeros. Copy button per row.
- **Why:** it is the tool form of the same cluster, and it catches the queries the pair pages cannot: "0.05 million" (6 impressions, position 9.5), "0.01 cr", "5 crore views in million", "2.5cr in million", "50k crore in billion", plus the "X crore in numbers / how many zeros" family. SERP check for an Indian comma/format tool returned unit converters and amount-in-words pages, no dedicated tool. Each number-scale `/convert/` page links to it (one line in `app/convert/[slug]/page.tsx`).
- **Not in scope:** currency symbols or rates, Hindi words, negative numbers, scientific notation input, more than 2 decimal places of the base unit, anything above 10^18.
- **Files:** `lib/indian-number.ts` (new: `parseAmount(text)`, `formatInternational(digits)`, `inScale(value, unit)`), `components/tools/IndianNumberFormat.tsx`, `lib/tools.ts`, `components/ToolMount.tsx`, `lib/tool-content/indian-number-format.ts` + registration in `lib/tool-content.ts`, `test/lib/indian-number.test.ts`, `test/tools/IndianNumberFormat.test.tsx`, a text canary in `test/e2e/privacy.spec.ts`. **Reuse:** `formatIndian()` and the Indian word logic in `lib/rupees.ts` (export the existing integer-to-words helper if it is internal; no behaviour change, `rupees.test.ts` stays green).
- **Acceptance** (exact strings; do the maths on digit strings or BigInt, never floats):
  - `10000000` → Indian `1,00,00,000`, international `10,000,000`, `1 crore`, `10 million`, 7 zeros.
  - `2.5 crore` → `2,50,00,000` / `25,000,000` / `250 lakh` / `25 million`.
  - `1.5 lakh` → `1,50,000` / `150,000` / `0.15 million` / `150 thousand`.
  - `50 thousand crore` and `50k crore` → `5,00,00,00,00,000` / `500,000,000,000` / `500 billion` / `0.5 lakh crore`.
  - `1 lakh crore` → `10,00,00,00,00,000` / `1,000,000,000,000` / `1 trillion`.
  - `123456789` → `12,34,56,789` / `123,456,789` / `12.3456789 crore` / `123.456789 million`.
  - `3.8 billion` → `380 crore`; `0.05 million` → `50,000` = `0.5 lakh`.
  - Accepts `lac`, `lacs`, `lakhs`, `cr`, `crores`, `mn`, `bn`, `k`, and commas in either style in the input. Empty input shows nothing; `abc`, `-5`, and values above 10^18 show a `Notice`, never `NaN`.

### 4C. `whatsapp-chat-viewer` — WhatsApp Chat Viewer & CSV Export (category: Data Tools)

- **What:** drop an exported WhatsApp chat `.txt`; see it as a searchable table (date, time, sender, message), filter by sender, see message counts per sender, download CSV or JSON.
- **Why:** it is the "personal-file converter" niche (vcf, ics, eml, gpx) applied to the most common personal export in India, and a private chat is the strongest case the site has for on-device processing. SERP check: "whatsapp chat export txt to csv" returns GitHub and PyPI scripts, Chrome extensions and one small Product Hunt tool; "whatsapp chat viewer" returns a Google Workspace add-on and a self-hosted GitHub project. No authoritative web tool. No GSC evidence yet, so this is a strategy bet, ranked below the two evidence-backed items.
- **Not in scope:** `.zip` exports (tell iOS users to unzip first), media, chat-bubble styling, PDF output, charts or word clouds, time-zone conversion (timestamps are kept as written), merging several files. Copy must say "not affiliated with WhatsApp or Meta".
- **Files:** `lib/whatsapp.ts` (new: `parseChat(text, order?)` → `{ messages, order, ambiguous }`, `chatToCsv`), `components/tools/WhatsappChatViewer.tsx`, `lib/tools.ts`, `components/ToolMount.tsx`, `lib/tool-content/whatsapp-chat-viewer.ts` + registration, `test/lib/whatsapp.test.ts`, `test/tools/WhatsappChatViewer.test.tsx`, a file canary in `fileCases` of `test/e2e/privacy.spec.ts`. **Reuse:** `toCsv()` from `lib/csv-write.ts` (its formula neutralising matters here: messages can start with `=` or `+`), the `FileDrop` / preview / download pattern of `components/tools/VcfToCsv.tsx` including its 50 MB guard.
- **Acceptance** (there is no official format spec; the line shapes below are the ones documented by the open-source parsers `whatstk`, `wc-parser` and `whatsapp-chat-parser`. Before merging, the builder must run one real Android and one real iOS export of their own through it; those files are not committed):
  - Android 12 h: `12/31/23, 10:15 PM - Alice: Hello` → date `2023-12-31`, time `22:15:00`, sender `Alice`, message `Hello`, type `text`.
  - Android 24 h, 4-digit year: `31/12/2023, 22:15 - Bob: Hi` → `2023-12-31`, `22:15:00`, `Bob`.
  - iOS: `[31/12/23, 10:15:32 PM] Alice: Hello` → `2023-12-31`, `22:15:32`. A leading U+200E and a U+202F before AM/PM are tolerated; `am`/`pm` in any case.
  - Dotted dates: `31.12.23, 22:15 - Bob: Hallo` parses the same way.
  - A line that matches no header is appended to the previous message with a newline (multi-line messages).
  - A header with no `Name: ` part (`31/12/2023, 22:15 - Messages and calls are end-to-end encrypted…`) → type `system`, empty sender.
  - `<Media omitted>`, `image omitted`, `IMG-20231231-WA0001.jpg (file attached)` and `<attached: …>` → type `media`.
  - Sender containing a colon-free phone number (`+91 98765 43210`) is kept intact in the CSV; a message `=HYPERLINK("x")` is written as `'=HYPERLINK("x")`.
  - Day/month order: any first field > 12 → day-first; any second field > 12 → month-first; otherwise day-first, `ambiguous: true`, and the UI shows a day-first / month-first toggle.
  - A file with no parsable header shows a `Notice`; nothing throws. CSV header row is `Date,Time,Sender,Message,Type`, CRLF line ends.

### 4D. `attendance-calculator` — Attendance Calculator (75% rule) (category: India)

- **What:** classes held, classes attended, required percentage (default 75, editable), optional classes remaining. Shows current percentage, how many classes you can miss and stay at the target, or how many in a row you must attend to reach it, and whether the target is still reachable in the remaining classes.
- **Why:** "75 attendance calculator" / "how many classes can I bunk" is a steady Indian student query. SERP check: page 1 is blogspot pages, `web.app` apps and small sites (onlineresult.in, speedmath.in); no strong brand. It is a two-hour build, which is why it makes the list despite the crowd of small sites; expect a trickle at best.
- **Not in scope:** per-subject timetables, saving data, per-university rule pages, condonation logic. Copy says the required percentage varies and to check the institution's own rule; if the copy names CBSE or UGC rules, the builder cites the official document it read, otherwise it names none.
- **Files:** `lib/attendance.ts` (new, pure), `components/tools/AttendanceCalculator.tsx`, `lib/tools.ts`, `components/ToolMount.tsx`, `lib/tool-content/attendance-calculator.ts` + registration, `test/lib/attendance.test.ts`, `test/tools/AttendanceCalculator.test.tsx`. No privacy canary needed (numeric inputs only). **Reuse:** kit only.
- **Acceptance** (integer arithmetic; with held `t`, attended `a`, target `p`, remaining `r`):
  - Can miss = `floor((100a − p·t) / p)` when `100a ≥ p·t`. 42 of 50 at 75 → 84%, can miss **6** (42/56 = 75%). 50 of 60 at 75 → can miss **6**. 45 of 60 at 75 → exactly 75%, can miss **0**.
  - Must attend = `ceil((p·t − 100a) / (100 − p))` otherwise. 30 of 50 at 75 → 60%, attend **30** more (60/80 = 75%). 10 of 20 at 80 → attend **30** (40/50 = 80%).
  - With remaining: must attend `k = max(0, ceil(p(t+r)/100 − a))` of the `r`. 30 of 50, 20 remaining, 75 → needs 23 of 20 → "not reachable; the best possible is 71.43%". 40 of 50, 20 remaining, 75 → attend 13, can miss 7.
  - `p = 100` with any absence → not reachable. `a > t`, negatives, non-integers, `t = 0`, `p` outside 1–100 → `Notice`, no `NaN` or `Infinity`.

## 5. Cut list and gated deferrals

**Cut outright**
- Keyword-density upgrade (section 3).
- `llms.txt`, fact-table sweep, preset deep links (section 2).
- Kindle clippings converter: Glasp already offers a free in-browser one, and volume is low.
- "N days from today" programmatic pages: the answer changes daily, a static export cannot put it in the HTML, and the SERP is full of daily-regenerated sites.
- Year-arithmetic pages ("2026 minus 1992"): Google's calculator answers them.
- Raffle / lucky-draw picker and any RNG work: stays cut from 2026-11-06.
- Title changes on pages with fewer than ~30 impressions.
- GST, salary, HRA, gratuity calculators: fintech-owned, stays cut from the niche design.

**Deferred, with a gate (re-read GSC on 2026-12-15 and 2027-01-15)**
- `kharab` unit and further scale units → any `arab` page with ≥ 10 impressions on 2026-12-15.
- Keyword-density title/n-gram pass → page average ≤ 20 on 2026-12-15.
- `llms.txt` and deep links → ≥ 10 sessions in the GA4 "AI assistants" channel in any 28 days.
- PAN validator and other ID-format validators → `aadhaar-validator` or `gstin-validator` reaching ≥ 20 impressions on 2026-12-15. Today both have zero, so cloning the pattern is unevidenced. The PAN holder-type code list must come from an Income Tax Department source, not blogs, which disagree.
- New aviation tools (holding-pattern entry, top of descent, fuel weight) → any aviation page with ≥ 20 impressions; unchanged from 2026-11-06.
- Indian document PDF-password pages (e-Aadhaar, e-PAN, bank statements) → needs a research doc of official formats first, and at least one `/photo/` page with impressions by 2027-01-15 to show the India form-help cluster indexes.
- University-specific CGPA-to-percentage pages → `attendance-calculator` ≥ 20 impressions by 2027-01-15, and official conversion notices read for each university.
- File encryption tool → `/tools/encryption/` at ≥ 50 impressions and position ≤ 20 (today 25 at 40).
- Earlier gates stay: `css-gradient` ≤ 30, METAR/TAF headline, next-cycle exam photo pages.

## Order of work today

1. Quick wins #1–#4 (one builder, about 2 hours; #1 and #4 touch the same file as 4A, so the same builder does 4A next).
2. 4A number-scale expansion.
3. 4B `indian-number-format`, 4C `whatsapp-chat-viewer`, 4D `attendance-calculator` in parallel, one builder each. They share only `lib/tools.ts`, `components/ToolMount.tsx`, `lib/tool-content.ts` and `test/e2e/privacy.spec.ts`; merge those registrations in sequence.
4. Owner: request indexing (quick win #5), Bing Webmaster Tools, unblock PerplexityBot, GA4 channel group.

## Expectation setting

By mid-December: the number-scale cluster should go from 0 to a few clicks a week, and that is the only near-certain gain. The two India tools ride the same cluster and should show impressions within two to three weeks of indexing. The WhatsApp viewer is a three-month bet. None of this changes the earlier conclusion that links and indexing, not inventory, cap the site.

## SERP sources checked 2026-11-16

- Lakh crore / trillion: calculationcalculator.com/lakh-to-trillion, togetherbuying.in/converter/crore-to-trillion, pageandbell.pages.dev/tools/convert/lakh-crore-converter, worksheetgenius.com
- Arab / kharab: calculationcalculator.com/arab-to-crore, icons.com.pk/tools/pkr-currency-converter
- WhatsApp: github.com/lucasrodes/whatstk, npmjs.com/package/wazza, docs.rs/crate/wc-parser, ruby-toolbox.com/projects/whatsapp-chat-parser, github.com/sinky/whatsapp-chat-export-viewer
- Attendance: onlineresult.in/tools/attendance-calculator, speedmath.in/tools/attendance-calculator, cgpaattendancecalculator.blogspot.com
- Kindle clippings (cut): glasp.co/kindle-clippings-converter
- PAN (deferred): taxguru.in/income-tax/permanent-account-number-pan-formation.html, arthurdejong.org python-stdnum `in_/pan.py`
