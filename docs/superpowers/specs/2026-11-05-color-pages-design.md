# Programmatic colour pages — design

Date: 2026-11-05 · Status: approved in chat · Plan: `docs/superpowers/plans/2026-11-05-color-pages.md`

## Why

Long-tail SEO, same play as `/convert/`: queries like "tomato color code", "slate-500 hex", "#ff6347" have clear intent and a factual answer we can compute. GSC already shows a hex query (`#c6f24e`) landing on page 1 with no dedicated page. Each page must carry data unique to its colour (formats, contrast numbers, scales, harmonies, nearest name) — no filler.

## What (and what not)

**In scope**
- One static page per unique hex at `/color/<hex>/` — lowercase 6-digit hex, no `#` (e.g. `/color/ff6347/`).
- An A–Z hub at `/color/` listing every name (CSS + Tailwind) linking to its hex page.
- Colour set: the 148 CSS named colours + the Tailwind CSS **v3** default palette (22 families × 11 shades `50…950` = 242, named `slate-500`). Tailwind `black`/`white` are not added (they duplicate CSS). Duplicate hexes (e.g. `aqua`/`cyan`, `zinc-50`/`neutral-50`, `whitesmoke`/`neutral-100`) collapse to **one** page that lists every name. Expected ≈ 370 pages.
- Each page: swatch; HEX, RGB, HSL, CMYK, OKLCH with copy buttons; contrast ratio vs white and vs black with WCAG AA/AAA (normal + large) badges; tints (10–90 % toward white) and shades (10–90 % toward black); complementary, 2 analogous (±30°), 2 triadic (±120°) — each swatch links to `/color/<hex>/` only if that hex is in the set, else plain swatch; nearest CSS colour name (OKLab distance; "exact" when it is one); copyable CSS snippet; 3–4 computed FAQs; JSON-LD `BreadcrumbList` + `FAQPage`.
- Sitemap entries for the hub and every colour page; hub linked from the footer and from the `color-converter` and `contrast-checker` tool pages.
- Extract the colour maths duplicated inside `ColorConverter.tsx` and `ContrastChecker.tsx` into one pure lib, with **no behaviour change** to those tools.

**Out of scope**
- Arbitrary hexes (no 16.7 M pages; `dynamicParams = false`), extra palettes (Material, brand colours, `#c6f24e`), an interactive picker on colour pages, OG images, Tailwind v4 OKLCH palette.
- Upgrading `ColorConverter` (CMYK/OKLCH UI etc.) — that is the tool-upgrades plan; it can import the new lib later.
- `lib/qr/contrast.ts` keeps its own luminance (it uses the older 0.03928 threshold; touching it risks QR warning behaviour).

## Where, and reused vs new

| Piece | Location | New / reused | Why there |
|---|---|---|---|
| Colour maths (parse, HSL, CMYK, OKLab/OKLCH, luminance, contrast, mix, hue rotate) | `lib/color-math.ts` | **New**, code **moved** from `components/tools/ColorConverter.tsx` + `ContrastChecker.tsx` | Pure and dependency-free; imported by the two client tools *and* the server pages. Kept separate from the data so the tools' client chunks never pull the colour tables. |
| Colour registry + per-page facts | `lib/colors.ts` | **New** | Mirrors `lib/conversions.ts` (registry + pure helpers). Imported only by server components / `app/sitemap.ts`, so the data stays out of client JS. |
| Colour page | `app/color/[slug]/page.tsx` | **New**, pattern **reused** from `app/convert/[slug]/page.tsx` | Server component, `generateStaticParams`, `generateMetadata`, `dynamicParams = false`. |
| Hub | `app/color/page.tsx` | **New**, pattern from `app/convert/page.tsx` | Static metadata + `ItemList` JSON-LD. |
| Copy buttons | `CopyButton` from `components/ui/kit.tsx` | **Reused** | The kit is already a `'use client'` module; using it from the server page makes the buttons the only client island. No new client component. |
| JSON-LD | `components/JsonLd.tsx` | **Reused** | |
| Swatch styles | `app/globals.css` (new "colour pages" section) | **New** CSS, uses existing tokens + existing `.block`, `.sec-head`, `.faq`, `.conv-links`, `.conv-chip` | Site convention: bespoke CSS in globals, no ad-hoc colours except the swatches themselves (inline `background`). |
| Sitemap | `app/sitemap.ts` | **Modified** | All routes are registered there. |
| Links | `components/Footer.tsx`, `app/tools/[slug]/page.tsx` | **Modified** | Footer already links `/convert/`; tool page already has a "Popular conversions" related block to mirror. |

Considered and rejected: a `/convert/hex-to-rgb-<x>` family inside `lib/conversions.ts` (its `Pair` model is from→to unit pairs, not one-entity pages); a new client widget per page (would ship JS for data that is static).

## Data flow

Build time only: `lib/colors.ts` builds `COLORS` (unique hexes with names) from the two tables → `generateStaticParams()` emits one route per hex → the page calls `colorFacts(hex)` (which uses `lib/color-math.ts`) and renders static HTML + JSON-LD → `app/sitemap.ts` lists the same `COLORS`. At runtime the only JS on a colour page is the shared bundle plus the kit chunk for `CopyButton` (clipboard, no network).

## Copy / SEO

- Title: CSS-named → `Tomato color code: #ff6347`; Tailwind-only → `slate-500 hex code: #64748b (Tailwind)`. Template appends `— dauntexlabs`.
- Description includes the hex, RGB and HSL strings (unique per page).
- H1: `<Primary name> — #hex`. US spelling "color" in page copy (matches queries).
- Canonical `/color/<hex>/`; all pages indexed.

## Testing

- `test/lib/color-math.test.ts` — known conversions (red → hsl(0,100%,50%), CMYK, OKLCH of red/white), contrast black/white = 21, mix and hue rotation.
- `test/lib/colors.test.ts` — counts (148 / 242), spot-checked hexes, duplicate collapse, slug format, facts, titles.
- `test/app/ColorPage.test.tsx` — static params, metadata, rendered formats/badges/links/JSON-LD, hub lists every name.
- `test/e2e/color-data.spec.ts` — real Chromium resolves every CSS name via `getComputedStyle` and must equal our table (second source for the data).
- Existing `ColorConverter.test.tsx` / `ContrastChecker.test.tsx` unchanged and passing.
- `npm run verify`; build output shows shared First Load JS still ~105 KB and no colour-table string in `out/_next/static`.
