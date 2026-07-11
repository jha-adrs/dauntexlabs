# Programmatic Conversion Pages (long-tail SEO) — Design

**Date:** 2026-07-11
**Goal:** Reach more people via organic search by capturing high-intent, exact-match
conversion queries ("kg to lbs", "png to jpg", "binary to decimal") with genuinely useful,
statically-generated pages. First lever of a 3-part growth program (**B → A → C**):
- **B (this spec):** programmatic long-tail conversion pages.
- **A (later):** deepen the 106 core tool pages (About/FAQ) + category hub pages.
- **C (later):** distribution — embeddable widgets, shareable result permalinks, OG images.

## Scope

**In (pilot, ~150–250 pages):**
- `/convert/<from>-to-<to>/` pages for three families: **unit**, **number-base**, **image format**.
- `/convert/` hub index page.
- Curated pair lists (not full cartesian) chosen for search volume + genuine table utility.

**Out (later / explicitly not now):**
- Timezone-pair, color, per-algorithm hash conversions (scale-up families, gated on pilot results).
- Any per-number pages ("2024 in roman numerals", "20% of 50") — unbounded/thin.
- On-site analytics (would violate the no-telemetry privacy promise; measure via GSC).
- Changes to the existing 106 tools beyond one optional preset prop on `ImageConverter`.

## URL & routing
- `app/convert/[pair]/page.tsx` — server component. `generateStaticParams()` enumerates the
  registry; `generateMetadata()` bakes unique title/description/canonical/OG per pair;
  `export const dynamicParams = false`.
- `app/convert/page.tsx` — hub index, grouped by family/category, links every pair.
- `trailingSlash: true` already set → `/convert/<pair>/index.html`.

## Data model — `lib/conversions.ts` (isolated; no tool refactors)
```ts
type Family = 'unit' | 'base' | 'image'
interface UnitDef { key: string; label: string; symbol: string; factor: number } // factor → category base unit
interface UnitCategory { name: string; base: string; special?: 'temperature'; units: Record<string, UnitDef> }
interface Pair {
  slug: string        // 'kilograms-to-pounds'
  family: Family
  fromKey: string; toKey: string
  category?: string   // unit sub-category ('Mass') for grouping/links
}
```
- **Unit conversion** = `v * (units[from].factor / units[to].factor)`; **temperature** via explicit
  C/F/K formulas (`special: 'temperature'`).
- **Base conversion** = `parseInt(v, fromBase).toString(toBase)` (BigInt-safe for large ints).
- **Image**: no numeric convert; page hosts the image widget preset to the target format.
- Helpers: `getPair(slug)`, `allPairs()`, `convert(pair, value)`, `formula(pair)` (human string,
  e.g. `pounds = kilograms × 2.20462`), `tableRows(pair)` (common input values → outputs).

### Curated families (final list lives in `lib/conversions.ts`)
- **Unit (~130–200 pages, both directions):** Length (mi/km/m/ft/cm/in/yd/mm/nmi), Mass
  (kg/lb/g/oz/st/tonne), Temperature (C/F/K), Data (B/KB/MB/GB/TB/Mbit), Speed (mph/km·h⁻¹/m·s⁻¹/knot),
  Volume (L/mL/gal/cup/fl-oz), Area (m²/ft²/acre/hectare), Time (s/min/h/day/week/ms).
- **Number-base (12):** binary/decimal/hexadecimal/octal, all ordered pairs.
- **Image (6):** png↔jpg, png↔webp, jpg↔webp.

## Page anatomy (anti-thin-content recipe — every page)
1. Breadcrumb `Home › Convert › <From> to <To>` (+ `BreadcrumbList` JSON-LD).
2. `<h1>Convert <From> to <To></h1>` + 1–2 sentence intro with the specific factor.
3. **Pre-set interactive widget** (instant for unit/base; upload converter for image).
4. **Live example** (`1 kg = 2.20462 lb`) + **reference table** of common values (unique per pair).
5. **Formula / how it works.**
6. **1–2 FAQ** → `FAQPage` JSON-LD.
7. **Cross-links:** reverse conversion, sibling conversions (same category), parent full tool.
A pair that cannot produce a genuine table + formula is excluded from the registry.

## Components
- `components/convert/UnitConvertWidget.tsx` (`'use client'`) — props `{ pair }`; value input →
  instant result; default example value; reuses `lib/conversions`.
- `components/convert/BaseConvertWidget.tsx` (`'use client'`) — number-base variant.
- `ImageConverter` gains one optional prop `presetFormat?` (backward-compatible, default undefined)
  so image `/convert` pages open on the right target format.
- Reuse existing kit + `ToolCard` (for sibling/cross-link cards) + existing CSS tokens.

## Internal linking & sitemap
- `/convert/` hub + every pair added to `app/sitemap.ts` (alongside the 106 tools).
- Parent tools (`unit-converter`, `number-base-converter`, `image-converter`) get a small
  "Popular conversions" link block → their `/convert` pages.
- Each pair links its reverse + same-category siblings + parent tool. (Seeds lever C.)

## SEO metadata (per page)
- `title`: "Convert <From> to <To>" (→ template `%s — dauntexlabs`).
- `description`: includes the example ("1 kilogram = 2.20462 pounds…").
- `alternates.canonical` self-referential; OpenGraph; keywords from the pair.

## Testing (existing Vitest/RTL conventions; `test/` excluded from tsconfig)
- `test/lib/conversions.test.ts` — factor/formula correctness (kg→lb ≈ 2.20462, °C→°F, mi→km 1.60934,
  hex↔dec, etc.), round-trip sanity, slug uniqueness, table generation.
- `test/convert/UnitConvertWidget.test.tsx`, `test/convert/BaseConvertWidget.test.tsx` — RTL: preset
  renders, typing a value updates the result.
- Build asserts pages generate with unique titles; full existing suite stays green.

## Measurement & validation gate
- **Google Search Console only** (Coverage + Performance) — no on-site analytics.
- **Gate:** ship pilot → monitor GSC ~2–4 weeks. Proceed to scale-up families **only if** pages
  index, gain impressions, and show no thin-content/manual actions. Fix or drop weak families first.

## Acceptance criteria
- `/convert/` hub + ~150–250 static `/convert/<pair>/` pages build under `output: export`.
- Each page has the full anatomy above + BreadcrumbList & FAQPage JSON-LD; unique title/description/canonical.
- All pages in `sitemap.xml`; parent tools link their popular conversions.
- `lib/conversions` + widget tests pass; typecheck + build + full suite green; no regression to the 106 tools.
- No new runtime dependency; no analytics added; shared bundle stays lean (widgets are tiny).

## Risks & mitigations
- **Thin content →** the recipe (widget + real table + formula + FAQ), curated high-value pairs only, exclusion rule.
- **Duplicate vs. reverse pair →** distinct primary direction, self-canonical, unique table/example; "kg to lbs" and "lbs to kg" are genuinely distinct searches.
- **Page explosion / crawl budget →** curated list + hub + internal links + sitemap.
- **Image pages can't pre-compute →** still a useful landing (preset converter + format guidance); lowest priority within the pilot.
