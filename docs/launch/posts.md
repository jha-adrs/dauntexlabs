# Launch posts — drafts (nothing here has been posted)

Date: 2026-11-06. Source: item 0 of `docs/superpowers/specs/2026-11-06-advisor-impact-review.md` (the site's gap is authority; 10–20 real links matter more than new pages).

**Owner action:** read, adjust, and post these yourself. Nothing has been submitted anywhere. While you are in GSC, export the **Page indexing** report (how many URLs are "Crawled – currently not indexed").

## Ground rules for every post

- **Privacy wording stays hedged.** Say "designed to run in your browser" / "processed on your device". Do **not** say "nothing ever leaves your device", "100% private" or "zero tracking". The site runs Google Analytics (page views only, consent default denied, no tool input), and the privacy policy is deliberately hedged.
- **True claims you can make:** static site, no backend for the tools, no sign-up; a Content-Security-Policy limits connections to the site itself and Google Analytics; Playwright tests feed a canary string into tools and fail if it shows up in any request, storage, URL, page title or console line; fonts are self-hosted; the three bundled libraries (OpenPGP.js, pdf-lib, qrcode-generator) are lazy-loaded and served from the site, not a CDN.
- **The repo is public but unlicensed.** You may link to the source (`https://github.com/jha-adrs/dauntexlabs`), but do **not** call it open source: without a LICENSE nobody may reuse the code. Adding a LICENSE is the owner's decision; until then, skip any listing that requires an OSI licence.
- **Disclose that you made it** in every post. Most communities below require it.
- Subreddit rules below are from memory of each sidebar, not checked today. **Re-read the sidebar/wiki before posting**; rules change.
- One community per day, not all at once: a burst of identical posts reads as spam and gets cross-banned.
- The OG card (`public/og.png`) renders when the link is shared, so post the bare homepage or the specific tool URL, no shortener.

---

## 1. Show HN

**Title** (80 char limit):

```
Show HN: Dauntexlabs – dev and paperwork tools designed to run in your browser
```

**URL:** `https://dauntexlabs.com/`

**Text** (first comment, posted by you immediately after submitting):

```
Hi HN, I built dauntexlabs, a static site of small tools where the work is designed to happen in your browser: there is no backend for the tools, and no sign-up.

The usual JSON/Base64/JWT/hash suspects are there, but the parts I'd actually like feedback on are the niche ones I couldn't find done client-side elsewhere:

- HAR sanitizer: strips cookies, auth headers and tokens from a .har before you attach it to a bug report.
- EML viewer: opens a raw .eml file (headers, text/HTML, attachments) with remote images and trackers blocked.
- Metadata remover: strips GPS, camera and date metadata from JPEG/PNG/WebP/MP4/MOV without re-encoding, and tells you when a file has a telemetry track it left alone.
- Aviation: METAR/TAF decoders (paste-only, no live fetch), density altitude, crosswind, wind correction, weight and balance.
- Indian paperwork: GSTIN and Aadhaar checksum validators (Verhoeff), an Aadhaar masker, a UPI QR generator, amount-in-words in lakh/crore, and Kruti Dev / DevLys / Chanakya to Unicode converters (each font map checked against two independent sources before shipping).

How the privacy side is enforced rather than just promised: a CSP limits connections to the site itself plus Google Analytics (page views only, consent defaults to denied, and the page path is sent without query or fragment). A Playwright suite feeds a canary string into the tools and fails if it appears in any network request, storage, URL, page title or console line, and it has a self-test that a planted leak is caught. The privacy page is deliberately hedged ("designed to run on your device") because I can't promise what your browser extensions do.

Stack: Next.js static export, no runtime deps beyond three lazy-loaded libraries (OpenPGP.js, pdf-lib, qrcode-generator) served from the same origin. The source is on GitHub if you want to check the privacy tests: https://github.com/jha-adrs/dauntexlabs (public, but no licence yet).

What's broken or missing? I'm especially interested in whether the HAR sanitizer misses anything you'd consider sensitive.
```

Rules to respect (HN guidelines / Show HN rules): must be something people can try without sign-up (true); no voting rings or asking for upvotes; post as yourself and stay in the thread to answer. Best window: weekday morning US Eastern.

---

## 2. Reddit

### r/SideProject

Rules (re-check): self-promotion of your own project is the point of the sub; say what it is and what you learned; no referral links.

**Title:**
```
I built 130+ small tools that are designed to run in your browser (HAR sanitizer, METAR decoder, GSTIN validator, Kruti Dev to Unicode…)
```
**Body:**
```
I made dauntexlabs.com, a static site of tools with no backend and no sign-up: what you paste or drop in is processed on your device.

It started as the usual JSON/Base64/JWT set, but the bits that turned out more interesting were niches nobody had done client-side:
- HAR sanitizer and EML viewer for debugging
- a metadata remover for photos and MP4/MOV (EXIF, GPS, C2PA) that flags GoPro/DJI/iPhone telemetry tracks rather than removing them
- aviation calculators and METAR/TAF decoders
- Indian paperwork: GSTIN/Aadhaar validation, UPI QR codes, Kruti Dev/DevLys/Chanakya to Unicode

Lessons: I had to enforce the privacy claim with tests (a canary string fed into the tools fails the e2e tests if it shows up in a request, storage, URL or console), and a CSP that blocks any host other than the site and analytics. I also learnt commodity tools ("json formatter") are hopeless for a new domain on Google; the niche pages are the ones getting impressions.

Feedback welcome, especially on which tools are broken on mobile.
```

### r/webdev — Showoff Saturday only

Rules (re-check): self-promotion of your own projects only on **Saturdays**, with the "Showoff Saturday" flair; otherwise removed. No AI-generated low-effort posts.

**Title:**
```
[Showoff Saturday] A static Next.js site of 130+ tools with a CSP + Playwright canary test that checks tool input stays on the page
```
**Body:**
```
dauntexlabs.com: developer and everyday tools built as a fully static Next.js export (one HTML file per tool, no backend).

The webdev-interesting part is how the "runs in your browser" claim is enforced:
- CSP in _headers: connect-src limited to self + Google Analytics, so the browser blocks any other host.
- Playwright privacy spec: types a canary string into tools and asserts it never shows up in any request, localStorage/sessionStorage, URL, document.title or console output. It includes a self-test where a planted leak must be caught.
- Analytics sends page views by hand: origin + path only, referrer reduced to origin, consent default denied.
- Heavy libs (pdf-lib, OpenPGP.js, qrcode-generator) are dynamic-imported inside the click handler, so the shared first-load JS stays ~105 KB.

Tools worth a look: HAR sanitizer, EML viewer, metadata remover (JPEG/PNG/WebP/MP4), METAR decoder, GSTIN validator. Happy to answer questions about static export + per-tool code splitting.
```

### r/InternetIsBeautiful — likely removed, low priority

Self-submitted tool collections are often removed here; try it last, if at all. Rules (re-check): the site must be usable without sign-up or paywall (true); no self-promotion of commercial products; titles describe the site, no clickbait; check whether self-submissions need disclosure in a comment.

**Title:**
```
A collection of free tools that run in your browser, from METAR weather decoders to Hindi legacy-font converters
```
**Comment after posting:** `I made this. It's static, no sign-up. Happy to hear what's broken.`

### r/developersIndia

Rules (re-check): self-promotion is restricted to specific days and/or a specific flair ("I Made This" or equivalent), sometimes a weekly thread only; posts outside that window are removed. Re-check the sidebar and pinned posts for the current day and flair before posting. No pure promotion, explain the build.

**Title:**
```
Built client-side tools for Indian paperwork: GSTIN/Aadhaar validators, UPI QR generator, Kruti Dev to Unicode, amounts in lakh/crore
```
**Body:**
```
I kept needing small India-specific utilities and didn't like pasting GSTINs or Aadhaar numbers into random sites, so I built them to run in the browser (static site, no backend, no sign-up):

- GSTIN validator: checks the state code, PAN segment and checksum character
- Aadhaar validator (Verhoeff checksum) and an Aadhaar masker that boxes out the number on a photo or scan
- UPI QR code generator (UPI ID, name, optional amount; PNG or SVG)
- Amount in words in rupees (lakh/crore), plus /convert/ pages for lakh ↔ million and crore ↔ billion
- Kruti Dev, DevLys, Walkman-Chanakya to Unicode (each map verified against two sources; Shivaji is on hold because it failed that check)
- Hindi typing keyboard

These are designed to run on your device; I've written the privacy page carefully rather than promising the moon. The validators check format and checksum only, not whether a number is actually registered. Feedback on edge cases is very welcome.

dauntexlabs.com/category/india/
```

### r/flying — ask the mods first

Rules (re-check): self-promotion usually needs mod approval; no posts that read like ads. Send modmail with the draft below before posting.

**Title:**
```
Made a set of free paste-only aviation calculators (METAR/TAF decode, density altitude, crosswind, W&B)
```
**Body:**
```
I'm a developer who builds small browser tools, and I put together an aviation set: METAR and TAF decoders (you paste the report; it doesn't fetch live weather), density altitude, pressure altitude, cloud base, true airspeed, crosswind component, wind correction angle, flight time/fuel, and weight and balance.

Not for flight planning or as a substitute for official sources: they are calculators for study and quick checks. I'd love corrections from people who use these numbers for real.

dauntexlabs.com/category/aviation/
```

### Not recommended: r/privacy

Its rules (re-check) forbid self-promotion and advertising of your own product. Do not post there. If someone else shares it, let it be.

### Later: r/india

Only after the exam-photo tools ship (plan A in the advisor review); the India paperwork angle fits r/developersIndia better until then.

---

## 3. Product Hunt

**Name:** dauntexlabs
**Tagline** (60 chars):
```
130+ free tools designed to run in your browser
```
**Topics:** Developer Tools, Privacy, Productivity

**Description** (260 chars):
```
Developer, media and paperwork tools on a static site: no backend, no sign-up. HAR sanitizer, EML viewer, photo/MP4 metadata remover, METAR/TAF decoders, GSTIN and Aadhaar validators, UPI QR codes, Kruti Dev to Unicode. Inputs are processed on your device.
```

**Maker's first comment:**
```
Hey Product Hunt, I'm the maker.

dauntexlabs is a set of small tools where the computation is designed to happen in your browser. There's no backend for the tools, and the privacy claim is tested: a CSP blocks connections to any host except the site and analytics, and an automated test fails if anything I type into a tool shows up in a network request, storage, the URL or the console.

Most tool sites cover the same 20 developer utilities. I've tried to go where they don't: aviation calculators and METAR/TAF decoders, Indian paperwork (GSTIN, Aadhaar, UPI QR, legacy Hindi fonts), and debugging chores like sanitizing a HAR file before sharing it.

It's free, with no account. Tell me what's broken or what you'd like next.
```

**Gallery:** use `public/og.png` as the thumbnail and take 3–4 screenshots (HAR sanitizer, METAR decoder, GSTIN validator, metadata remover).

---

## 4. AlternativeTo

Submit as a new application, then add it as an alternative to: **CyberChef**, **iLovePDF**, **Smallpdf**, **TinyPNG**, **IT Tools** (it-tools.tech), **ExifTool / ExifCleaner** (for the metadata remover).

**Name:** dauntexlabs
**Platforms:** Online / Web
**License:** Free (proprietary). Do not tick "Open Source": the repo is public but has no LICENSE.
**Tags:** developer-tools, privacy-focused, no-registration, pdf-tools, image-tools, converter

**Short description:**
```
Free collection of 130+ developer, PDF, image and paperwork tools designed to run in your browser, with no sign-up.
```

**Long description:**
```
dauntexlabs is a static website of small tools whose processing is designed to happen on your device. There is no server-side processing for the tools and no account.

It covers the common developer utilities (JSON, Base64, JWT, hashing, AES and PGP encryption, regex, cron) and PDF/image work (merge, split, compress, convert, resize), plus areas other tool sites skip: a HAR sanitizer, an EML viewer, a metadata remover for photos and MP4, aviation calculators with METAR/TAF decoders, and Indian utilities such as GSTIN and Aadhaar validators, a UPI QR generator and Kruti Dev to Unicode conversion.

A Content-Security-Policy limits connections to the site and its analytics, and automated tests check that tool input does not appear in network requests, storage or URLs.
```

---

## 5. Awesome-list PR blurbs

Before opening each PR: confirm the list is still maintained (merged PRs in the last few months), read its `CONTRIBUTING.md`, match its entry format exactly, and check whether it only accepts open-source projects (several privacy and self-hosted lists do). Those are **only after a LICENSE is added**: the repo is public but unlicensed, so it does not qualify yet. One PR per list; do not batch.

### a. Lissy93/awesome-privacy — section closest to "Online tools" / "Utilities" (check its licence requirement first; if it wants open source, only after a LICENSE is added)

```markdown
- [dauntexlabs](https://dauntexlabs.com/) - Static collection of developer, PDF, image and metadata tools designed to run in the browser, with a CSP that restricts connections and tests that check input never reaches a request, storage or URL. No sign-up.
```
PR description: "Adds dauntexlabs, a set of client-side tools (metadata remover for photos/MP4, HAR sanitizer, PDF tools). I'm the author. Processing is designed to happen in the browser; the privacy policy is at https://dauntexlabs.com/privacy/."

### b. trimstray/the-book-of-secret-knowledge — "Other Online tools" / "Web Tools"

```markdown
<a href="https://dauntexlabs.com/"><b>dauntexlabs</b></a> - client-side developer tools: HAR sanitizer, EML viewer, JWT, hashing, PGP, CIDR/chmod calculators.<br>
```
PR description: "Adds a browser-side tool collection. The HAR sanitizer (strip cookies/tokens before sharing a .har) and the EML viewer seem a good fit for the debugging section. Disclosure: I'm the author."

### c. An aviation tools list (search GitHub for "awesome aviation" and pick one with recent merges)

```markdown
- [dauntexlabs aviation tools](https://dauntexlabs.com/category/aviation/) - Browser-based METAR/TAF decoders (paste-only), density altitude, crosswind, wind correction, true airspeed, and weight-and-balance calculators.
```

### d. An India developer resources list (search GitHub for "awesome india" with a utilities section)

```markdown
- [dauntexlabs India tools](https://dauntexlabs.com/category/india/) - Client-side GSTIN and Aadhaar (Verhoeff) validators, Aadhaar masker, UPI QR generator, amount in words (lakh/crore), Kruti Dev / DevLys / Chanakya to Unicode.
```

### e. A self-hostable / static web tools list (e.g. a list of "online developer tools") — only after a LICENSE is added (these lists require an OSI licence)

```markdown
- [dauntexlabs](https://github.com/jha-adrs/dauntexlabs) - 130+ developer and media tools as a static Next.js export; no backend, deployable to any static host.
```

---

## Checklist before posting

- [ ] Homepage and the linked tool pages load on mobile.
- [ ] Sharing the URL in a chat app shows the OG card.
- [ ] Each post says you made it.
- [ ] No absolute privacy claims crept in during edits.
- [ ] Sidebar rules re-read for each subreddit the day you post.
- [ ] GSC Page-indexing export saved.
