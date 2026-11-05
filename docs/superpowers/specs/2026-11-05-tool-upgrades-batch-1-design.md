# Tool upgrades, batch 1: design

Status: approved scope, for review · 2026-11-05
Source: [2026-11-05-tool-upgrades-audit.md](2026-11-05-tool-upgrades-audit.md) (items 1, 4, 5, 6, 7, 8 and cross-cutting finding 1)

## Goal

Deepen the existing tools that Search Console already shows, so they can compete with the
page-1 incumbents. The work has three parts: About/FAQ content for 10 bare tool pages, three small
upgrades (random numbers, conversion rate, date calculator) and three medium upgrades
(CSS gradient, contrast checker, METAR/TAF). No new tools, routes or registry entries.

## Global rules (apply to every section)

- **No network.** No `fetch`/XHR/WebSocket/`sendBeacon`/`EventSource`. Nothing typed by the user goes into the URL, `document.title`, storage, cookies or `console.*`. **No `localStorage` of user input.**
- **No new dependencies.** Logic that is more than trivial goes in a pure `lib/<name>.ts` helper with a Vitest suite in `test/lib/`. Components only hold state, call the helpers and compose `components/ui/kit.tsx`.
- **Bundle:** shared First Load JS stays at about 105 KB. All new code is either a per-tool chunk (imported only by its `components/tools/*.tsx`) or server-only (`lib/tool-content/*`).
- **Design:** use the Workbench tokens from `app/globals.css` (`--accent`, `--accent-tint`, `--danger(-tint)`, `--warn(-tint)`, `--fg`, `--mute`, `--line`, `--surface-soft`, `--font-mono` …) in new code, not the legacy aliases (`--acid`, `--bone`, `--ink-*`, `--muted`). Use sentence case. Don't add uppercase or letter-spaced labels.
- **Copy:** use hedged privacy wording ("runs in your browser", "processed on your device"). It must pass the `ABSOLUTE` regex in `test/lib/tool-content.test.ts`.
- **Existing tests stay green.** Where a test has to change, the plan says which one and why.

## Shared pieces: reused or new

| Piece | Where | Reused / new |
|---|---|---|
| About/FAQ rendering + JSON-LD | `components/ToolAbout.tsx`, `lib/tool-content.ts` registry, `lib/tool-content/types.ts` | **Reused** as-is |
| Content shape test | `test/lib/tool-content.test.ts` | **Reused** as-is (iterates `TOOL_CONTENT`, so new slugs are covered automatically) |
| Privacy canaries | `test/e2e/privacy.spec.ts` (text-tool slug loop) | **Reused**; three slugs added |
| Flight category | `flightCategory()` in `lib/metar.ts` | **Reused** (also for TAF periods) |
| WCAG ratio, hex parse, HSL | `lib/color-math.ts` from the parallel colour-pages plan ([2026-11-05-color-pages-design.md](2026-11-05-color-pages-design.md)), which moves ContrastChecker's maths there | **Reused.** The contrast task runs after that extraction lands. `lib/qr/contrast.ts` was considered and rejected: it uses the older 0.03928 threshold and belongs to the QR module. |

---

## 1. About/FAQ content (10 slugs)

**What:** one `lib/tool-content/<slug>.ts` per slug, registered in `lib/tool-content.ts`. The slugs are `css-gradient`,
`contrast-checker`, `sql-formatter`, `email-signature-generator`, `conversion-rate-calculator`,
`unit-converter`, `color-converter`, `image-compressor`, `image-resizer`, `merge-pdf`. All 10 are
real slugs in `lib/tools.ts`, and none has content today. Each block has 1–3 intro paragraphs, 3–6
steps and 3–6 FAQs, 300–700 words in total, with hedged privacy wording. The copy describes **only**
what the component does once this batch ships. Read the component before writing.

- Content for `css-gradient`, `contrast-checker` and `conversion-rate-calculator` is written in the same task as their feature upgrade, so it describes the new features.
- `image-compressor` / `image-resizer` content describes **today's** single-file behaviour. Their feature upgrade (batch, zip, target KB) is out of scope and will revise the copy when it ships.
- **Existing** content that this batch makes wrong is updated in the owning feature task:
  - `random-number-generator.ts`: its FAQ says decimals are not supported.
  - `date-calculator.ts`: its FAQ says there is no business-day mode.
  - `metar-decoder.ts` and `taf-decoder.ts`: their FAQ says remarks are "passed through as written".

**Not included:** new registry blurbs or keywords in `lib/tools.ts`, new category hubs, and content for any other slug.

**Files:** create 10 files under `lib/tool-content/`. Modify `lib/tool-content.ts`, `lib/tool-content/{random-number-generator,date-calculator,metar-decoder,taf-decoder}.ts`.

**Testing:** `test/lib/tool-content.test.ts` checks shape, word count and wording. No new test.

## 2. `random-number-generator`: small upgrade

**What:**
- **Numbers mode** (default) adds:
  - decimal places from 0 to 6;
  - an exclude list (numbers separated by commas, spaces or newlines);
  - sort (none, ascending or descending).
  - The existing "Unique values" toggle covers no-duplicates and keeps its label.
- **Dice mode:** 1–100 dice of d4/d6/d8/d10/d12/d20/d100, showing each roll and the total.
- **Coin mode:** 1–100 coins, showing each result and a heads/tails count.
- **Lottery mode:** neutral-format presets with no brand names: "6 from 49", "6 from 59", "5 from 69 + 1 from 26" and "5 from 50 + 2 from 12". The main numbers are unique and sorted, and the bonus numbers are drawn separately.
- **All randomness** comes from `crypto.getRandomValues`, made unbiased by rejection sampling over the full 2³² range. This also fixes the modulo bias in today's Fisher–Yates step (`buf[0] % (i + 1)`).
- **Range limit:** a range of more than 2³² values at the chosen decimal places returns an error instead of a wrong answer.

**Not included:**
- seeded or reproducible mode;
- history;
- "pick from a list";
- a "spin" animation;
- branded lottery names.

**Files:**
- New: `lib/random.ts` and `test/lib/random.test.ts`.
- Modified: `components/tools/RandomNumberGenerator.tsx`, `test/tools/RandomNumberGenerator.test.tsx` (new cases only) and `lib/tool-content/random-number-generator.ts`.

**Testing:**
- Unit tests use an injected fake random source, so rejection, dice and coin results are deterministic.
- Property tests check range, decimals, exclusion, uniqueness and sorting.
- Component tests cover each mode.

## 3. `conversion-rate-calculator`: small upgrade

**What:**
- **Solve-for modes:**
  - *Conversion rate* (default; same inputs and output as today).
  - *Visits needed*: target conversions + rate %, giving ⌈conversions × 100 / rate⌉.
  - *Conversions needed*: visits + rate %, giving ⌈visits × rate / 100⌉.
- **Optional average order value (AOV):** the existing currency select moves next to the AOV field and formats the results, which **fixes the dead select**:
  - revenue = conversions × AOV;
  - revenue per visitor = revenue / visits;
  - INR uses `en-IN` grouping (₹1,00,000.00).
- **"Compare with a previous period" toggle:** takes the previous period's conversions and visits and shows the previous rate, the current rate, the change in percentage points and the relative % change. The relative change is hidden when the previous rate is 0.

**Not included:** funnel table, statistical significance, industry benchmarks.

**Files:**
- New: `lib/conversion-rate.ts`, `test/lib/conversion-rate.test.ts` and `lib/tool-content/conversion-rate-calculator.ts`.
- Modified: `components/tools/ConversionRateCalculator.tsx` and `test/tools/ConversionRateCalculator.test.tsx` (new cases only).

**Testing:** unit tests on every solver and formatter, including float-noise cases such as 50 / 2.5 % = 2,000 exactly. The six existing component tests keep their placeholders (`e.g. 25`, `e.g. 500`) and messages.

## 4. `date-calculator`: small upgrade

**What:**
- **Calendar mode** (default) keeps today's single Amount + Unit row and adds an **"Add unit"** button for more rows. Rows apply in this order: years, then months (end-of-month clamp, as today), then weeks and days.
- **Business days mode:**
  - a number of working days;
  - a weekend choice: Saturday and Sunday (default), Friday and Saturday, or Sunday only;
  - an optional pasted holiday list. Any `YYYY-MM-DD` in the text is read. Lines with no valid date are reported.
  - The start date is not counted. Adding 0 returns the start date.
- **"Today" button** for the start date.
- **Extra output rows:**
  - day of year;
  - ISO week (`2026-W45`);
  - Unix timestamp at 00:00 UTC;
  - DD/MM/YYYY and MM/DD/YYYY.
- **Calculation:** the date maths moves into `lib/date-calc.ts` and runs entirely in UTC, so it is safe across time zones and DST.

**Not included:**
- "next N occurrences" or repeat schedules;
- built-in holiday calendars;
- countdowns;
- a business-day *difference* between two dates (that belongs to `date-difference`).

**Files:**
- New: `lib/date-calc.ts` and `test/lib/date-calc.test.ts`.
- Modified: `components/tools/DateCalculator.tsx`, `test/tools/DateCalculator.test.tsx` (new cases only) and `lib/tool-content/date-calculator.ts`.

**Testing:**
- Unit vectors (2026-11-05 is a Thursday): +1, +2 and +5 business days; each weekend option; a holiday on the next working day; subtracting; starting on a weekend; adding 0; an ISO week that rolls into the previous year (2021-01-01 → 2020-W53).
- The nine existing component tests are unchanged.

## 5. `css-gradient`: medium upgrade

**What:**
- **Stops:** any number (minimum 2), each with a colour and an optional position. Positions are typed as before (`25%`, or empty to leave the position out). "Add stop" inserts `#ffffff 50%` before the last stop, and each stop has a remove button.
- **Types:**
  - `linear` (angle);
  - `radial` (`circle`, no angle);
  - `conic` (`from <angle>`).
- **Interpolation:** Default (no clause), sRGB or OKLCH. A non-default choice puts the clause after the angle or shape (`90deg in oklch`, `circle in oklch`, `from 90deg in oklch`). The CSS output then has two `background:` lines: a fallback without the clause first, then the line with it.
- **Presets:** 8 named presets from a preset select.
- **Tailwind output:** a second panel with an arbitrary-value class, e.g. `bg-[linear-gradient(90deg,#c6f24e_0%,#1a1a2e_100%)]`. Spaces become `_`, and the space after commas is dropped.
- **Preview** as before.

**Not included:**
- a draggable stop bar;
- repeating gradients;
- text-gradient snippet;
- random button;
- hue-interpolation modes (`longer hue`);
- reordering, beyond remove and add.

**Files:**
- New: `lib/gradient.ts`, `test/lib/gradient.test.ts` and `lib/tool-content/css-gradient.ts`.
- Modified: `components/tools/CssGradient.tsx` and `test/tools/CssGradient.test.tsx`. One deliberate change: "renders a CopyButton" becomes "renders two copy buttons", because the Tailwind panel adds a second one.

**Testing:** exact CSS and Tailwind strings for each type and interpolation; preset integrity (8–12 presets, unique names, valid hex values); component tests for adding and removing stops, conic, interpolation and presets.

## 6. `contrast-checker`: medium upgrade

**What:**
- **APCA (draft).** Show the APCA Lc value (0.0.98G-4g constants) next to the WCAG 2 ratio, as `Lc 106.0`. Add a one-line guidance band (90 / 75 / 60 / 45 / 30 / 15), labelled as a draft WCAG 3 method rather than a conformance requirement.
- **Swap** button that exchanges foreground and background.
- **Non-text 3:1 badge** (WCAG 1.4.11).
- **Nearest passing foreground for AA (4.5:1).** Keep hue and saturation, step HSL lightness by 0.5 % in both directions, and pick the closest step that passes; on a tie, pick the step with the higher ratio. It appears only when AA Normal fails, with a "Use suggestion" button. When nothing passes it says so.
- **Palette matrix.** Paste up to 12 hex codes (with or without `#`, 3 or 6 digits) and get an N × N table of WCAG ratios. A cell is marked as passing at ≥ 4.5. Unreadable entries are listed by value. Empty by default.

**Not included:** colour-vision simulation, alpha/transparent foreground, shareable links, CSV export, suggestions for the background or for AAA.

**Dependency:** runs after the colour-pages plan has moved ContrastChecker's maths into `lib/color-math.ts`. The new helpers import parse, WCAG ratio and HSL from there instead of duplicating them. If `lib/color-math.ts` does not exist when this task starts, stop and ask.

**Files:**
- New: `lib/contrast.ts`, `test/lib/contrast.test.ts` and `lib/tool-content/contrast-checker.ts`.
- Modified: `components/tools/ContrastChecker.tsx` and `test/tools/ContrastChecker.test.tsx` (new cases only).

**Testing:**
- Published APCA vectors: black on white 106.04, white on black −107.88, #888 on white 63.06, white on #888 −68.54.
- Suggestion property tests: the suggestion passes, is darker for #777 on white, and is `null` when no colour can pass.
- Matrix and palette parsing.

## 7. `metar-decoder` + `taf-decoder`: medium upgrade

**What:**
- **Plain-English headline** for each METAR, built from the main body only (no trend, no remarks), next to the existing flight-category badge. Sentences:
  - wind;
  - first visibility;
  - weather;
  - all cloud and vertical-visibility layers in one sentence;
  - CAVOK;
  - temperature and dew point;
  - altimeter.
  - Example: `Wind from 310° at 15 kt, gusting 25 kt. Visibility 10 statute miles. Few at 5,000 ft, scattered at 25,000 ft. Temperature 22 °C, dew point 12 °C. Altimeter 30.02 inHg.`
- **Unit toggles:**
  - °C / °F, default °C;
  - hPa / inHg, default = the unit the report uses.
  - They change the headline and the decoded remarks. The group-by-group table is unchanged.
- **Common RMK decoding** (US remarks) in a second table under the main one: AO1, AO2, SLPppp and SLPNO, the T group, PK WND, WSHFT (± FROPA), Pnnnn, 6nnnn, 7nnnn, 1snnn, 2snnn, 5appp, `$`, TSNO, PRESRR and PRESFR. Any other token is shown as "Not decoded". The existing raw "Remarks" row in the main table stays.
- **Multi-report paste.** A new report starts at a line beginning METAR, SPECI or TAF; at a line beginning `<ICAO> <DDHHMM>Z`; after a blank line; or after a line ending in `=`. Other line breaks are continuations, which handles wrapped TAFs. Up to 20 reports are decoded, each in its own section labelled `<station> report` or `<station> forecast`.
- **TAF:**
  - each period gets its own flight category from its own visibility and ceiling;
  - a horizontal **period timeline** in UTC hours from the start of validity, with BASE/FM on one row and TEMPO/BECMG/PROB overlaid on a second row, coloured by category;
  - visible bar text is short (`FM`, `TEMPO`, `PROB30`), and the full period title is in `aria-label`/`title`;
  - month rollover: when a day number goes down, the month length is taken as the first of 31/30/29/28 that keeps the validity at or under 30 h.

**Not included:**
- local-time conversion (a TAF has no month or year, so it is ambiguous);
- density-altitude hand-off;
- visibility or wind unit toggles;
- non-US remark groups;
- fetching any report.

**Files:**
- Modified: `lib/metar.ts`, `components/tools/MetarDecoder.tsx`, `components/tools/TafDecoder.tsx`, `test/lib/metar.test.ts`, `test/tools/MetarDecoder.test.tsx`, `test/tools/TafDecoder.test.tsx` (new cases only), and `lib/tool-content/{metar-decoder,taf-decoder}.ts`.
- New exports in `lib/metar.ts`: `metarSummary`, `decodeRemarks`, `splitReports`, `tafTimeline`, and the `Units` type. `TafPeriod` gains `category`, `startRaw` and `endRaw`; adding fields keeps existing callers working.

**Testing:** exact headline strings in both unit sets, including a negative temperature and a trend that must be left out; each remark group; split rules, including a wrapped TAF; per-period categories; timeline offsets, including a month rollover and the no-validity case.

---

## Data flow (all tools)

The user types into a component, which holds the React state. The component calls a pure `lib/*.ts` function synchronously, and the result is rendered. Nothing is stored, sent or put in the URL. Content files are imported only by the server-rendered `ToolAbout`, so they add no client JS.

## Verification

- `npm run verify`: typecheck, unit tests, build.
- The build output's shared First Load JS stays at about 105 KB.
- `npm run e2e`: the privacy canaries now include `random-number-generator`, `css-gradient` and `contrast-checker`, which gain free-text inputs.
- `grep '<title>' out/tools/css-gradient/index.html` still shows the tool title.
