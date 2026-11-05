# Exam & form photo tools (batch 3) — design

Status: draft for review · 2026-11-05
Research: [2026-10-09-exam-form-research.md](2026-10-09-exam-form-research.md)

## Goal

Win the large, recurring Indian search demand around exam and government form uploads:
"resize image to 20kb", "photo resizer in kb", "increase image size in kb", "<exam> photo
signature size". One engine that turns any photo or signature into a JPG that passes a
portal's checks (pixel size, KB range, format), with programmatic pages per KB size and per
exam, each built from one data file.

Success: a user picks a page (e.g. IBPS), drops a phone photo and a signature photo, and
downloads files that pass the portal on the first try, without uploading anything to us.

## Scope

**In:**
- Exact pixel crop with a movable/zoomable crop box.
- Target KB range: JPEG quality search down to the maximum, and padding up to the minimum.
- Optional "brighten background to white" (simple threshold, not AI).
- Optional name + date strip (TNPSC and similar).
- Correct JFIF density (DPI) in the output.
- Per-size pages and per-exam pages, a `/photo/` hub, one registry card.

**Out (YAGNI):**
- PDF compression to a target size (deferred by the user).
- AI background removal.
- A signature cleaner (ink isolation).
- A helper that stacks UPSC's three signatures into one image: the UPSC page explains how to
  sign three times on one sheet and photograph it instead. (Recommended by Claude; user did
  not choose otherwise.)
- Exams whose specs could not be confirmed from an official notice: UPSSSC, BPSC, MPESB,
  India Post GDS, Parivahan driving licence.

## Architecture

| Piece | Where | New / reused | Why there |
|---|---|---|---|
| Fit engine (crop maths, quality search, padding, DPI patch, whitening) | `lib/photo-fit.ts` | New | Pure functions, unit-testable without a browser. The canvas encode step is passed in as a function so tests can run it in jsdom and e2e runs the real encoder. |
| Presets data | `lib/photo-presets.ts` | New | Single source of truth for pages, sitemap and tests, the same pattern as `lib/conversions.ts` `PAIRS`. |
| Crop + stamp helpers | `lib/stamp.ts` (`coverCrop`, `layoutStamp`, `fitText`, `formatDateIN`) | Reused | Already powers `PhotoDateStamp`; the name/date strip is the same job. |
| UI | `components/photo/PhotoFitter.tsx` (`'use client'`, prop `preset?: string`) | New | One component for every page. Mirrors `components/convert/ConvertImage.tsx`, which takes a preset prop. Composes `components/ui/kit.tsx` (`FileDrop`, `Field`, `Select`, `Button`, `Notice`, `downloadBlob`). |
| Programmatic route | `app/photo/[slug]/page.tsx` (server, `generateStaticParams`, `generateMetadata`, `dynamicParams = false`) | New | Same shape as `app/convert/[slug]/page.tsx`. A separate route rather than registry entries, so 20 presets do not become 20 homepage cards (approach B was rejected). |
| Hub | `app/photo/page.tsx` | New | Lists size pages and exam pages; `CollectionPage`/`ItemList` JSON-LD like `app/category/[slug]/page.tsx`. |
| Registry card | `lib/tools.ts` entry `exam-photo-resizer` (category India) + `components/tools/ExamPhotoResizer.tsx` (renders `PhotoFitter` with an exam picker) + `lib/tool-content/exam-photo-resizer.ts` | New | Gives the homepage, search and India hub one entry point. |
| Sitemap | `app/sitemap.ts` adds `/photo/` and every preset | Modified | Derived from `PHOTO_PRESETS`. |
| Links | India hub copy (`lib/hubs.ts`), footer | Modified | Internal links to the new hub. |

Data flow: user drops a file → `FileDrop` gives a `File` → object URL → `Image` decode (EXIF
orientation applied by the browser) → user adjusts the crop box → `photo-fit` draws the crop
to a canvas at the target pixels (white fill first, optional whitening, optional strip) →
quality search calls `canvas.toBlob('image/jpeg', q)` until the size lands in range → DPI
bytes patched → padding added if still under the minimum → checklist shown → `downloadBlob`
saves `photo.jpg` / `signature.jpg`. Nothing leaves the browser. Canvas re-encoding drops all
EXIF, including GPS.

## Engine (`lib/photo-fit.ts`)

- `cropRect(srcW, srcH, dstW, dstH, zoom, offsetX, offsetY)`: the source rectangle for a
  cover-crop with zoom ≥ 1 and offsets in −1..1. Built on `coverCrop`.
- `byteBounds([minKb, maxKb])`: `min = minKb × 1024`, `max = maxKb × 1000`. That makes the file pass
  whether the portal means 1000 or 1024 bytes per KB. The target is the midpoint. If the
  range collapses (`min > max`), use `[minKb × 1000, maxKb × 1000]`.
- `fitQuality(encode, bounds)`: binary search on quality 0.30–0.95 (at most 8 encodes) for the
  highest quality whose size is ≤ max. Returns `{ blob, quality }` or `{ tooBig: true }`.
- Too big at quality 0.30: for size pages (no fixed pixels) scale down by 0.85 per step,
  up to 6 steps, and say so. For exam pages with fixed pixels, show an error that suggests
  a plainer background or a closer crop. This should almost never happen at 200×230.
- Too small at quality 0.95: `padJpeg(bytes, minBytes)` inserts one or more `COM` segments
  (max 65,533 bytes each) of spaces after the APP0. The pixels don't change, the file is still
  a valid JPEG, and the page says that it pads.
- `setJfifDensity(bytes, dpi)`: rewrites the APP0 units/density bytes (units = 1, dpi × dpi)
  when a JFIF APP0 is present; otherwise inserts one.
- `whiten(imageData, strength)`: pixels with high lightness and low saturation are pushed to
  pure white. Strength runs 0–100. Default off.

## Preset data (`lib/photo-presets.ts`)

```ts
type Upload = {
  type: 'photo' | 'signature' | 'thumb' | 'declaration'
  px?: [w: number, h: number]   // omitted = keep proportions (size pages)
  kb: [min: number, max: number]
  dpi?: number
  nameDate?: { stripPx: number } // name + date strip height inside px
  whiteBg?: boolean              // turns the whitening toggle on by default
  note?: string                  // e.g. "UPSC also takes a live photo at the exam centre"
}
type PhotoPreset = {
  slug: string
  kind: 'size' | 'exam'
  title: string                  // H1 and <title>
  description: string
  keywords: string[]
  uploads: Upload[]
  source?: { url: string; notice: string; checked: string } // required for kind 'exam'
  faq: { q: string; a: string }[]
}
```

Every exam page shows a spec table with "Checked against: <notice>, <date>. Confirm on the
official notice before you submit."

### Pages

Size pages (biggest search demand; the title also carries the "compress" wording):

| Slug | Upload |
|---|---|
| `resize-image-to-10kb` | photo, 5–10 KB |
| `resize-image-to-20kb` | photo, 10–20 KB |
| `resize-image-to-50kb` | photo, 30–50 KB |
| `resize-image-to-100kb` | photo, 60–100 KB |
| `resize-image-to-200kb` | photo, 120–200 KB |
| `resize-signature-to-20kb` | signature 140×60, 10–20 KB |
| `increase-image-size-in-kb` | photo, user-set minimum (padding and higher quality) |

Exam and form pages (values from the research doc, official sources only):

| Slug | Uploads |
|---|---|
| `ibps-photo-signature-size` | photo 200×230 20–50 KB; signature 140×60 10–20 KB; left thumb 240×240 20–50 KB 200 dpi; declaration 800×400 50–100 KB |
| `sbi-photo-signature-size` | same as IBPS (SBI declaration text differs; noted) |
| `ssc-signature-size` | signature 10–20 KB JPG (photo is captured live — explained) |
| `rrb-signature-size` | signature ≥140×60, 30–49 KB (photo captured live — explained) |
| `upsc-photo-signature-size` | photo 20–200 KB (face ≥ 75 %); signature 350–500 px wide, 20–100 KB, three signatures on one sheet (guidance) |
| `neet-photo-signature-size` | photo 10–200 KB; signature 10–100 KB; finger/thumb impressions 10–200 KB |
| `jee-main-photo-signature-size` | photo 10–200 KB; signature 10–100 KB |
| `cuet-photo-signature-size` | photo 10–200 KB; signature 10–50 KB |
| `ctet-photo-signature-size` | photo 3.5×4.5 cm 10–100 KB; signature 3.5×1.5 cm 3–30 KB |
| `tnpsc-photo-signature-size` | photo 130×170 incl. 55 px name/date strip, 20–50 KB, 200 dpi; signature 10–20 KB |
| `passport-photo-size` | photo 630×810, white background |
| `pan-card-photo-signature-size` | photo ≤ 20 KB (3.5×2.5 cm); signature ≤ 10 KB |
| `indian-visa-photo-size` | square photo 350–1000 px, 10–300 KB |

cm sizes convert to px at 200 dpi (3.5×4.5 cm → 276×354). Values are re-checked against the
research doc when the plan is written.

## UI (`PhotoFitter`)

- One section per upload in the preset. Each section has a file drop, a crop preview showing
  the exact output frame, zoom/offset sliders, then toggles: whiten background (default from
  the preset), name + date strip (name and date fields, date defaulting to today).
- A "Make file" button runs the engine. The result shows a preview, the actual size in KB and
  pixels, and a checklist (✓ pixels, ✓ KB in range, ✓ JPG, ✓ DPI) before Download.
- Size pages also offer free pixel inputs. The generic registry tool has an exam picker that
  loads any preset.
- Errors appear as a `Notice` in plain words: what failed and what to try.
- Privacy: no user input in URL, title, storage or console; object URLs revoked.

## Testing

- `test/lib/photo-fit.test.ts`: crop maths; byte bounds incl. collapsed range; quality search
  with a fake encoder whose size is monotonic in quality (lands in range, reports too big);
  `padJpeg` reaches the minimum and keeps SOI/EOI and the image data intact; `setJfifDensity`
  bytes; `whiten` on a synthetic ImageData.
- `test/lib/photo-presets.test.ts`: unique slugs; every exam preset has a source URL and a
  `checked` date no more than 12 months old (fails CI when specs go stale); ranges sane
  (min < max, px positive); keywords present.
- `test/app/PhotoPage.test.tsx`: metadata, JSON-LD (FAQPage, HowTo optional) and the spec table.
- `test/tools/PhotoFitter.test.tsx`: flow (drop → make → download fired).
- `test/e2e/photo.spec.ts` (real Chromium): for IBPS, download each file and assert JPEG
  magic, exact pixels (parsed from SOF), size within the bounds, and the DPI bytes; for
  `increase-image-size-in-kb`, a tiny input comes out above the minimum and still decodes.
- `test/e2e/privacy.spec.ts`: canary in a file name and in the name strip.
- Sitemap count test derived from `PHOTO_PRESETS`; homepage-bundle check that `PhotoFitter`
  stays out of the shared JS.

## Risks

- Portal rules change yearly: the 12-month staleness test and the "confirm on the notice"
  line handle this.
- Thin-content risk on size pages: each one gets its own FAQ and worked example, not just a
  swapped number.
- KB definitions differ between portals: handled by the 1000/1024 bounds above.
