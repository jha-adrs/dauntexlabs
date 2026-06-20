# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**dauntexlabs** — a library of **client-side** developer & media tools and converters, free for personal and public use. One homepage lists every tool; **every tool has its own statically-generated, SEO-indexed page** (`/tools/<slug>/`). There is no application backend: computation (parsing, hashing, encryption, image/PDF processing) is *designed* to run in the browser. NOTE: the privacy framing was deliberately softened from an absolute guarantee to "designed to run on your device" + legal hedges (see Privacy below) — keep new copy consistent with that.

73 live tools + 1 under-maintenance page across 10 categories (Utilities, Converters, Formatters, Generators, Data Tools, Image Tools, PDF Tools, Text Tools, Web & CSS, Business & Finance).

## Stack

- **Next.js 15 (App Router) with `output: 'export'`** — fully static; one HTML file per route in `./out`. SEO is why Next is used over a plain SPA.
- **React 18 + TypeScript**, path alias `@/*` → repo root.
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config`; `@import "tailwindcss"` tops `app/globals.css`). Most styling is bespoke CSS in `globals.css`, not utilities.
- **Fonts self-hosted via `next/font`** (Chakra Petch + IBM Plex Mono) in `app/layout.tsx` — exposed as `--ff-display`/`--ff-mono`, consumed by `--font-display`/`--font-mono`. Self-hosting is deliberate: it removes the only third-party runtime request so the privacy policy holds.

## Commands

```bash
npm run dev        # next dev (http://localhost:3000)
npm run build      # static export -> ./out  (runs SSG + typechecks; THE gate)
npm run preview    # serve ./out (npx serve)
npm run typecheck  # tsc --noEmit (production only — test/ is excluded)
npm test           # vitest run — 625 behavior tests, one suite per tool
npm run test:watch # vitest watch
npm run e2e        # playwright — real-browser image-tool tests (auto-boots next dev)
npm run e2e:install# one-time: download the Chromium used by e2e
npm run verify     # typecheck + unit tests + build — the CI / pre-push gate
```

`npm run build` is the production gate; `npm test` is the fast local-verification gate; `npm run verify` is the full gate CI and the pre-push hook run.

## Tests (Vitest + React Testing Library)

- **`test/tools/<Component>.test.tsx`** — one behavior suite per tool. Tests render the real component (jsdom), drive inputs via `fireEvent`, and assert rendered output — no logic was extracted from components.
- **`test/setup.ts`** polyfills what jsdom lacks so tools run as in a browser: Node `webcrypto` (so `crypto.subtle` SHA/HMAC/AES/JWT/PGP work, `isSecureContext = true`), a **stubbed canvas** (`getContext` no-op, `toBlob` → tiny fake PNG) and a **mocked `Image`** (fires `onload`, `naturalWidth/Height` = 120/90), and `URL.createObjectURL`.
- **Coverage reality:** logic/crypto/PDF/QR tools are tested for real (e.g. AES & PGP password round-trips recover plaintext; PDF page-count math verified by loading saved bytes back through pdf-lib). **Image tools are flow-only** — canvas pixels aren't real in jsdom, so those tests assert the flow (file loads → action succeeds → download fired via a `URL.createObjectURL` spy), not encoding. Pixel-level correctness needs a real browser (Playwright, not set up).
- **`test/` is excluded from `tsconfig.json`** so test-only type quirks never break `next build`; Vitest resolves the `@` alias via `vitest.config.ts`. Add new tool tests here, mirroring `Base64.test.tsx` (pure) and `HashGenerator.test.tsx` (crypto) as references.

### e2e (Playwright) — closes the canvas gap
- **`test/e2e/image-tools.spec.ts`** runs the 4 canvas tools in real headless Chromium and asserts on the **actual downloaded bytes**: JPEG/WebP magic numbers, resized-PNG dimensions parsed from the IHDR, and the multi-size `.ico` header. `test/e2e/png.ts` builds a real PNG via Node `zlib` (no binary fixture committed).
- `playwright.config.ts` auto-starts `next dev` (localhost = secure context, so crypto tools work too). Run `npm run e2e:install` once, then `npm run e2e`. Specs use `getByRole('button', { name, exact: true })` — without `exact`, the FileDrop's hint text ("…**resize**d…") matches action-button names.

### CI / pre-push
- **`.github/workflows/ci.yml`** — two jobs: `verify` (typecheck + unit + build) and `e2e` (installs Chromium, runs Playwright, uploads the report).
- **`.githooks/pre-push`** — dependency-free; runs `npm run verify` (not e2e, to stay fast). Enable per clone with `git config core.hooksPath .githooks`. Bypass with `git push --no-verify`.

## SEO architecture (already wired — don't break it)

- **`app/tools/[slug]/page.tsx`** is a **server component**: `generateStaticParams()` pre-renders one HTML file per tool; `generateMetadata()` bakes a unique `<title>`, description, canonical and OpenGraph into that HTML, all from the registry. `dynamicParams = false`.
- **`app/layout.tsx`** holds site-wide metadata (title template `%s — dauntexlabs`) and the `viewport` themeColor.
- **`app/sitemap.ts`** + **`app/robots.ts`** generate `sitemap.xml`/`robots.txt` from the registry; both need `export const dynamic = 'force-static'` (required under `output: export`).
- The `SITE` base URL (`https://dauntexlabs.com`) is hardcoded in layout/sitemap/robots/privacy — change all of them if the domain differs.
- Verify after changes: `grep '<title>' out/tools/jwt-tool/index.html`.

**Server vs client split:** components that export metadata must stay server components; interactivity lives in `'use client'` islands. The homepage uses `components/HomeClient.tsx` for its search/filter state so `app/page.tsx` keeps its metadata.

## Tool architecture (how the 22 tools fit together)

Three layers, all deriving from one registry:

1. **`lib/tools.ts`** — the single source of truth: `tools: Tool[]` (`slug`, `name`, `category`, `blurb`, `keywords`) plus `CATEGORY_ORDER`, `CATEGORY_CODE`, `toolIndex`, `toolsByCategory`. The homepage, search, filters, tool pages, sitemap and robots all derive from it.
2. **`components/ToolMount.tsx`** (`'use client'`) — a `slug → component` registry. Each tool is `dynamic(() => import('@/components/tools/<Name>'), { ssr: false })`, so a tool's code never bloats other pages and is client-only. The server tool page renders the SEO header + `<ToolMount slug=… />`.
3. **`components/tools/<Name>.tsx`** — one tool per file: starts with `'use client'`, default-exports a no-prop component that renders only the interactive body (the page already renders the `<h1>` + blurb).

**The shared UI kit — `components/ui/kit.tsx`** — is the contract every tool uses for consistency: `Button, CopyButton, DownloadButton, Field, TextArea, TextInput, Select, Toggle, Segmented, Toolbar, IO, Panel, Notice`, plus file primitives for image/PDF tools: `FileDrop`, `FilePreview`, and `downloadBlob(data, filename, mime?)` (binary download). Their styles live in the "tool kit" / "file drop" sections of `app/globals.css`. **Build new tools by composing the kit** — text tools: `Base64.tsx`/`HashGenerator.tsx`; file tools: `ImageCompressor.tsx` (native Canvas) / `MergePdf.tsx` (lazy pdf-lib) are the canonical references — rather than hand-rolling controls or inventing CSS class names.

A registry entry with **`status: 'maintenance'`** renders an "under maintenance" page (still SEO-indexed via `generateMetadata`) instead of the tool body, and needs **no** `ToolMount` entry (e.g. `pdf-to-images`, deferred to avoid the heavy pdf.js bundle). The homepage card shows a "soon" badge for these.

### Adding a tool
1. Add a registry entry in `lib/tools.ts` (page, sitemap, search, card appear automatically).
2. Create `components/tools/<Name>.tsx` using the kit.
3. Add the `slug → dynamic(import)` line to `components/ToolMount.tsx`. (Every *live* registry entry must resolve to a real file or the build fails; maintenance entries must NOT have one.)

## Non-negotiable client-side constraints

- **No network for tool logic.** No `fetch`/XHR/websocket, no telemetry on user input, no new runtime services. Inputs never leave the browser.
- **Implement algorithms inline / with Web APIs; avoid dependencies.** Example: `lib/md5.ts` is a hand-ported MD5 because Web Crypto can't do MD5; SHA/HMAC/AES use `crypto.subtle`; image tools use the **native Canvas API (zero libs)**. The deliberate exceptions are three pure-client libraries, each **bundled** (no CDN/network) and **dynamically imported only inside the handler that needs it** so they never enter the shared bundle or other pages: **`openpgp`** (PGP, `Pgp.tsx`), **`pdf-lib`** (PDF merge/split/organize/images→PDF), **`qrcode-generator`** (QR). **Bundle budget:** the build's shared "First Load JS" must stay ~103 KB; libs must appear as separate per-tool chunks (verify in `npm run build` output). Don't add other runtime deps without the same justification, and always lazy-import them.
- **`crypto.subtle` needs a secure context (HTTPS or localhost).** Tools that use it (Hash SHA family, JWT verify/sign, Encryption AES/HMAC, **PGP** — OpenPGP.js requires WebCrypto even for password mode) must guard: `const subtle = typeof crypto!=='undefined' && !!crypto.subtle;` and show a `<Notice>` + still offer what works without it (MD5, ROT13/Caesar, JWT decode). `crypto.getRandomValues` works everywhere; `crypto.randomUUID` may be undefined insecure — use a getRandomValues fallback (see `UuidGenerator`). Note: this means PGP can't be exercised over plain HTTP (e.g. a LAN-IP preview) — verify PGP logic in Node (`globalThis.crypto.subtle` is present) or over HTTPS/localhost.

## Privacy & consent

- **`app/privacy/page.tsx`** — accurate but deliberately **hedged for legal safety**: it states tools are *designed* to run on-device (not an absolute guarantee), discloses bundled libs (OpenPGP.js, pdf-lib, QR), and includes a "circumstances in which data may leave your device" clause, a disclaimer of warranties, and a limitation-of-liability section. Keep it truthful: don't re-add absolute "nothing ever leaves" language, and if you add anything that genuinely makes a network request, disclose it at the point of use too.
- **`components/ConsentBanner.tsx`** (in the root layout) — a first-visit acknowledgement stored in `localStorage['dxl-consent-v1']`; renders nothing until mounted (avoids SSR mismatch/flash). Footer links to `/privacy/`.

## Design system ("Instrument Deck")

Defined in `app/globals.css` via CSS variables — reuse these tokens, don't add ad-hoc colors:

- Dark warm-charcoal surfaces (`--ink-900…700`), single accent **acid-lime `--acid` (#c6f24e)**, bone text, muted greys, hairline borders (`--line`/`--line-strong`).
- Motifs: fixed blueprint-grid + grain `Backdrop`, module cards with ghost index + acid hover accent, monospace instrument labels, staggered `.reveal` load (respects `prefers-reduced-motion`).
- New UI: squared display type (Chakra Petch) for headings, mono (IBM Plex Mono) for data/labels, acid used sparingly as *the* signal color.
