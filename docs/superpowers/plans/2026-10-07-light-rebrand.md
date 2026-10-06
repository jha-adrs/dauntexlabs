# Light Rebrand ("Workbench") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark neon "Instrument Deck" look with a clean light "Workbench" look (white, deep green, Bricolage Grotesque + Instrument Sans, category sidebar) while every tool keeps working exactly as before.

**Architecture:** Restyle in place. `app/globals.css` is rewritten around new tokens, and the old token names (`--acid`, `--bone`, `--ink-*`, …) become aliases so the 106 tool components recolour with zero edits. Only the site frame (header, homepage, card, tool page template, footer) gets new markup; two small shared components are added (`SiteHeader`, `CategoryNav`). Kit class names stay identical.

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, plain CSS in `app/globals.css` (Tailwind v4 import kept, barely used), `next/font/google`, Vitest + RTL (jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-07-light-rebrand-design.md`

## Global Constraints

- No tool **logic, markup or props** change in `components/tools/*`. The only allowed edit there is swapping a theme colour literal for a token (Task 6 lists every one).
- `components/ui/kit.tsx` is not edited. Its class names are the contract; only their CSS changes.
- Light only. No dark mode, no theme toggle, no `prefers-color-scheme` rules.
- Green only: no per-category colours.
- Name stays `dauntexlabs`.
- `<title>`, meta description, canonical, OpenGraph, JSON-LD and URLs stay byte-identical. Sitemap URL count stays 369.
- Privacy copy stays hedged ("designed to run on your device"). Never write "never uploads" / "nothing leaves".
- No new runtime dependencies. Shared First Load JS stays ~103 KB.
- No network requests added. Fonts self-hosted via `next/font`.
- Sentence case in all new UI copy. No `text-transform: uppercase`, no letter-spaced labels. Monospace only for code/data.
- Token values (verbatim from spec): `--bg #ffffff`, `--surface #ffffff`, `--surface-soft #f4f7f5`, `--fg #10261b`, `--mute #52645a`, `--mute-2 #627168`, `--line #e4ebe6`, `--line-strong #cfd9d2`, `--field-border #7f9188`, `--accent #0f7a4a`, `--accent-hover #0b6640`, `--accent-tint #dcf0e4`, `--danger #b42318`, `--danger-tint #fdecea`, `--warn #a15c07`, `--warn-tint #fdf3e1`, `--radius 12px`, `--radius-sm 8px`.
- Conventional commits.
- Pushing to `main` deploys (Cloudflare Pages). Do not push without the owner's go-ahead at push time.

## Review Focus

1. **Light text on light background via aliases.** A tool that used `var(--ink-900)` / `var(--ink-850)` as a *text* colour would turn white-on-white. Expected: every tool's text is readable. → Task 7 visual sweep flags it; Task 1 Step 1 greps for `color: … var(--ink-` first.
2. **Pastel status colours tuned for dark backgrounds** (`#f87171`, `#60a5fa`, `#fb923c`, `#f0c040`, `#8ab4f8`, …) become unreadable on white. Expected: error/warning/info text meets contrast. → Task 6 swaps every one found; Task 7 sweep checks the rest.
3. **`/` shortcut while typing in a rich editor** (Markdown to PDF and any `contenteditable`). Expected: typing `/` types a slash, does not jump to search. → Task 2 test `ignores "/" inside a contenteditable editor`.
4. **Enter in the homepage search box.** The header search is a real `<form action="/">`; on the homepage, pressing Enter must not reload the page and lose state. → Task 2 test `homepage mode does not submit the form`.
5. **Phone layout overflow.** The horizontal category chip row or long tool UIs must not make the whole page scroll sideways at 390px. → Task 7 sweep reports any page where `scrollWidth > innerWidth`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `app/globals.css` | All styling: tokens, legacy aliases, frame, kit, convert, prose, consent | 1 |
| `app/layout.tsx` | Fonts, `themeColor`, root shell (no `Backdrop`) | 1 |
| `app/icon.svg` | Favicon | 1 |
| `components/Backdrop.tsx` | **Deleted** | 1 |
| `components/SiteHeader.tsx` | **New.** Brand, search (homepage-controlled or plain GET form), site links, `/` shortcut | 2 |
| `components/StatusBar.tsx` | **Deleted** | 2 |
| `components/CategoryNav.tsx` | **New.** Category list: buttons (homepage) or links to `/?cat=` (other pages) | 3 |
| `components/HomeClient.tsx` | Homepage state, seeds from `?q=`/`?cat=`, renders header + workbench | 3 |
| `components/Hero.tsx` | Intro h1 + lede only | 3 |
| `components/ToolDeck.tsx` | Result line, empty state, grouped/flat grids | 3 |
| `components/ToolCard.tsx` | Simplified card | 3 |
| `app/page.tsx` | Metadata + JSON-LD; renders `HomeClient` + `Footer` | 3 |
| `app/tools/[slug]/page.tsx` | Tool page frame (live + maintenance) | 4 |
| `components/Footer.tsx` | Footer | 4 |
| `components/ToolMount.tsx` | Loading text only | 4 |
| `components/ConsentBanner.tsx` | Button text casing only | 4 |
| `lib/tools.ts` | Remove `CATEGORY_CODE` + `toolIndex` once unused | 4 |
| `app/convert/page.tsx`, `app/convert/[slug]/page.tsx`, `app/privacy/page.tsx` | `SiteHeader` import + glyph/code-label cleanup | 5 |
| `components/tools/{TextDiff,RegexTester,ContrastChecker,QuadraticSolver,JsonDiff,RoasCalculator,RoiCalculator,JwtTool,SerpPreview,BmiCalculator}.tsx` | Theme colour literals → tokens | 6 |
| `test/tools/TextDiff.test.tsx` | Colour assertion follows the token | 6 |
| `test/frame/*.test.tsx` | **New.** Frame behaviour tests | 2, 3 |
| `CLAUDE.md` | Design-system section | 7 |

---

### Task 0: Baseline snapshot (before any change)

**Files:** none committed. Output to `.superpowers/baseline/` (gitignored).

- [ ] **Step 1: Build main and save SEO-relevant head tags + bundle size**

```bash
cd /Users/adarshjha/claude-projects/super-tool
mkdir -p .superpowers/baseline
npm run build > .superpowers/baseline/build.txt 2>&1
grep -E "First Load JS shared by all" -A0 .superpowers/baseline/build.txt
for f in index tools/jwt-tool/index tools/keyword-density/index tools/pdf-to-images/index convert/index convert/kilometers-to-miles/index privacy/index; do
  grep -oE '<title>[^<]*</title>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>|<meta property="og:[^"]*"[^>]*>|<script type="application/ld\+json">[^<]*</script>' "out/$f.html" > ".superpowers/baseline/$(echo $f | tr / _).head"
done
grep -c '<url>' out/sitemap.xml > .superpowers/baseline/sitemap-count.txt
cat .superpowers/baseline/sitemap-count.txt
```

Expected: build succeeds; sitemap count `369`; note the "First Load JS shared by all" number.

---

### Task 1: Visual system — tokens, aliases, fonts, full stylesheet

**Files:**
- Modify: `app/globals.css` (full rewrite)
- Modify: `app/layout.tsx`
- Modify: `app/icon.svg`
- Delete: `components/Backdrop.tsx`

**Interfaces:**
- Produces (CSS classes later tasks' markup relies on): `.site-header`, `.site-header-row`, `.brand`, `.site-search`, `.site-search-kbd`, `.site-search-clear`, `.site-links`, `.workbench`, `.workbench-main`, `.cat-nav`, `.cat-nav-item` (+`.active`), `.hero`, `.deck`, `.deck-results`, `.empty`, `.cat-group`, `.cat-head`, `.deck-grid`, `.card`, `.card-cat`, `.soon-pill`, `.tool-page`, `.crumbs`, `.tool-meta`, `.pill` (+`.accent`), `.tool-console*`, `.tool-foot-note`, `.related`, `.related-title`, `.maintenance*`, `.footer`, `.foot-row`, `.foot-note`, `.foot-meta`, `.foot-link`. Font CSS vars `--ff-display`, `--ff-sans`, `--ff-mono`.

- [ ] **Step 1: Pre-check — no tool uses an ink token as a text colour**

```bash
grep -rnE "color: ?'?var\(--ink-(9|8|7)[0-9]*" components app | grep -v background
```

Expected: no output. If anything prints, add that file to Task 6's list with the change `var(--ink-…)` → `var(--fg)` (text) and continue.

- [ ] **Step 2: Replace `app/globals.css` with the new stylesheet**

Write the file with exactly these sections, in this order. (`.md-preview` is copied unchanged from the current file except its first rule.)

```css
@import 'tailwindcss';

/* ============================================================
   dauntexlabs — "Workbench" (light)
   white surfaces · deep-green accent · category sidebar
   Headings: Bricolage Grotesque / UI: Instrument Sans / data: IBM Plex Mono
   ============================================================ */

:root {
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-soft: #f4f7f5;
  --fg: #10261b;
  --mute: #52645a;
  --mute-2: #627168;
  --line: #e4ebe6;
  --line-strong: #cfd9d2;
  --field-border: #7f9188;
  --accent: #0f7a4a;
  --accent-hover: #0b6640;
  --accent-tint: #dcf0e4;
  --danger: #b42318;
  --danger-tint: #fdecea;
  --warn: #a15c07;
  --warn-tint: #fdf3e1;
  --radius: 12px;
  --radius-sm: 8px;
  --header-h: 64px;

  /* --ff-* are provided by next/font (self-hosted); literal names are fallbacks. */
  --font-display: var(--ff-display, 'Bricolage Grotesque'), system-ui, sans-serif;
  --font-sans: var(--ff-sans, 'Instrument Sans'), system-ui, sans-serif;
  --font-mono: var(--ff-mono, 'IBM Plex Mono'), ui-monospace, 'SFMono-Regular', monospace;

  /* legacy aliases — tool components still reference these; do not use in new code */
  --ink-900: var(--bg);
  --ink-850: var(--surface-soft);
  --ink-800: var(--surface-soft);
  --ink-750: var(--surface-soft);
  --ink-700: var(--line);
  --ink-500: var(--mute);
  --ink-400: var(--mute);
  --ink-300: var(--mute);
  --acid: var(--accent);
  --acid-dim: var(--accent-hover);
  --bone: var(--fg);
  --muted: var(--mute);
  --line-soft: var(--line);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: calc(var(--header-h) + 12px); }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
a { color: inherit; text-decoration: none; }
::selection { background: var(--accent-tint); color: var(--fg); }
h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.02em; color: var(--fg); }
code, kbd, pre, samp { font-family: var(--font-mono); }

.shell { width: 100%; max-width: 1320px; margin: 0 auto; padding-inline: 24px; }
.lede { max-width: 62ch; color: var(--mute); font-size: 17px; line-height: 1.6; }
.em, .caret { color: var(--accent); }

a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible,
textarea:focus-visible, summary:focus-visible, .card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ---- header -------------------------------------------------------- */
.site-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--line);
}
.site-header-row { display: flex; align-items: center; gap: 20px; height: var(--header-h); }
.brand { font-family: var(--font-display); font-weight: 800; font-size: 19px; letter-spacing: -0.03em; color: var(--fg); white-space: nowrap; }
.brand b { color: var(--accent); font-weight: 800; }
.brand.sm { font-size: 17px; }
.site-search {
  flex: 1; max-width: 560px; display: flex; align-items: center; gap: 10px;
  height: 42px; padding: 0 14px;
  background: var(--surface-soft); border: 1px solid transparent; border-radius: 999px;
  transition: border-color .15s, background .15s, box-shadow .15s;
}
.site-search:focus-within { background: var(--surface); border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
.site-search svg { width: 17px; height: 17px; color: var(--mute); flex: none; }
.site-search input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; font: inherit; font-size: 15px; color: var(--fg); }
.site-search input:focus-visible { outline: none; }
.site-search input::placeholder { color: var(--mute-2); }
.site-search-kbd { font-family: var(--font-mono); font-size: 12px; color: var(--mute); border: 1px solid var(--line-strong); border-radius: 5px; padding: 0 6px; background: var(--surface); }
.site-search-clear { border: 0; background: none; color: var(--mute); cursor: pointer; padding: 4px; font-size: 13px; }
.site-search-clear:hover { color: var(--fg); }
.site-links { margin-left: auto; display: flex; gap: 20px; font-size: 15px; color: var(--mute); }
.site-links a:hover { color: var(--accent); }

/* ---- workbench layout (sidebar + main) ----------------------------- */
.workbench { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 40px; align-items: start; }
.workbench-main { min-width: 0; }
.tool-page, .workbench { padding-top: 28px; padding-bottom: 64px; }
.cat-nav { position: sticky; top: calc(var(--header-h) + 20px); max-height: calc(100vh - var(--header-h) - 40px); overflow-y: auto; }
.cat-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.cat-nav-item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 8px 12px; border: 0; border-radius: var(--radius-sm);
  background: none; font: inherit; font-size: 15px; color: var(--mute); text-align: left; cursor: pointer;
  transition: background .15s, color .15s;
}
.cat-nav-item:hover { background: var(--surface-soft); color: var(--fg); }
.cat-nav-item em { font-style: normal; font-size: 13px; color: var(--mute-2); }
.cat-nav-item.active { background: var(--accent-tint); color: var(--accent); font-weight: 600; }
.cat-nav-item.active em { color: var(--accent); }

/* ---- hero + deck --------------------------------------------------- */
.hero h1 { font-weight: 800; font-size: clamp(30px, 4vw, 44px); line-height: 1.05; letter-spacing: -0.035em; margin: 0; max-width: 22ch; }
.hero .lede { margin: 12px 0 0; }
.deck-results { margin: 28px 0 14px; font-size: 15px; color: var(--mute); }
.deck-results b { color: var(--fg); font-weight: 600; }
.empty { margin: 32px 0; color: var(--mute); font-size: 16px; }
.empty p { margin: 0 0 12px; }
.cat-group { margin-top: 40px; }
.cat-head { display: flex; align-items: baseline; gap: 10px; margin: 0 0 14px; }
.cat-head h2 { font-size: 20px; font-weight: 700; margin: 0; }
.cat-head .count { font-size: 14px; color: var(--mute-2); }
.cat-head .code, .cat-head .rule, .sec-head .code, .sec-head .rule, .tool-head .idx, .consent-mark { display: none; }
.deck-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }

/* ---- card ---------------------------------------------------------- */
.card {
  display: flex; flex-direction: column; gap: 4px; padding: 16px 18px;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  transition: border-color .15s, box-shadow .15s;
}
.card:hover { border-color: var(--line-strong); box-shadow: 0 1px 2px rgba(16, 38, 27, .05); }
.card:hover h3 { color: var(--accent); }
.card-cat { font-size: 13px; color: var(--mute-2); }
.card h3 { font-size: 17px; font-weight: 700; line-height: 1.25; margin: 2px 0 0; transition: color .15s; }
.card p { margin: 0; font-size: 14.5px; line-height: 1.45; color: var(--mute); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card.is-soon { background: var(--surface-soft); }
.soon-pill { align-self: flex-start; margin-top: 8px; font-size: 12.5px; font-weight: 600; color: var(--warn); background: var(--warn-tint); border-radius: 999px; padding: 2px 10px; }

/* ---- tool page ----------------------------------------------------- */
.tool-page h1, .tool-missing h1 { font-weight: 800; font-size: clamp(28px, 3.6vw, 40px); line-height: 1.08; letter-spacing: -0.03em; margin: 10px 0 8px; }
.tool-missing { padding: 80px 0; }
.tool-page .lede { margin: 0; }
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; color: var(--mute); }
.crumbs a:hover { color: var(--accent); }
.crumbs .sep { color: var(--mute-2); }
.crumbs .crumb-here { color: var(--fg); }
.tool-head { display: flex; gap: 10px; margin: 10px 0 0; font-size: 14px; color: var(--mute); }
.cat { font-size: 14px; color: var(--mute); }
.tool-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.pill { font-size: 13px; font-weight: 500; color: var(--mute); background: var(--surface-soft); border-radius: 999px; padding: 4px 12px; }
.pill.accent, .pill.acid { color: var(--accent); background: var(--accent-tint); }
.tool-console { margin-top: 24px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.tool-console-head {
  display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  padding: 9px 18px; background: var(--surface-soft); border-bottom: 1px solid var(--line);
  border-radius: var(--radius) var(--radius) 0 0; font-size: 13px; color: var(--mute);
}
.tool-console-head .lbl { margin-right: auto; color: var(--mute); }
.tool-console-body { padding: 22px; }
.tool-console-body > .tool { margin-top: 0; }
.tool { margin-top: 24px; }
.tool-foot-note { margin-top: 16px; font-size: 14px; color: var(--mute); }
.tool-foot-note a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.ready { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; color: var(--mute); }
.ready .d { display: none; }
.related { margin-top: 48px; }
.related-title { font-size: 20px; font-weight: 700; margin: 0 0 14px; }
.back { display: inline-block; margin-top: 16px; font-size: 15px; color: var(--accent); }
.back:hover { text-decoration: underline; }
.tool-loading { padding: 40px; border: 1px dashed var(--line-strong); border-radius: var(--radius); color: var(--mute); font-size: 15px; }

/* ---- footer -------------------------------------------------------- */
.footer { border-top: 1px solid var(--line); background: var(--surface-soft); padding: 28px 0 40px; }
.foot-row { display: flex; align-items: center; justify-content: space-between; gap: 16px 24px; flex-wrap: wrap; }
.foot-note { margin: 0; color: var(--mute); font-size: 14px; }
.foot-meta { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; font-size: 14px; color: var(--mute-2); }
.foot-link { color: var(--mute); }
.foot-link:hover { color: var(--accent); }

/* ---- convert pages ------------------------------------------------- */
.block { margin-top: 44px; }
.sec-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; }
.sec-head h2 { font-size: 20px; font-weight: 700; margin: 0; }
.sec-head .count { font-size: 14px; color: var(--mute-2); }
.conv-formula { font-family: var(--font-mono); font-size: 15px; color: var(--fg); background: var(--surface-soft); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: var(--radius-sm); padding: 14px 16px; margin: 0; }
.conv-table { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); max-width: 460px; overflow: hidden; }
.conv-table-h { display: grid; grid-template-columns: 1fr 1fr; padding: 10px 16px; background: var(--surface-soft); border-bottom: 1px solid var(--line); font-size: 13px; font-weight: 600; color: var(--mute); }
.conv-table-r { display: grid; grid-template-columns: 1fr 1fr; padding: 9px 16px; font-family: var(--font-mono); font-size: 14px; color: var(--fg); }
.conv-table-r + .conv-table-r { border-top: 1px solid var(--line); }
.conv-table-r span:last-child { color: var(--accent); }
details.faq { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); margin-bottom: 8px; }
details.faq summary { list-style: none; cursor: pointer; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 16px; font-weight: 500; color: var(--fg); }
details.faq summary::-webkit-details-marker { display: none; }
details.faq summary .plus { color: var(--accent); font-family: var(--font-mono); transition: transform .2s; }
details.faq[open] summary .plus { transform: rotate(45deg); }
details.faq .ans { padding: 0 16px 16px; color: var(--mute); font-size: 15px; line-height: 1.65; max-width: 74ch; }
.cw-row { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.cw-field { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 200px; }
.cw-cap { font-size: 14px; font-weight: 600; color: var(--fg); }
.cw-input { background: var(--surface); border: 1px solid var(--field-border); border-radius: var(--radius-sm); color: var(--fg); font-family: var(--font-mono); font-size: 20px; padding: 12px 14px; outline: none; transition: border-color .15s, box-shadow .15s; }
.cw-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
.cw-eq { font-family: var(--font-display); font-size: 24px; color: var(--mute-2); padding-bottom: 12px; }
.cw-out { font-family: var(--font-mono); font-size: 20px; color: var(--accent); background: var(--surface-soft); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 12px 14px; min-height: 52px; word-break: break-all; }
.cw-out.err { color: var(--danger); font-size: 15px; }
.cw-actions { margin-top: 14px; }
.conv-links { display: flex; flex-wrap: wrap; gap: 8px; }
.conv-chip { font-size: 14px; color: var(--fg); border: 1px solid var(--line); background: var(--surface); border-radius: 999px; padding: 6px 14px; transition: border-color .15s, color .15s; }
.conv-chip:hover { color: var(--accent); border-color: var(--accent); }
.conv-chip.rev { color: var(--accent); border-color: var(--line-strong); }
.conv-chip.parent { background: var(--surface-soft); }
@media (max-width: 560px) { .cw-eq { display: none; } .cw-field { min-width: 100%; } }

/* ---- markdown preview (light "paper") ----------------------------- */
/* copy every .md-preview rule from the old file unchanged, except: */
.md-preview { background: #fff; color: #1a1a1a; padding: 26px 30px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); font-family: Georgia, 'Times New Roman', serif; line-height: 1.65; max-height: 560px; overflow: auto; }
/* …remaining .md-preview rules (h1–h4, p, a, code, pre, blockquote, ul/ol, li, table, th/td, img, hr) verbatim… */

/* ---- tool kit: buttons --------------------------------------------- */
.btn {
  display: inline-block; text-align: center; font-family: var(--font-sans); font-size: 14.5px; font-weight: 600; line-height: 1.3;
  padding: 9px 16px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--fg); cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.btn::first-letter, .segmented button::first-letter, .field-label::first-letter, .panel-title::first-letter, .filedrop-label::first-letter { text-transform: uppercase; }
.btn:hover:not(:disabled) { border-color: var(--field-border); background: var(--surface-soft); }
.btn:active:not(:disabled) { transform: translateY(1px); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); color: #fff; }
.btn-ghost { border-color: transparent; background: transparent; color: var(--accent); }
.btn-ghost:hover:not(:disabled) { background: var(--accent-tint); border-color: transparent; }
.btn-danger:hover:not(:disabled) { border-color: var(--danger); color: var(--danger); background: var(--danger-tint); }
.btn-sm { padding: 5px 12px; font-size: 13.5px; }

/* ---- tool kit: fields ---------------------------------------------- */
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { display: block; font-size: 14px; font-weight: 600; color: var(--fg); }
.field-hint { font-size: 13px; color: var(--mute-2); }
.ta, .inp, .sel {
  width: 100%; background: var(--surface); border: 1px solid var(--field-border); border-radius: var(--radius-sm);
  color: var(--fg); font-family: var(--font-sans); font-size: 15px; line-height: 1.5; padding: 10px 12px;
  outline: none; transition: border-color .15s, box-shadow .15s; resize: vertical;
}
.ta.mono { font-family: var(--font-mono); font-size: 14px; font-variant-ligatures: none; tab-size: 2; }
.ta::placeholder, .inp::placeholder { color: var(--mute-2); }
.ta:focus, .inp:focus, .sel:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
.ta[readonly] { background: var(--surface-soft); }
.sel {
  appearance: none; cursor: pointer; padding-right: 38px;
  background-image: linear-gradient(45deg, transparent 50%, var(--mute) 50%), linear-gradient(135deg, var(--mute) 50%, transparent 50%);
  background-position: calc(100% - 18px) center, calc(100% - 13px) center;
  background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;
}

/* ---- tool kit: toggle / segmented ---------------------------------- */
.toggle { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-size: 15px; color: var(--fg); user-select: none; }
.toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-box { width: 38px; height: 22px; border: 1px solid var(--field-border); border-radius: 999px; background: var(--surface); position: relative; flex-shrink: 0; transition: background .15s, border-color .15s; }
.toggle-box::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--field-border); transition: transform .15s, background .15s; }
.toggle input:checked + .toggle-box { background: var(--accent); border-color: var(--accent); }
.toggle input:checked + .toggle-box::after { transform: translateX(16px); background: #fff; }
.toggle input:focus-visible + .toggle-box { outline: 2px solid var(--accent); outline-offset: 2px; }
.segmented { display: inline-flex; gap: 2px; padding: 3px; background: var(--surface-soft); border: 1px solid var(--line); border-radius: var(--radius-sm); }
.segmented button { display: inline-block; font-family: var(--font-sans); font-size: 14px; font-weight: 500; padding: 6px 14px; background: transparent; border: 1px solid transparent; border-radius: 6px; color: var(--mute); cursor: pointer; transition: background .15s, color .15s; }
.segmented button:hover { color: var(--fg); }
.segmented button.on { background: var(--surface); border-color: var(--line-strong); color: var(--fg); font-weight: 600; box-shadow: 0 1px 2px rgba(16, 38, 27, .06); }

/* ---- tool kit: layout ---------------------------------------------- */
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 18px; }
.tool-io { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.panel { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); display: flex; flex-direction: column; min-width: 0; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 14px; background: var(--surface-soft); border-bottom: 1px solid var(--line); border-radius: var(--radius) var(--radius) 0 0; }
.panel-title { font-size: 14px; font-weight: 600; color: var(--fg); }
.panel-actions { display: flex; gap: 8px; }
.panel-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.panel-body .ta { border: none; background: transparent; padding: 0; border-radius: 0; }
.panel-body .ta:focus { box-shadow: none; }

/* ---- tool kit: feedback -------------------------------------------- */
.notice { font-size: 14.5px; line-height: 1.5; padding: 10px 14px; border: 1px solid var(--line); border-left-width: 3px; border-radius: var(--radius-sm); background: var(--surface-soft); color: var(--fg); }
.notice.info { border-left-color: var(--accent); }
.notice.error { border-color: #f5c2bd; border-left-color: var(--danger); background: var(--danger-tint); color: var(--danger); }
.notice.success { border-color: #b9e0c9; border-left-color: var(--accent); background: var(--accent-tint); color: var(--accent-hover); }
.hint-inline { font-size: 13px; color: var(--mute-2); }
.hash-row { display: grid; grid-template-columns: 86px 1fr auto; align-items: center; gap: 14px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 10px 14px; }
.hash-algo { font-size: 13px; font-weight: 600; color: var(--accent); }
.hash-hex { font-family: var(--font-mono); font-size: 13px; color: var(--fg); word-break: break-all; line-height: 1.5; }
@media (max-width: 720px) { .tool-io { grid-template-columns: 1fr; } .hash-row { grid-template-columns: 1fr; gap: 8px; } }

/* ---- file drop / chips --------------------------------------------- */
.filedrop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 2px dashed var(--field-border); border-radius: var(--radius); background: var(--surface-soft); padding: 40px 20px; cursor: pointer; text-align: center; transition: border-color .15s, background .15s; }
.filedrop:hover, .filedrop.over { border-color: var(--accent); background: var(--accent-tint); }
.filedrop-icon { font-size: 26px; color: var(--accent); }
.filedrop-label { font-size: 16px; font-weight: 600; color: var(--fg); }
.filedrop-hint { font-size: 13.5px; color: var(--mute); }
.filechip { display: flex; align-items: center; gap: 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 8px 12px; }
.filechip-thumb { width: 40px; height: 40px; object-fit: cover; border: 1px solid var(--line); border-radius: 6px; background: var(--surface-soft); }
.filechip-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.filechip-name { font-size: 14px; color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filechip-meta { font-size: 12.5px; color: var(--mute-2); }
.filechip-x { background: none; border: none; color: var(--mute); cursor: pointer; font-size: 13px; padding: 4px; }
.filechip-x:hover { color: var(--danger); }

/* ---- maintenance --------------------------------------------------- */
.maintenance { margin-top: 24px; border: 1px solid #f3dcb0; border-radius: var(--radius); background: var(--warn-tint); padding: 24px 28px; }
.maintenance-tag { font-size: 14px; font-weight: 600; color: var(--warn); }
.maintenance p { color: var(--fg); max-width: 60ch; margin: 10px 0 6px; }

/* ---- consent banner ------------------------------------------------ */
.consent { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 80; max-width: 1100px; margin: 0 auto; background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--radius); box-shadow: 0 8px 30px rgba(16, 38, 27, .12); }
.consent-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-block: 16px; }
.consent-text { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--mute); max-width: 78ch; }
.consent-text b { color: var(--fg); font-weight: 600; }
.consent-link { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.consent-actions { display: flex; gap: 10px; flex-shrink: 0; }
@media (max-width: 640px) { .consent-row { flex-direction: column; align-items: flex-start; gap: 14px; } }

/* ---- prose (policy / docs) ----------------------------------------- */
.prose { margin-top: 28px; max-width: 70ch; }
.prose h2 { font-size: 21px; font-weight: 700; margin: 34px 0 10px; }
.prose p { color: var(--mute); font-size: 16px; line-height: 1.7; margin: 0 0 10px; }
.prose code { color: var(--fg); background: var(--surface-soft); border-radius: 4px; padding: .1em .35em; font-size: .9em; }
.prose a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }

/* ---- motion -------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; scroll-behavior: auto !important; }
}

/* ---- responsive ---------------------------------------------------- */
@media (max-width: 900px) {
  .workbench { grid-template-columns: minmax(0, 1fr); gap: 16px; padding-top: 12px; }
  .cat-nav { position: static; max-height: none; overflow: visible; margin-inline: -24px; padding: 4px 24px 12px; border-bottom: 1px solid var(--line); }
  .cat-nav ul { flex-direction: row; gap: 8px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; }
  .cat-nav ul::-webkit-scrollbar { display: none; }
  .cat-nav li { flex: none; scroll-snap-align: start; }
  .cat-nav-item { width: auto; white-space: nowrap; border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; font-size: 14px; }
  .cat-nav-item.active { border-color: var(--accent); }
  .site-links { display: none; }
  .site-search { max-width: none; }
}
@media (max-width: 560px) {
  .shell { padding-inline: 16px; }
  .cat-nav { margin-inline: -16px; padding-inline: 16px; }
  .site-header-row { gap: 12px; }
  .brand { font-size: 17px; }
  .site-search-kbd { display: none; }
  .tool-console-body { padding: 14px; }
  .lede { font-size: 16px; }
}
```

The two comment lines inside the markdown-preview section are instructions: paste the remaining `.md-preview …` rules (old lines 994–1081) verbatim, then delete those two comment lines.

Removed vs the old file (do not carry over): `.backdrop`, `.grain`, `.display`, `.eyebrow`, `.statusbar`, `.readout`, `.ro*`, `.seal`, `@keyframes pulse/sweep/rise`, `.hero .beam`, `.prompt*`, `.hero-trust*`, `.chips`, `.chip*`, `.ghost`, `.card::before`, `.card-top`, `.idx`, `.foot`, `.open`, `.tool-stage*`, `.kv*`, `.reveal`, `.stats*`, `.foot-sep`.

- [ ] **Step 3: Swap fonts, theme colour and drop `Backdrop` in `app/layout.tsx`**

Replace lines 1–30 (imports through `viewport`) with:

```tsx
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google'
import ConsentBanner from '@/components/ConsentBanner'
import Analytics from '@/components/Analytics'
import './globals.css'

const SITE = 'https://dauntexlabs.com'

// Self-hosted at build time — no runtime request to Google. Exposed as CSS vars
// consumed by --font-display / --font-sans / --font-mono in globals.css.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--ff-display',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--ff-sans',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--ff-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
})

export const viewport: Viewport = {
  themeColor: '#ffffff',
}
```

Replace the `RootLayout` body with:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  )
}
```

`metadata` is untouched.

- [ ] **Step 4: Favicon and delete Backdrop**

`app/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#0f7a4a" />
  <text x="16" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="#ffffff">d</text>
</svg>
```

```bash
git rm components/Backdrop.tsx
```

- [ ] **Step 5: Build and run unit tests**

Run: `npm run build && npm test`
Expected: build succeeds (frame still uses old markup — it will look unstyled in places; that is fixed by Tasks 2–5); all tests pass. If `Bricolage_Grotesque` rejects the `weight` array, switch to `weight: 'variable'` and rebuild.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx app/icon.svg
git commit -m "feat(design): light Workbench tokens, legacy aliases, new fonts"
```

---

### Task 2: `SiteHeader` replaces `StatusBar`

**Files:**
- Create: `components/SiteHeader.tsx`
- Create: `test/frame/SiteHeader.test.tsx`
- Delete: `components/StatusBar.tsx`
- Modify: `app/tools/[slug]/page.tsx`, `app/convert/page.tsx`, `app/convert/[slug]/page.tsx`, `app/privacy/page.tsx` (import + JSX tag only)

**Interfaces:**
- Produces: `default function SiteHeader(props: { query?: string; setQuery?: (q: string) => void }): JSX.Element` and `export function isTypingTarget(el: EventTarget | null): boolean`. Controlled ("homepage") mode iff `setQuery` is passed.

- [ ] **Step 1: Write the failing tests** — `test/frame/SiteHeader.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SiteHeader from '@/components/SiteHeader'

const search = () => screen.getByRole('textbox', { name: 'Search tools' })

describe('SiteHeader', () => {
  it('without props, search is a plain GET form to the homepage', () => {
    render(<SiteHeader />)
    expect(search()).toHaveAttribute('name', 'q')
    const form = search().closest('form')!
    expect(form).toHaveAttribute('action', '/')
    expect(form).toHaveAttribute('method', 'get')
  })

  it('homepage mode: typing drives setQuery', () => {
    const setQuery = vi.fn()
    render(<SiteHeader query="" setQuery={setQuery} />)
    fireEvent.change(search(), { target: { value: 'pdf' } })
    expect(setQuery).toHaveBeenCalledWith('pdf')
  })

  it('homepage mode does not submit the form', () => {
    render(<SiteHeader query="pdf" setQuery={() => {}} />)
    const notCancelled = fireEvent.submit(search().closest('form')!)
    expect(notCancelled).toBe(false)
  })

  it('homepage mode: the clear button empties the query', () => {
    const setQuery = vi.fn()
    render(<SiteHeader query="pdf" setQuery={setQuery} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(setQuery).toHaveBeenCalledWith('')
  })

  it('"/" focuses search from the page body', () => {
    render(<SiteHeader />)
    fireEvent.keyDown(document.body, { key: '/' })
    expect(search()).toHaveFocus()
  })

  it('ignores "/" while typing in a textarea', () => {
    render(
      <>
        <SiteHeader />
        <textarea aria-label="notes" />
      </>,
    )
    const ta = screen.getByLabelText('notes')
    ta.focus()
    fireEvent.keyDown(ta, { key: '/' })
    expect(ta).toHaveFocus()
  })

  it('ignores "/" inside a contenteditable editor', () => {
    render(
      <>
        <SiteHeader />
        <div contentEditable="true" suppressContentEditableWarning data-testid="ed">
          <p>text</p>
        </div>
      </>,
    )
    const notCancelled = fireEvent.keyDown(screen.getByText('text'), { key: '/' })
    expect(notCancelled).toBe(true)
    expect(search()).not.toHaveFocus()
  })

  it('links to all tools, conversions and privacy', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: 'All tools' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Conversions' })).toHaveAttribute('href', '/convert/')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run test/frame/SiteHeader.test.tsx`
Expected: FAIL — cannot resolve `@/components/SiteHeader`.

- [ ] **Step 3: Implement** — `components/SiteHeader.tsx`

```tsx
'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { tools } from '@/lib/tools'

interface Props {
  /** Homepage only: controlled search that filters the deck live. */
  query?: string
  setQuery?: (q: string) => void
}

/** True when a keystroke is going into a text field or rich editor. */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (/^(input|textarea|select)$/i.test(el.tagName)) return true
  return el.closest('[contenteditable]:not([contenteditable="false"])') !== null
}

// Site-wide header: brand, search, links. On the homepage the search is
// controlled and filters live; elsewhere it is a plain GET form to /?q=.
export default function SiteHeader({ query, setQuery }: Props) {
  const live = tools.filter((t) => t.status !== 'maintenance').length
  const rounded = Math.floor(live / 10) * 10
  const inputRef = useRef<HTMLInputElement>(null)
  const controlled = setQuery !== undefined

  // Press "/" anywhere (when not already typing) to jump to search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="site-header">
      <div className="shell site-header-row">
        <Link href="/" className="brand" aria-label="dauntexlabs home">
          dauntex<b>labs</b>
        </Link>

        <form
          className="site-search"
          role="search"
          action="/"
          method="get"
          onSubmit={controlled ? (e) => e.preventDefault() : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            name="q"
            {...(controlled
              ? { value: query ?? '', onChange: (e) => setQuery(e.target.value) }
              : {})}
            placeholder={`Search ${rounded}+ tools — pdf, bmi, json…`}
            aria-label="Search tools"
            autoComplete="off"
            spellCheck={false}
          />
          {controlled && query ? (
            <button type="button" className="site-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              ✕
            </button>
          ) : (
            <kbd className="site-search-kbd" aria-hidden>
              /
            </kbd>
          )}
        </form>

        <nav className="site-links" aria-label="Site">
          <Link href="/">All tools</Link>
          <Link href="/convert/">Conversions</Link>
          <Link href="/privacy/">Privacy</Link>
        </nav>
      </div>
    </header>
  )
}
```

If TypeScript narrows poorly on `setQuery` inside the spread, use `setQuery!(e.target.value)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/frame/SiteHeader.test.tsx`
Expected: 8 passed.

- [ ] **Step 5: Replace `StatusBar` everywhere and delete it**

```bash
for f in "app/tools/[slug]/page.tsx" app/convert/page.tsx "app/convert/[slug]/page.tsx" app/privacy/page.tsx; do
  sed -i '' -e "s#import StatusBar from '@/components/StatusBar'#import SiteHeader from '@/components/SiteHeader'#" -e 's#<StatusBar />#<SiteHeader />#g' "$f"
done
git rm components/StatusBar.tsx
grep -rn "StatusBar" app components test
```

Expected: the grep prints only `app/page.tsx` lines (fixed in Task 3). `app/page.tsx` still imports `StatusBar` — **in this same step**, delete its `import StatusBar …` line and the `<StatusBar />` element so the build stays green (Task 3 moves the header into `HomeClient`).

- [ ] **Step 6: Verify and commit**

Run: `npm run typecheck && npm test`
Expected: pass.

```bash
git add components/SiteHeader.tsx test/frame/SiteHeader.test.tsx app
git commit -m "feat(design): SiteHeader with search replaces StatusBar"
```

---

### Task 3: Homepage — `CategoryNav`, URL-seeded filters, Hero, ToolDeck, ToolCard

**Files:**
- Create: `components/CategoryNav.tsx`
- Create: `test/frame/CategoryNav.test.tsx`, `test/frame/HomeClient.test.tsx`
- Modify: `components/HomeClient.tsx`, `components/Hero.tsx`, `components/ToolDeck.tsx`, `components/ToolCard.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `SiteHeader` (Task 2).
- Produces:
  - `export type CategoryFilter = 'All' | Category` and `default function CategoryNav(props: { active: CategoryFilter; onSelect?: (c: CategoryFilter) => void })` — from `components/CategoryNav.tsx`.
  - `export function readInitialFilters(search: string): { query: string; active: CategoryFilter }` — from `components/HomeClient.tsx`.
  - `ToolCard` props become `{ tool: Tool }` (no `delay`).
  - `ToolDeck` props become `{ query: string; setQuery: (q: string) => void; active: CategoryFilter }`.

- [ ] **Step 1: Write failing tests** — `test/frame/CategoryNav.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CategoryNav from '@/components/CategoryNav'
import { tools, toolsByCategory } from '@/lib/tools'

describe('CategoryNav', () => {
  it('link mode: categories link to /?cat= and the active one is current', () => {
    render(<CategoryNav active="PDF Tools" />)
    const pdf = screen.getByRole('link', { name: /^PDF Tools/ })
    expect(pdf).toHaveAttribute('href', '/?cat=PDF%20Tools')
    expect(pdf).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /^All tools/ })).toHaveAttribute('href', '/')
  })

  it('link mode: encodes "&" in category names', () => {
    render(<CategoryNav active="All" />)
    expect(screen.getByRole('link', { name: /^Web & CSS/ })).toHaveAttribute('href', '/?cat=Web%20%26%20CSS')
  })

  it('button mode: clicking a category calls onSelect', () => {
    const onSelect = vi.fn()
    render(<CategoryNav active="All" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /^Image Tools/ }))
    expect(onSelect).toHaveBeenCalledWith('Image Tools')
    expect(screen.getByRole('button', { name: /^All tools/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows tool counts', () => {
    render(<CategoryNav active="All" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /^All tools/ })).toHaveTextContent(String(tools.length))
    expect(screen.getByRole('button', { name: /^PDF Tools/ })).toHaveTextContent(String(toolsByCategory('PDF Tools').length))
  })
})
```

`test/frame/HomeClient.test.tsx`

```tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomeClient, { readInitialFilters } from '@/components/HomeClient'

describe('readInitialFilters', () => {
  it('reads q and a known cat', () => {
    expect(readInitialFilters('?q=merge%20pdf&cat=PDF%20Tools')).toEqual({ query: 'merge pdf', active: 'PDF Tools' })
  })
  it('decodes + as a space', () => {
    expect(readInitialFilters('?q=merge+pdf').query).toBe('merge pdf')
  })
  it('ignores an unknown cat', () => {
    expect(readInitialFilters('?cat=Nope').active).toBe('All')
  })
  it('defaults when empty', () => {
    expect(readInitialFilters('')).toEqual({ query: '', active: 'All' })
  })
})

describe('HomeClient', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('seeds the category from ?cat= on load', () => {
    window.history.replaceState(null, '', '/?cat=PDF%20Tools')
    render(<HomeClient />)
    expect(screen.getByText(/tools in PDF Tools/)).toBeInTheDocument()
  })

  it('seeds the search from ?q= on load', () => {
    window.history.replaceState(null, '', '/?q=merge')
    render(<HomeClient />)
    expect(screen.getByRole('textbox', { name: 'Search tools' })).toHaveValue('merge')
    expect(screen.getByText(/matching “merge”/)).toBeInTheDocument()
  })

  it('shows an empty state with a working "Clear search"', () => {
    window.history.replaceState(null, '', '/?q=zzzqqqxx')
    render(<HomeClient />)
    expect(screen.getByText(/No tools match/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.queryByText(/No tools match/)).toBeNull()
  })

  it('sidebar click filters the deck', () => {
    render(<HomeClient />)
    fireEvent.click(screen.getByRole('button', { name: /^Image Tools/ }))
    expect(screen.getByText(/tools in Image Tools/)).toBeInTheDocument()
  })

  it('renders the hedged hero copy', () => {
    render(<HomeClient />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Free online tools that run in your browser.')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run test/frame`
Expected: CategoryNav suite fails to resolve the module; HomeClient suite fails on `readInitialFilters` not exported.

- [ ] **Step 3: Implement `components/CategoryNav.tsx`**

```tsx
import Link from 'next/link'
import { tools, CATEGORY_ORDER, toolsByCategory, type Category } from '@/lib/tools'

export type CategoryFilter = 'All' | Category

interface Props {
  active: CategoryFilter
  /** Homepage: filter in place. Omit on other pages to render links to /?cat=. */
  onSelect?: (c: CategoryFilter) => void
}

const ITEMS: CategoryFilter[] = ['All', ...CATEGORY_ORDER]

// Category sidebar (desktop) / swipeable chip row (phones — CSS only).
export default function CategoryNav({ active, onSelect }: Props) {
  return (
    <nav className="cat-nav" aria-label="Categories">
      <ul>
        {ITEMS.map((c) => {
          const isActive = active === c
          const cls = `cat-nav-item${isActive ? ' active' : ''}`
          const inner = (
            <>
              <span>{c === 'All' ? 'All tools' : c}</span>
              <em>{c === 'All' ? tools.length : toolsByCategory(c).length}</em>
            </>
          )
          return (
            <li key={c}>
              {onSelect ? (
                <button type="button" className={cls} aria-pressed={isActive} onClick={() => onSelect(c)}>
                  {inner}
                </button>
              ) : (
                <Link
                  className={cls}
                  href={c === 'All' ? '/' : `/?cat=${encodeURIComponent(c)}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Implement `components/HomeClient.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import SiteHeader from './SiteHeader'
import Hero from './Hero'
import ToolDeck from './ToolDeck'
import CategoryNav, { type CategoryFilter } from './CategoryNav'
import { CATEGORY_ORDER } from '@/lib/tools'

/** Initial search/category from the URL (?q=, ?cat=). Unknown categories fall back to All. */
export function readInitialFilters(search: string): { query: string; active: CategoryFilter } {
  const params = new URLSearchParams(search)
  const cat = params.get('cat')
  const active =
    cat && (CATEGORY_ORDER as string[]).includes(cat) ? (cat as CategoryFilter) : 'All'
  return { query: params.get('q') ?? '', active }
}

// Holds the homepage's interactive state (search + category filter) so that
// app/page.tsx can stay a server component and own the page metadata.
export default function HomeClient() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<CategoryFilter>('All')

  // Read once on mount (not useSearchParams) so the static export needs no Suspense boundary.
  useEffect(() => {
    const initial = readInitialFilters(window.location.search)
    if (initial.query) setQuery(initial.query)
    if (initial.active !== 'All') setActive(initial.active)
  }, [])

  return (
    <>
      <SiteHeader query={query} setQuery={setQuery} />
      <main className="shell workbench">
        <CategoryNav active={active} onSelect={setActive} />
        <div className="workbench-main">
          <Hero />
          <ToolDeck query={query} setQuery={setQuery} active={active} />
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 5: Implement `components/Hero.tsx`**

```tsx
import { tools } from '@/lib/tools'

// Plain-English intro above the tool grid. Privacy wording stays hedged
// ("designed to run on your device") — see CLAUDE.md › Privacy.
export default function Hero() {
  const live = tools.filter((t) => t.status !== 'maintenance').length
  const rounded = Math.floor(live / 10) * 10 // 106 → 100

  return (
    <section className="hero">
      <h1>Free online tools that run in your browser.</h1>
      <p className="lede">
        {rounded}+ tools for PDFs, images, text, code and everyday maths — designed to run on your
        device. No sign-up.
      </p>
    </section>
  )
}
```

- [ ] **Step 6: Implement `components/ToolDeck.tsx`**

```tsx
'use client'

import { useMemo } from 'react'
import { tools, CATEGORY_ORDER, toolsByCategory, type Tool } from '@/lib/tools'
import ToolCard from './ToolCard'
import type { CategoryFilter } from './CategoryNav'

interface Props {
  query: string
  setQuery: (q: string) => void
  active: CategoryFilter
}

function matches(tool: Tool, q: string): boolean {
  if (!q) return true
  const hay = `${tool.name} ${tool.blurb} ${tool.keywords.join(' ')} ${tool.category}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term))
}

export default function ToolDeck({ query, setQuery, active }: Props) {
  const filtered = useMemo(
    () => tools.filter((t) => (active === 'All' || t.category === active) && matches(t, query)),
    [query, active],
  )

  const grouped = query.trim() === '' && active === 'All'

  return (
    <section className="deck">
      {!grouped && filtered.length > 0 && (
        <p className="deck-results">
          <b>{filtered.length}</b> {filtered.length === 1 ? 'tool' : 'tools'}
          {query.trim() ? <> matching “{query}”</> : <> in {active}</>}
        </p>
      )}

      {filtered.length === 0 && (
        <div className="empty">
          <p>No tools match “{query}”.</p>
          <button type="button" className="btn" onClick={() => setQuery('')}>
            Clear search
          </button>
        </div>
      )}

      {grouped ? (
        CATEGORY_ORDER.map((category) => {
          const items = toolsByCategory(category)
          return (
            <section className="cat-group" key={category}>
              <header className="cat-head">
                <h2>{category}</h2>
                <span className="count">{items.length}</span>
              </header>
              <div className="deck-grid">
                {items.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <div className="deck-grid">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 7: Implement `components/ToolCard.tsx`**

```tsx
import Link from 'next/link'
import type { Tool } from '@/lib/tools'

// One tool in the grid: category, name, two-line blurb. Whole card is the link.
export default function ToolCard({ tool }: { tool: Tool }) {
  const soon = tool.status === 'maintenance'
  return (
    <Link href={`/tools/${tool.slug}/`} className={`card${soon ? ' is-soon' : ''}`}>
      <span className="card-cat">{tool.category}</span>
      <h3>{tool.name}</h3>
      <p>{tool.blurb}</p>
      {soon && <span className="soon-pill">Coming soon</span>}
    </Link>
  )
}
```

- [ ] **Step 8: `app/page.tsx` — header now lives in `HomeClient`**

Replace the returned JSX with:

```tsx
  return (
    <>
      <JsonLd data={website} />
      <JsonLd data={itemList} />
      <HomeClient />
      <Footer />
    </>
  )
```

Update the comment above `Page` to: `// Server component: owns the page (metadata inherited from layout), emits structured data, and renders header + workbench via the HomeClient island.` Imports: keep `Footer`, `HomeClient`, `JsonLd`, `tools`.

- [ ] **Step 9: Run tests + typecheck**

Run: `npx vitest run test/frame && npm run typecheck`
Expected: typecheck fails only in `app/tools/[slug]/page.tsx` (`delay` prop on `ToolCard`) — fixed in Task 4. Frame tests: all pass. To keep this commit green, also apply Task 4 Step 2's `ToolCard` call-site change now if typecheck blocks the commit hook.

- [ ] **Step 10: Commit**

```bash
git add components test/frame app/page.tsx
git commit -m "feat(design): Workbench homepage — category sidebar, URL-seeded filters, simpler cards"
```

---

### Task 4: Tool page frame, footer, loading + consent text, drop unused category codes

**Files:**
- Modify: `app/tools/[slug]/page.tsx`
- Modify: `components/Footer.tsx`
- Modify: `components/ToolMount.tsx:9`
- Modify: `components/ConsentBanner.tsx` (two button labels)
- Modify: `lib/tools.ts` (remove `CATEGORY_CODE`, `toolIndex` if unused)

**Interfaces:**
- Consumes: `SiteHeader`, `CategoryNav` (link mode), `ToolCard({ tool })`.

- [ ] **Step 1: Imports in `app/tools/[slug]/page.tsx`**

```tsx
import SiteHeader from '@/components/SiteHeader'
import CategoryNav from '@/components/CategoryNav'
import { tools, type Category } from '@/lib/tools'
```

Delete `const idx = toolIndex(tool.slug)`.

- [ ] **Step 2: Maintenance branch** — replace its returned JSX:

```tsx
    return (
      <>
        <SiteHeader />
        <main className="shell workbench tool-page">
          <CategoryNav active={tool.category} />
          <div className="workbench-main">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/">All tools</Link>
              <span className="sep">›</span>
              <Link href={`/?cat=${encodeURIComponent(tool.category)}`}>{tool.category}</Link>
              <span className="sep">›</span>
              <span className="crumb-here">{tool.name}</span>
            </nav>
            <h1>{tool.name}</h1>
            <p className="lede">{tool.blurb}</p>

            <div className="maintenance">
              <span className="maintenance-tag">Under maintenance</span>
              <p>
                This tool is being finished and will be available shortly. Like every dauntexlabs
                tool, it is designed to run in your browser.
              </p>
              <Link href="/" className="back">
                ← Browse the other tools
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
```

- [ ] **Step 3: Live branch** — replace everything from `<StatusBar />`/`<SiteHeader />` to the closing `</main>`:

```tsx
      <SiteHeader />
      <main className="shell workbench tool-page">
        <CategoryNav active={tool.category} />
        <div className="workbench-main">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">All tools</Link>
            <span className="sep">›</span>
            <Link href={`/?cat=${encodeURIComponent(tool.category)}`}>{tool.category}</Link>
            <span className="sep">›</span>
            <span className="crumb-here">{tool.name}</span>
          </nav>

          <h1>{tool.name}</h1>
          <p className="lede">{tool.blurb}</p>

          <div className="tool-meta">
            <span className="pill accent">Runs on your device</span>
            <span className="pill">Free</span>
            <span className="pill">No sign-up</span>
          </div>

          <div className="tool-console">
            <div className="tool-console-head">
              <span className="hint">Runs in your browser</span>
            </div>
            <div className="tool-console-body">
              <ToolMount slug={tool.slug} />
            </div>
          </div>

          <p className="tool-foot-note">
            Designed to run in your browser. See the <Link href="/privacy/">privacy policy</Link>.
          </p>

          {popularConversions.length > 0 && (
            <section className="related">
              <h2 className="related-title">Popular conversions</h2>
              <div className="conv-links">
                {popularConversions.map((p) => (
                  <Link className="conv-chip" key={p.slug} href={`/convert/${p.slug}/`}>
                    {p.fromLabel} to {p.toLabel}
                  </Link>
                ))}
                <Link className="conv-chip parent" href="/convert/">
                  All conversions →
                </Link>
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="related">
              <h2 className="related-title">More {tool.category} tools</h2>
              <div className="deck-grid">
                {related.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
```

`appSchema`, `breadcrumbs` JSON-LD and `generateMetadata` are untouched.

- [ ] **Step 4: Footer** — `components/Footer.tsx`

```tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell foot-row">
        <span className="brand sm">
          dauntex<b>labs</b>
        </span>
        <p className="foot-note">
          Your tool data is designed to stay on your device. Free for personal and public use.
        </p>
        <nav className="foot-meta" aria-label="Footer">
          <Link href="/" className="foot-link">All tools</Link>
          <Link href="/convert/" className="foot-link">Conversions</Link>
          <Link href="/privacy/" className="foot-link">Privacy</Link>
          <span>© 2026</span>
        </nav>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Frame strings**

- `components/ToolMount.tsx:9`: `initialising module…` → `Loading tool…`
- `components/ConsentBanner.tsx`: button text `decline` → `Decline`, `accept analytics` → `Accept analytics`. Leave the `consent-mark` span (hidden by CSS) and all other copy as is.

Check no test depends on the old strings:

```bash
grep -rn "initialising\|'decline'\|accept analytics" test
```

Expected: no output.

- [ ] **Step 6: Remove unused category codes**

```bash
grep -rn "CATEGORY_CODE\|toolIndex" app components lib test
```

Expected: only the definitions in `lib/tools.ts`. Delete `export const CATEGORY_CODE …` (whole object) and `export const toolIndex …` (whole function) from `lib/tools.ts`. If anything else still references them, leave them in place.

- [ ] **Step 7: Verify and commit**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass.

```bash
git add app components lib
git commit -m "feat(design): tool page in Workbench frame, plain footer, sentence-case frame copy"
```

---

### Task 5: Convert + privacy pages cleanup

**Files:**
- Modify: `app/convert/page.tsx`, `app/convert/[slug]/page.tsx`, `app/privacy/page.tsx`

These already use `SiteHeader` (Task 2) and pick up the new CSS. This task only removes the leftover terminal decoration in their markup. No copy changes beyond removing glyphs/codes and fixing casing of navigation labels.

- [ ] **Step 1: List what to remove**

```bash
grep -nE "◇|className=\"(code|rule|idx)\"|·\{|← deck|CONV|>[a-z][a-z →]+<" app/convert/page.tsx "app/convert/[slug]/page.tsx" app/privacy/page.tsx
```

- [ ] **Step 2: Edit each hit**
  - Delete `<span className="code">…</span>`, `<span className="rule" />` and `<span className="idx">…</span>` elements (CSS hides them already; removing keeps markup honest).
  - Remove a leading `◇ ` from visible text.
  - Capitalise the first letter of all-lowercase visible labels (e.g. `← deck` → `← All tools`, `→ all conversions` → `All conversions →`).
  - If the convert pair page has a `tool-console-head` label containing a code (`XXX·NN`), replace the label text with the page's plain title or remove the `lbl` span.
  - Leave every `<title>`/metadata/JSON-LD/FAQ text untouched.

- [ ] **Step 3: SEO head diff vs baseline**

```bash
npm run build
for f in index tools/jwt-tool/index tools/keyword-density/index tools/pdf-to-images/index convert/index convert/kilometers-to-miles/index privacy/index; do
  grep -oE '<title>[^<]*</title>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>|<meta property="og:[^"]*"[^>]*>|<script type="application/ld\+json">[^<]*</script>' "out/$f.html" | diff -q - ".superpowers/baseline/$(echo $f | tr / _).head" && echo "same: $f"
done
grep -c '<url>' out/sitemap.xml
```

Expected: `same:` for all 7, sitemap `369`. Any diff in JSON-LD caused by `Hero` copy is a bug — the hero is not in JSON-LD; investigate.

- [ ] **Step 4: Commit**

```bash
git add app/convert app/privacy
git commit -m "chore(design): drop terminal glyphs and codes from convert/privacy markup"
```

---

### Task 6: Theme colour literals in tools (style only)

**Files:** (each edit swaps a colour value; nothing else)
- `components/tools/TextDiff.tsx:55,58,121`
- `components/tools/RegexTester.tsx:82`
- `components/tools/ContrastChecker.tsx:55,56,61,67`
- `components/tools/QuadraticSolver.tsx:130,131`
- `components/tools/JsonDiff.tsx:63,64,200,214`
- `components/tools/RoasCalculator.tsx:131`
- `components/tools/RoiCalculator.tsx:138`
- `components/tools/JwtTool.tsx:289`
- `components/tools/SerpPreview.tsx:36,135`
- `components/tools/BmiCalculator.tsx:32,34,35,204,206,207`
- `test/tools/TextDiff.test.tsx:46-47`

**Not changed (tool content, not theme):** `FileGenerators.tsx` (sample-file colours), `ContrastChecker.tsx:80-148` (user colour defaults), `ColorConverter`, `CssGradient`, `BoxShadowGenerator`, `EmailSignatureGenerator`, `QrCodeGenerator`, `ImageConverter`/`ImageResizer` (`#ffffff` canvas fill), `CitationGenerator` (`var(--ink-800, #1a1a1a)` — alias wins).

- [ ] **Step 1: Update the colour-asserting test first** — `test/tools/TextDiff.test.tsx`

Replace:

```tsx
    // jsdom normalizes #ff6a4d to its rgb() form
    expect(removed.style.color).toBe('rgb(255, 106, 77)')
```

with:

```tsx
    expect(removed.style.color).toContain('--danger')
```

Run: `npx vitest run test/tools/TextDiff.test.tsx`
Expected: FAIL on that assertion (still `#ff6a4d`).

- [ ] **Step 2: Apply the swaps**

| File:line | From | To |
|---|---|---|
| TextDiff:55 | `background: 'rgba(198,242,78,.12)'` | `background: 'var(--accent-tint)'` |
| TextDiff:58 | `{ color: '#ff6a4d', background: 'rgba(255,106,77,.10)' }` | `{ color: 'var(--danger)', background: 'var(--danger-tint)' }` |
| TextDiff:121 | `color: '#ff6a4d'` | `color: 'var(--danger)'` |
| RegexTester:82 | `background: 'rgba(198,242,78,.25)'` | `background: 'var(--accent-tint)'` |
| ContrastChecker:55 | `pass ? 'rgba(198,242,78,0.12)' : 'rgba(220,60,60,0.12)'` | `pass ? 'var(--accent-tint)' : 'var(--danger-tint)'` |
| ContrastChecker:56 | `'#e05555'` | `'var(--danger)'` |
| ContrastChecker:61, 67 | `'#e07070'` | `'var(--danger)'` |
| QuadraticSolver:130 | `'#f0c040'` | `'var(--warn)'` |
| QuadraticSolver:131 | `'#f05070'` | `'var(--danger)'` |
| JsonDiff:63 | `removed: '#f87171'` | `removed: 'var(--danger)'` |
| JsonDiff:64 | `changed: '#d8b24a'` | `changed: 'var(--warn)'` |
| JsonDiff:200, 214 | `color: '#f87171'` | `color: 'var(--danger)'` |
| RoasCalculator:131 | `'#f87171'` | `'var(--danger)'` |
| RoiCalculator:138 | `'#f87171'` | `'var(--danger)'` |
| JwtTool:289 | `'#ff6b6b'` | `'var(--danger)'` |
| SerpPreview:36 | `'#f7768e'` | `'var(--danger)'` |
| SerpPreview:135 | `'#8ab4f8'` (dark-mode Google link blue) | `'#1a0dab'` (light-mode Google link blue — the tool imitates a Google result) |
| BmiCalculator:32, 204 | `'#60a5fa'` | `'#1d4ed8'` |
| BmiCalculator:34, 206 | `'#fb923c'` | `'var(--warn)'` |
| BmiCalculator:35, 207 | `'#f87171'` | `'var(--danger)'` |

Line numbers are from commit `abbca47`; confirm each with `grep -n` before editing.

- [ ] **Step 3: Confirm nothing neon or dark-tuned is left in tools**

```bash
grep -rnE "198, ?242, ?78|#c6f24e|#0a0b09|#f87171|#ff6a4d|#ff6b6b|#f7768e|#8ab4f8|#60a5fa|#fb923c|#f0c040|#f05070|#d8b24a|#e0[57]{2}[57]{2}" components | grep -v FileGenerators
```

Expected: no output.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass (TextDiff included).

- [ ] **Step 5: Commit**

```bash
git add components/tools test/tools/TextDiff.test.tsx
git commit -m "style(tools): swap dark-theme colour literals for light tokens"
```

---

### Task 7: Full verification, visual sweep, docs

**Files:**
- Create (gitignored): `.superpowers/shots.mjs`
- Modify: `CLAUDE.md` (Design system + mentions of Chakra Petch / Backdrop / Instrument Deck)

- [ ] **Step 1: Grep gates**

```bash
grep -rnE "Chakra|#c6f24e|198, ?242, ?78|#0a0b09|text-transform: ?uppercase|Backdrop|\breveal\b|StatusBar|Instrument Deck" app components lib | grep -v "components/tools/FileGenerators"
```

Expected: no output.

- [ ] **Step 2: Full gate**

Run: `npm run verify && npm run e2e`
Expected: typecheck, all unit tests, build and Playwright image-tool specs pass. Compare "First Load JS shared by all" with `.superpowers/baseline/build.txt` — must be within ~2 KB of the baseline.

- [ ] **Step 3: Visual sweep script** — `.superpowers/shots.mjs`

```js
// Screenshots every page at desktop + phone width and reports page errors,
// horizontal overflow, large dark boxes and leftover neon text.
// usage: node .superpowers/shots.mjs http://localhost:4173 .superpowers/shots
import { chromium } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'

const [base = 'http://localhost:4173', out = '.superpowers/shots'] = process.argv.slice(2)
const slugs = [...readFileSync('lib/tools.ts', 'utf8').matchAll(/slug: '([^']+)'/g)].map((m) => m[1])
const pages = ['/', '/?cat=PDF%20Tools', '/?q=pdf', '/?q=zzzqqqxx', '/privacy/', '/convert/', '/convert/kilometers-to-miles/', ...slugs.map((s) => `/tools/${s}/`)]
mkdirSync(out, { recursive: true })

const problems = []
const browser = await chromium.launch()
for (const [width, height, tag] of [[1280, 900, 'desktop'], [390, 844, 'phone']]) {
  const ctx = await browser.newContext({ viewport: { width, height } })
  await ctx.addInitScript(() => { try { localStorage.setItem('dxl-consent-v1', 'accepted') } catch {} })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => problems.push(`${tag} ${page.url()} pageerror: ${e.message}`))
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: 'networkidle' })
    await page.waitForTimeout(250)
    const report = await page.evaluate(() => {
      const res = { overflow: document.documentElement.scrollWidth > window.innerWidth, dark: [], neon: [] }
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        const bg = cs.backgroundColor.match(/[\d.]+/g)?.map(Number)
        if (bg && (bg[3] ?? 1) > 0.5 && bg[0] + bg[1] + bg[2] < 180) {
          const r = el.getBoundingClientRect()
          if (r.width * r.height > 2000) res.dark.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`)
        }
        if (cs.color === 'rgb(198, 242, 78)') res.neon.push(el.tagName.toLowerCase())
      }
      res.dark = res.dark.slice(0, 5)
      res.neon = res.neon.slice(0, 5)
      return res
    })
    if (report.overflow) problems.push(`${tag} ${p} horizontal overflow`)
    if (report.dark.length) problems.push(`${tag} ${p} dark boxes: ${report.dark.join(', ')}`)
    if (report.neon.length) problems.push(`${tag} ${p} neon text: ${report.neon.join(', ')}`)
    const name = p === '/' ? 'home' : p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
    await page.screenshot({ path: `${out}/${tag}-${name}.png` })
  }
  await ctx.close()
}
await browser.close()
console.log(problems.length ? problems.join('\n') : 'clean: no page errors, overflow, dark boxes or neon')
```

- [ ] **Step 4: Run the sweep against the production build**

```bash
npx serve out -l 4173 &   # background; stop it after the sweep
node .superpowers/shots.mjs http://localhost:4173 .superpowers/shots
```

Expected: `clean: …`. For each reported problem, fix it in `app/globals.css` (frame/kit) or, for a tool-specific colour literal, in that tool file under Task 6's rule (colour value only), then re-run. A "dark box" that is deliberate tool content (e.g. a code preview the tool renders dark on purpose, a colour swatch) is acceptable — note it in the commit message.

- [ ] **Step 5: Eyeball the screenshots**

Open and check at least: `desktop-home.png`, `phone-home.png`, `desktop-tools_keyword_density.png`, `phone-tools_keyword_density.png`, `desktop-_q_zzzqqqxx.png`, one tool per category (14), `desktop-convert_kilometers_to_miles.png`, `phone-privacy.png`. Look for unreadable text, invisible inputs, cramped phone layout, lowercase-first button labels.

- [ ] **Step 6: Update `CLAUDE.md`**

- Replace the `## Design system ("Instrument Deck")` section with:

```markdown
## Design system ("Workbench", light)

Defined in `app/globals.css` via CSS variables — reuse these tokens, don't add ad-hoc colors:

- White surfaces (`--bg`, `--surface`, `--surface-soft #f4f7f5`), text `--fg #10261b` / `--mute` / `--mute-2`, borders `--line` / `--line-strong`, form-control borders `--field-border` (meets 3:1), single accent **deep green `--accent` (#0f7a4a)** with `--accent-hover` / `--accent-tint`, status `--danger(-tint)` / `--warn(-tint)`. Light only — no dark mode.
- Legacy names (`--acid`, `--bone`, `--ink-*`, `--muted`, …) are **aliases** kept so tool components recolour without edits. Don't use them in new code.
- Type: **Bricolage Grotesque** headings (`--font-display`), **Instrument Sans** UI/body (`--font-sans`), **IBM Plex Mono** for code/data only (`--font-mono`). All self-hosted via `next/font`. Sentence case everywhere; no uppercase/letter-spaced labels.
- Layout: sticky `SiteHeader` (search; `/` focuses it) + `CategoryNav` sidebar (becomes a swipeable chip row under 900px) + card grid. 12px radius cards/panels, 8px inputs/buttons, almost no shadows, no decorative motion.
```

- In "Stack", replace the fonts bullet's `(Chakra Petch + IBM Plex Mono)` with `(Bricolage Grotesque + Instrument Sans + IBM Plex Mono)` and `--ff-display`/`--ff-mono` with `--ff-display`/`--ff-sans`/`--ff-mono`.
- In "Tests", the e2e note about FileDrop hint text stays.
- Under "Server vs client split", add: `The homepage header search and category filter live in HomeClient; other pages link to /?q= and /?cat=, which HomeClient reads on mount.`

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md app components
git commit -m "docs: CLAUDE.md design system → Workbench; fixes from visual sweep"
```

- [ ] **Step 8: Hand back for push approval**

Report: test counts, e2e result, First Load JS before/after, SEO diff result, sweep result, and paths to 4–6 representative screenshots. **Do not push** until the owner says so (push to `main` deploys).
