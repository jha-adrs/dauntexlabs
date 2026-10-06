# Light rebrand ("Workbench") — design

**Date:** 2026-10-07
**Status:** Draft, awaiting review
**Sub-project 1 of 2.** Sub-project 2 (SEO content for the high-demand tool pages + `/convert` pruning, driven by the 2026-10-07 GSC export) gets its own spec after this ships.

## Why

The site reads as a developer terminal: uppercase monospace everywhere, neon lime on near-black, a grid and grain backdrop, a ticking UTC clock and a `v0.1 // PROTOTYPE` tag. The hero sub-headline is close to invisible (`#4a4e43`-ish on `#0a0b09`). Non-developers — who are most of the people searching for PDF, image, unit and calculator tools — bounce off it, and "prototype" undermines trust.

Goal: a clean, light, friendly look that normal people can use, without looking like a generic AI-generated template.

## Decisions already made (brainstorm, 2026-10-07)

| Question | Decision |
|---|---|
| How far to go | Full rebrand: new palette, type, layout. Neon goes. |
| Direction | Bricolage Grotesque + Instrument Sans type, white background, deep-green accent, **Workbench layout** (category sidebar + dense tool grid, `/` to search). |
| Category colours | **None.** Green only; categories are distinguished by label. |
| Name | Stays **dauntexlabs** (it is the domain). |
| Theme | **Light only** for now. No dark mode, no toggle. |
| Sidebar on phones | Becomes a horizontally-scrolling chip row under the header. |
| Rollout | No feature flag. Ship directly; `git revert` is the rollback. |
| Tools | **Every tool keeps working unchanged.** No tool logic, markup or props change. Only colour values may be touched (see "Tool files"). |

## Scope

**In scope**

- `app/globals.css` — new design tokens, every section restyled.
- `app/layout.tsx` — fonts, `themeColor`, remove `Backdrop`.
- `app/icon.svg` — new favicon.
- Site frame components: header, homepage (intro + sidebar + grid), tool card, tool page template, footer.
- Convert pages, privacy page, consent banner, maintenance page — restyled via CSS; they get the new header/footer automatically.
- Inline theme-colour values in tool files (style only).
- Homepage hero copy (rewritten to be plain-English, with the privacy hedge kept).

**Out of scope**

- Any change to how a tool works.
- Dark mode.
- About/FAQ content blocks on tool pages (sub-project 2 adds both the content and their styles — not built empty here, per YAGNI).
- `/convert` pruning, sitemap changes, metadata/title changes. `<title>`, descriptions, canonicals, JSON-LD and URLs stay byte-identical so SEO is unaffected.
- Category hub pages.
- Moving styling to Tailwind utilities.

## 1. Visual system

### Tokens (`app/globals.css` `:root`)

New tokens:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | page |
| `--surface` | `#ffffff` | cards, panels, inputs |
| `--surface-soft` | `#f4f7f5` | search field, panel headers, code/output boxes, hover |
| `--fg` | `#10261b` | primary text |
| `--mute` | `#52645a` | secondary text |
| `--mute-2` | `#627168` | tertiary text, placeholders (5.15:1 on white, 4.77:1 on `--surface-soft`) |
| `--line` | `#e4ebe6` | hairline borders |
| `--line-strong` | `#cfd9d2` | visible dividers, card hover border (decorative, 1.45:1) |
| `--field-border` | `#7f9188` | input / select / textarea / toggle / checkbox boundaries (3.33:1 on white, meets WCAG 1.4.11) |
| `--accent` | `#0f7a4a` | links, primary buttons, brand, focus |
| `--accent-hover` | `#0b6640` | primary button hover |
| `--accent-tint` | `#dcf0e4` | active nav item, pills, selection |
| `--danger` | `#b42318` | errors |
| `--danger-tint` | `#fdecea` | error notice background |
| `--warn` | `#a15c07` | warnings |
| `--warn-tint` | `#fdf3e1` | warning notice background |
| `--radius` | `12px` | cards, panels |
| `--radius-sm` | `8px` | inputs, buttons |

**Legacy aliases.** Tools reference the old names 709 times (`var(--acid)`, `var(--bone)`, `var(--ink-800)`, …). Rather than edit tools, the old names are redefined to point at the new tokens, in one block marked "legacy aliases — do not use in new code":

| Old | → New |
|---|---|
| `--ink-900`, `--ink-850` | `--bg` |
| `--ink-800`, `--ink-750` | `--surface-soft` |
| `--ink-700` | `--line` |
| `--acid` | `--accent` |
| `--acid-dim` | `--accent-hover` |
| `--bone` | `--fg` |
| `--mute`, `--mute-2` | (redefined in place to the new values) |
| `--line`, `--line-soft`, `--line-strong` | (redefined in place) |

Any other legacy token found during implementation gets an alias in the same block. Contrast target: WCAG AA (4.5:1 body text, 3:1 large text and form-control boundaries). Measured: `--fg` on white 15.97:1; `--mute` 6.31:1 (5.85:1 on `--surface-soft`); `--accent` 5.38:1 on white, 4.99:1 on `--surface-soft`, 4.52:1 on `--accent-tint` (passes, just — don't lighten either); `--danger` on `--danger-tint` 5.75:1; `--warn` on `--warn-tint` 4.71:1.

The ten hardcoded `rgba(198, 242, 78, …)` values in `globals.css` are replaced with tokens or `color-mix()` on `--accent`.

### Type (`app/layout.tsx`)

- Headings, brand, card titles: **Bricolage Grotesque** (500/700/800), letter-spacing −0.02 to −0.035em on large sizes. Exposed as `--ff-display`.
- Body, controls, labels: **Instrument Sans** (400/500/600/700). Exposed as new `--ff-sans`; `body` uses it.
- Code, data, tool output: **IBM Plex Mono** (400/500) — kept, already self-hosted. `--ff-mono` unchanged.
- **Chakra Petch is removed.**
- All via `next/font/google` (self-hosted at build, no runtime request — privacy policy still holds).
- Sentence case everywhere. No `text-transform: uppercase`, no wide letter-spacing on labels. Monospace only for code/data.
- Base size 16px body, 15px controls, line-height 1.5–1.6.

### Shape and motion

- 12px radius cards/panels, 8px inputs/buttons, 999px pills/chips.
- Shadows: none, or a single `0 1px 2px rgba(16,38,27,.05)` on cards at most.
- Focus: 2px `--accent` outline with 2px offset on every interactive element (keep the existing a11y focus rule, recoloured).
- Hover: card border → `--line-strong`, title → `--accent`. No glow, no translate.

### Removed

- `components/Backdrop.tsx` (grid + vignette + grain) and its CSS; removed from `app/layout.tsx`.
- Hero `.beam`, neon glows, `text-shadow`s.
- `.reveal` staggered entrance animation (CSS + `reveal` classes and `animationDelay` styles in frame components).
- Ghost index numbers and `CODE·NNN` labels on cards and tool pages. (`CATEGORY_CODE` / `toolIndex` stay in `lib/tools.ts`; they just stop being rendered. Remove them only if nothing else imports them.)
- Status-bar readouts: `SYS N MODULES`, UTC clock, `on-device` seal, `v0.1 // PROTOTYPE`.

### Favicon / theme colour

- `app/icon.svg`: `--accent` rounded square, white lowercase "d" (or ◇ in white) — simple, readable at 16px.
- `viewport.themeColor`: `#ffffff`.

## 2. Layout

### Header — `components/SiteHeader.tsx` (replaces `StatusBar.tsx`)

Used on every page (home, tool, convert hub, convert pair, privacy, maintenance). Five import sites change from `StatusBar` to `SiteHeader`; `StatusBar.tsx` is deleted.

```
[ dauntexlabs ]  [ 🔍 Search 100+ tools…                   / ]   All tools · Conversions · Privacy
```

- Brand: "dauntex**labs**" in Bricolage, "labs" in `--accent`. Links to `/`.
- Search field, pill-shaped, `--surface-soft`. Shows a `/` key hint; pressing `/` anywhere (not while typing) focuses it — the existing handler moves here from `Hero.tsx`.
- Two modes, via optional props:
  - **Homepage** — `query` + `setQuery` passed in: controlled input, filters live (today's behaviour).
  - **Every other page** — no props: a plain `<form action="/" method="get">` with `name="q"`. Submitting goes to `/?q=…`. Works without JS.
- Right links: "All tools" (`/`), "Conversions" (`/convert/`), "Privacy" (`/privacy/`). On phones, the links hide and the search takes the full width below the brand.
- `'use client'` (for the `/` handler). Sticky at top, white with a bottom `--line` border.

### Homepage — `app/page.tsx`, `components/HomeClient.tsx`, `Hero.tsx`, `ToolDeck.tsx`

```
┌ header ───────────────────────────────────────────────────────┐
├──────────────┬────────────────────────────────────────────────┤
│ All tools 107│ Free online tools that run in your browser.    │
│ Utilities  7 │ 100+ tools for PDFs, images, text, code and     │
│ Converters16 │ everyday maths. No sign-up.                     │
│ PDF tools  5 │                                                 │
│ …            │ Utilities                                    7  │
│ (sticky)     │ [card] [card] [card]                            │
│              │ Converters                                  16  │
│              │ [card] [card] [card] …                          │
└──────────────┴────────────────────────────────────────────────┘
```

- `HomeClient` renders `SiteHeader` (with `query`/`setQuery`) so the header search drives the deck. `app/page.tsx` stops rendering the header itself. Metadata and JSON-LD stay in `app/page.tsx` unchanged.
- `HomeClient` reads `?q=` and `?cat=` once on mount (`new URLSearchParams(window.location.search)`, not `useSearchParams`, so the static export needs no Suspense boundary) and seeds state. Unknown `cat` values are ignored.
- **`Hero.tsx`** shrinks to the intro: `<h1>` + one-line lede. Search, badge and trust strip move out (search → header; trust strip → removed, the lede carries it).
- **Copy** (keeps the deliberately hedged privacy framing — no absolute "never uploads"):
  - H1: "Free online tools that run in your browser."
  - Lede: "{N}+ tools for PDFs, images, text, code and everyday maths — designed to run on your device. No sign-up."
- **`ToolDeck.tsx`**: the category `nav` becomes the sidebar — same buttons, same `active`/`setActive` state, restyled as a vertical list with counts right-aligned and the active item in `--accent-tint`. Grid sits to the right.
  - Grouped view: each category = plain heading (Bricolage, 18–20px) + count, no code, no rule line.
  - Filtered view: "{n} tools matching "{q}"" line + flat grid. Empty state: "No tools match "{q}"." plus a "Clear search" button.
  - Grid: `repeat(auto-fill, minmax(220px, 1fr))`.
- Sidebar: ~200px wide, `position: sticky` under the header, scrolls on its own if taller than the viewport.

### Tool card — `components/ToolCard.tsx`

- Category label (small, `--mute`), name (Bricolage 600–700), blurb (2 lines, `--mute`). Whole card is the link.
- Maintenance tools: "Coming soon" pill instead of nothing; card slightly muted.
- Removed: ghost index, `CODE·NNN`, "ready"/"open →" footer, `delay` prop (drop it from the interface and its two call sites).

### Tool page — `app/tools/[slug]/page.tsx`

Same layout shell as the homepage: header + sidebar + content.

- Sidebar = `components/CategoryNav.tsx`, extracted so homepage and tool pages share markup and CSS. Props: `active`, and either `onSelect` (homepage: renders `<button>`s) or nothing (tool pages: renders `<Link href="/?cat=…">`s). Tool page highlights the tool's own category.
- Content, top to bottom:
  1. Breadcrumb: "All tools › {Category} › {Tool}" (existing `crumbs`, restyled; BreadcrumbList JSON-LD unchanged).
  2. `<h1>` tool name, lede (blurb).
  3. Pills: "Runs on your device" (accent-tint), "Free", "No sign-up".
  4. Tool panel (existing `tool-console`, restyled): `--surface-soft` header strip with "Runs in your browser" on the right (the `CODE·NNN · NAME` label is dropped), white body with `<ToolMount>` — untouched.
  5. Privacy foot note (existing copy, restyled).
  6. Related conversions (pills) and "More {Category} tools" (card grid) — existing sections, new headings, no codes.
- Maintenance variant: same frame, "Under maintenance" notice in `--warn-tint`.

### Phones (< 768px)

- Sidebar turns into a single horizontally-scrolling chip row directly under the header (same `CategoryNav` markup, CSS only: `display:flex; overflow-x:auto; scroll-snap`). On tool pages it shows the same chips (links).
- Grid → 1 column (2 at ≥ 480px).
- Header: brand + search on one row if it fits, else search on its own row; right-hand links hidden (footer still has them).
- Tool panel stays full width; kit `IO` two-column layouts already collapse — verify.

### Other pages

- **Convert hub / pair pages**: new header + footer automatically. Their CSS section ("convert pages") restyled with the same tokens. No sidebar (they are not tool categories).
- **Privacy**: prose styles restyled (readable measure ~70ch, Instrument Sans).
- **Footer** (`components/Footer.tsx`): brand, "Your tool data is designed to stay on your device.", links: All tools · Conversions · Privacy · © 2026. Sentence case, no `◇`.
- **Consent banner**: white card pinned bottom with a `--line` border and small shadow; copy unchanged; "Accept analytics" = primary, "Decline" = secondary. Equal visual weight is not required but Decline must be clearly visible.

## 3. Components (the kit)

`components/ui/kit.tsx` class names and props stay **identical**; only its CSS ("tool kit", buttons, fields, toggle, segmented, layout, feedback, hash rows, file drop sections) is rewritten:

- **Button**: primary = `--accent` fill, white text; default = white with `--line-strong` border; ghost = text only. 8px radius, 38–40px height, 600 weight, sentence case.
- **TextInput / TextArea / Select**: white, `--field-border` border, 8px radius, `--accent` focus ring. Monospace only where the kit already marks a field as code/data.
- **Toggle**: green track when on.
- **Segmented**: `--surface-soft` track, white selected segment with subtle border.
- **Panel / IO**: white, `--line` border, `--radius`; panel headings in Instrument Sans 600, not uppercase.
- **Notice**: info (`--accent-tint`), warn (`--warn-tint`), error (`--danger-tint`).
- **FileDrop**: dashed `--field-border` border, `--surface-soft` on drag-over with `--accent` border.
- **Output/code blocks**: `--surface-soft` background, Plex Mono.
- Markdown preview "paper" section: already light — check it still contrasts against the new white page (add a border if it disappears).

### Tool files (style only)

Allowed changes in `components/tools/*`: replacing hardcoded **theme** colour literals with tokens. Nothing else.

- `var(--acid)` / `var(--bone)` usages: **no change needed** — handled by aliases.
- Hardcoded neon/dark literals (`rgba(198,242,78,…)`, `#c6f24e`, `#0a0b09`) in `ContrastChecker.tsx`, `RegexTester.tsx`, `TextDiff.tsx`: replace with tokens / `color-mix()` on `--accent` so highlights read on white.
- **Not changed:** colours that are tool *content*, not theme — e.g. `FileGenerators.tsx` sample-file colours, colour-picker defaults, QR black/white, contrast-checker sample swatches. These are outputs the user downloads/inspects.
- Every tool file touched is listed in the implementation PR with a one-line reason.

## 4. Data flow (search & filter)

1. User types in header search on the homepage → `setQuery` → `ToolDeck` filters (`matches()` unchanged).
2. User clicks a category in the sidebar/chip row → `setActive` → same filter.
3. On any other page, header search submits `GET /?q=…`; a sidebar category link goes to `/?cat=…`. Homepage mounts, `HomeClient` reads the params once, seeds `query`/`active`, deck renders filtered. Static export compatible; no server involved.

No other data flow changes. No new network requests. No new runtime dependencies (fonts are build-time).

## 5. Error handling / edge cases

- `?cat=` not in `CATEGORY_ORDER` → ignored, shows All.
- `?q=` with no matches → empty state with "Clear search".
- JS disabled on a tool page → header search still works (plain form); homepage shows the full grouped list (today's SSR output) but cannot filter.
- `prefers-reduced-motion`: nothing to respect any more except hover transitions; keep them ≤150ms.

## 6. Testing

- `npm run verify` (typecheck + 920 unit tests + build) must pass. No unit test references the frame components (checked), and tool tests assert behaviour, not colours, so they should pass unchanged — any failure is a regression to fix, not a test to update.
- `npm run e2e` (image tools in real Chromium) must pass. Button names in the kit don't change.
- **Bundle budget**: shared First Load JS stays ~103 KB (compare build output before/after). Fonts add CSS/woff2, not JS.
- **SEO unchanged**: diff `<title>`, `<meta name="description">`, canonical and JSON-LD for `out/index.html`, one tool page, one convert page before vs after — must be identical. Sitemap URL count unchanged (369).
- **Visual pass** with Playwright at 1280px and 390px: homepage, homepage with `?cat=PDF Tools`, homepage with `?q=pdf`, privacy, convert hub, one convert pair, and **one tool per category** (14) plus every tool file touched for colours. Look for: unreadable text, invisible borders/inputs, dark leftovers, neon leftovers, overflow on mobile.
- **Grep gates** after the change (must return nothing outside the legacy-alias block and tool-content exceptions): `Chakra`, `#c6f24e`, `198, 242, 78`, `#0a0b09`, `text-transform: uppercase`, `Backdrop`, `reveal`.
- **Contrast**: run a contrast check on `--fg`, `--mute`, `--mute-2`, `--accent` on `--bg`/`--surface-soft`, and `--accent` on `--accent-tint`.

## 7. Files

| File | Change | New / reused |
|---|---|---|
| `app/globals.css` | Tokens, aliases, every section restyled; atmosphere/reveal/status-bar CSS removed | reused |
| `app/layout.tsx` | Fonts swapped, `Backdrop` removed, `themeColor` `#ffffff` | reused |
| `app/icon.svg` | New favicon | reused |
| `components/SiteHeader.tsx` | Header with search (two modes) + `/` shortcut | **new** — replaces `StatusBar.tsx`; `StatusBar` is a readout bar with no search, cheaper to replace than bend |
| `components/StatusBar.tsx` | Deleted | — |
| `components/Backdrop.tsx` | Deleted | — |
| `components/CategoryNav.tsx` | Sidebar / mobile chip row, button or link mode | **new** — extracted from `ToolDeck`'s chip `nav` so the tool page can reuse it |
| `components/HomeClient.tsx` | Renders `SiteHeader`; seeds state from `?q=`/`?cat=` | reused |
| `components/Hero.tsx` | Reduced to h1 + lede, new copy | reused |
| `components/ToolDeck.tsx` | Uses `CategoryNav`; sidebar + grid layout; new empty state | reused |
| `components/ToolCard.tsx` | Simplified card, `delay` prop dropped | reused |
| `components/Footer.tsx` | Copy + markup simplified | reused |
| `app/page.tsx` | Stops rendering header (HomeClient does) | reused |
| `app/tools/[slug]/page.tsx` | `SiteHeader`, `CategoryNav`, restyled head/panel/related, codes dropped | reused |
| `app/convert/page.tsx`, `app/convert/[slug]/page.tsx`, `app/privacy/page.tsx` | `StatusBar` → `SiteHeader` import | reused |
| `components/ui/kit.tsx` | No change (CSS only) | reused |
| `components/tools/ContrastChecker.tsx`, `RegexTester.tsx`, `TextDiff.tsx` (+ any found in the audit) | Theme colour literals → tokens only | reused |
| `CLAUDE.md` | "Design system" section rewritten for the new system; font/Backdrop references updated | reused |

## 8. Rollout

Single branch, conventional commits, `npm run verify` + `npm run e2e` green, visual pass done. Push to `main` deploys (Cloudflare Pages) — confirm with the owner at push time. Rollback = `git revert` of the merge.
