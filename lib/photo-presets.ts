// Upload specs for exam / form photo pages and the file-size pages.
// Single source of truth for /photo/<slug>/, the hub, the sitemap and tests.
// Exam values come from docs/superpowers/specs/2026-10-09-exam-form-research.md §1
// (official notices only); page set and passport/SSC/PAN calls follow
// docs/superpowers/specs/2026-11-06-advisor-impact-review.md.

import { DEFAULT_DPI } from '@/lib/photo-fit'

export type UploadType = 'photo' | 'signature' | 'thumb' | 'declaration'
export type Upload = {
  type: UploadType
  label?: string
  px?: [w: number, h: number]
  width?: number
  kb: [min: number, max: number]
  dpi?: number
  nameDate?: { stripPx: number }
  whiteBg?: boolean
  note?: string
}
export type PhotoPreset = {
  slug: string
  kind: 'size' | 'exam'
  title: string
  description: string
  keywords: string[]
  intro: string[]
  uploads: Upload[]
  source?: { url: string; notice: string; checked: string }
  faq: { q: string; a: string }[]
}

/** Centimetres to pixels at the given DPI (default 200, the usual form scan resolution). */
export function cmToPx(cm: number, dpi = DEFAULT_DPI): number {
  return Math.round((cm / 2.54) * dpi)
}

const CHECKED = '2026-10-09'

const PRIVACY_FAQ = {
  q: 'Is my photo sent to a server?',
  a: 'The tool is designed to run in your browser: the photo is cropped, compressed and saved on your device, and the page does not need an account. Close the tab and the in-memory copy is gone.',
}

const IBPS_UPLOADS = (declarationNote: string): Upload[] => [
  { type: 'photo', px: [200, 230], kb: [20, 50], note: 'IBPS also takes a live photo during the application.' },
  { type: 'signature', px: [140, 60], kb: [10, 20], note: 'Black ink on white paper, not in capital letters.' },
  { type: 'thumb', label: 'Left thumb impression', px: [240, 240], kb: [20, 50], dpi: 200, note: '3 × 3 cm at 200 DPI.' },
  { type: 'declaration', px: [800, 400], kb: [50, 100], dpi: 200, note: declarationNote },
]

export const PHOTO_PRESETS: PhotoPreset[] = [
  /* ---- size pages ------------------------------------------------- */
  {
    slug: 'resize-image-to-20kb',
    kind: 'size',
    title: 'Resize image to 20 KB (compress photo to 20 KB)',
    description:
      'Compress a photo to 20 KB or less as a JPG. Set exact pixels or keep proportions; the tool searches JPEG quality and steps the size down until the file lands between 10 and 20 KB.',
    keywords: ['resize image to 20kb', 'compress image to 20kb', 'photo resizer in kb', 'reduce photo size to 20kb', 'image 20kb'],
    intro: [
      'Many government and bank forms cap a photo at 20 KB. A modern phone photo is often 3–5 MB at 4000 × 3000 px, so getting it that small takes two things at once: fewer pixels and stronger JPEG compression.',
      'Worked example: a 3.2 MB, 4032 × 3024 phone photo is first capped at 1000 px wide. At 1000 × 750 even the lowest quality the tool will use (30%) is usually well above 20 KB, so it steps the size down by 15% at a time — typically ending somewhere near 450–550 px wide — and keeps the highest quality that lands around 18 KB, a little under the 20 KB ceiling. If your form also fixes the pixels, type them in and the tool only searches quality.',
    ],
    uploads: [{ type: 'photo', kb: [10, 20] }],
    faq: [
      { q: 'Why does my 20 KB photo look soft?', a: '20 KB is very little data for a colour photo. Crop closer to the face, use a plain background and set the exact pixel size your form asks for — fewer pixels leave more bytes for detail.' },
      { q: 'Does 20 KB mean 20,000 or 20,480 bytes?', a: 'Portals differ. The tool keeps the file at or under 20,000 bytes and at or above 10 × 1024 bytes, so it passes under either reading.' },
      { q: 'Can I keep the original width and height?', a: 'Leave the pixel fields blank to keep proportions. If the file cannot reach 20 KB at that size, the tool scales it down and tells you the final pixels.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'resize-image-to-50kb',
    kind: 'size',
    title: 'Resize image to 50 KB (compress JPG to 50 KB)',
    description:
      'Compress a photo or scanned page to between 30 and 50 KB as a JPG, with optional exact pixels. Quality is searched automatically so the file lands in range on the first try.',
    keywords: ['resize image to 50kb', 'compress image to 50kb', 'reduce image size to 50kb', 'jpg 50kb', 'photo size 50kb'],
    intro: [
      'A 50 KB ceiling is the most common limit on exam and job forms for photos, thumb impressions and small scanned documents. At 50 KB a face photo can stay sharp, so the aim is to use the space well rather than crush the file.',
      'Worked example: a scanned 1240 × 1754 px page (an A4 scan at 150 DPI) of about 600 KB is capped at 1000 px on its long side, giving 707 × 1000 px. Text on white compresses well, so a fairly high quality usually lands around 45 KB, a little under the 50 KB ceiling, without any scaling. A busy colour photo at the same size may need lower quality or a step down in pixels; the result line shows exactly what happened.',
    ],
    uploads: [{ type: 'photo', kb: [30, 50] }],
    faq: [
      { q: 'Why does the file land a little under 50 KB?', a: 'When the top-quality file is too big, the tool aims about 85% of the way up the range. That keeps quality high while leaving a small margin under the ceiling. The result shows the exact size.' },
      { q: 'My form says "maximum 50 KB" with no minimum. Is 30 KB fine?', a: 'Yes. Set Min KB to 0 if you want the tool to go as small as it likes; the default 30 KB floor just keeps quality reasonable.' },
      { q: 'Can I compress a PNG or screenshot?', a: 'Yes. Any image the browser can open is redrawn and saved as a JPG, which is what most forms ask for. Transparent areas become white.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'resize-image-to-100kb',
    kind: 'size',
    title: 'Resize image to 100 KB (photo compressor in KB)',
    description:
      'Make a JPG between 60 and 100 KB from any photo. Keep the original proportions or set exact pixels; the tool picks the highest JPEG quality that fits.',
    keywords: ['resize image to 100kb', 'compress image to 100kb', 'photo compressor in kb', 'reduce photo size 100kb', 'image size 100kb'],
    intro: [
      'A 100 KB limit appears on handwritten-declaration uploads, university forms and many scholarship portals. It is generous enough that a 1000 px photo usually fits at high quality, so most of the work is choosing the right quality rather than shrinking pixels.',
      'Worked example: a 2.4 MB portrait from a camera at 3000 × 4000 px is capped to 750 × 1000 px. At that size a high quality typically lands around 90 KB, a little under the 100 KB ceiling, with no scaling at all. A plain-background photo might fit even at 95%, in which case the tool stops after one encode. Check the result line for the exact KB and pixels before you download.',
    ],
    uploads: [{ type: 'photo', kb: [60, 100] }],
    faq: [
      { q: 'What if my photo is already under 100 KB?', a: 'If it is under the 60 KB floor after re-encoding at high quality, the tool pads the file with blank bytes to reach the minimum. Set Min KB to 0 to skip that.' },
      { q: 'Will the file keep my camera details or location?', a: 'The output is redrawn on a canvas and saved as a new JPG, so camera EXIF data such as GPS location is not copied into it.' },
      { q: 'Which pixel size should I use?', a: 'Use the size your form names. If it names none, leave the fields blank: the tool keeps proportions and caps the long side at 1000 px.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'increase-image-size-in-kb',
    kind: 'size',
    title: 'Increase image size in KB (make a photo bigger in KB)',
    description:
      'Raise a small JPG above a form’s minimum file size, for example from 12 KB to over 50 KB, without changing the picture: higher quality first, then blank padding bytes.',
    keywords: ['increase image size in kb', 'increase photo size in kb', 'increase jpg size', 'make image bigger in kb', 'photo size increase 50kb'],
    intro: [
      'Forms reject files that are too small as well as too big — "minimum 20 KB" or "50–100 KB" is common. Most resizers can only shrink, so a small photo from a messaging app gets stuck under the floor.',
      'Worked example: a 640 × 480 photo that was forwarded through a chat app and is now 12 KB. Re-encoding it at 95% quality might bring it to about 45 KB, still short of a 50 KB minimum. The tool then adds blank comment bytes inside the JPEG until it passes 50 × 1024 bytes. The pixels are exactly the same and the file still opens everywhere; the page tells you it was padded. Change Min KB and Max KB to match your form.',
    ],
    uploads: [{ type: 'photo', kb: [50, 100] }],
    faq: [
      { q: 'Does padding change how the photo looks?', a: 'No. The extra bytes go into a JPEG comment segment that image viewers ignore. The decoded picture is identical.' },
      { q: 'Will a portal accept a padded file?', a: 'A padded file is a standard JPG. Portals generally check type, pixels and size, all of which it passes. If a form also checks pixels, set them in the width and height fields.' },
      { q: 'Can I just enlarge the pixels instead?', a: 'Yes — type a larger width and height. Upscaling adds bytes but also softens the image, so padding is usually the better choice when only the KB minimum matters.' },
      PRIVACY_FAQ,
    ],
  },

  /* ---- exam and form pages ----------------------------------------- */
  {
    slug: 'ibps-photo-signature-size',
    kind: 'exam',
    title: 'IBPS photo and signature size 2026: resizer',
    description:
      'Make the four IBPS uploads in one place: photo 200 × 230 px (20–50 KB), signature 140 × 60 px (10–20 KB), left thumb 240 × 240 px and handwritten declaration 800 × 400 px at 200 DPI.',
    keywords: ['ibps photo size', 'ibps signature size', 'ibps photo resize', 'ibps thumb impression size', 'handwritten declaration for ibps', 'ibps po clerk photo size'],
    intro: [
      'IBPS PO, Clerk and RRB applications ask for four scanned files, each with its own pixel size and KB range, plus a live photo taken during the application. A file outside its range stops the form.',
      'Worked example: a 3 MB phone photo becomes a 200 × 230 px JPG at the highest quality that stays under 50 KB — often 95% at that small size. A signature photographed on white paper becomes 140 × 60 px, padded up to 10 KB if it compresses smaller. The handwritten declaration — written in English, not in capitals — is photographed and saved at 800 × 400 px and 200 DPI, between 50 and 100 KB; if a short declaration compresses below 50 KB the tool pads it so it still passes.',
    ],
    uploads: IBPS_UPLOADS(
      'Write in English, not in capitals: "I, ____ (Name of the candidate), hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required."',
    ),
    source: {
      url: 'https://ibpsreg.ibps.in/rrbxivaug25/uploads/loadpdf.php?file=k7m5p+fQ15e6zM3ryt%2FG39CYn5S+pdGTpaeV6Kqlcg%3D%3D&t=1LHArOLA2di0yczXwNDa083LmNWypw%3D%3D',
      notice: 'IBPS CRP RRB-XIV guideline annexure, Aug 2025',
      checked: CHECKED,
    },
    faq: [
      { q: 'Is 200 × 230 px compulsory for the IBPS photo?', a: 'The annexure calls it the preferred size and fixes the 20–50 KB range. Matching both is the safest way to avoid a rejected upload.' },
      { q: 'How do I make the handwritten declaration?', a: 'Write the declaration text in English on white paper in your own handwriting, not in capitals, photograph it in good light, then drop it in the declaration box. The tool crops it to 800 × 400 px at 200 DPI.' },
      { q: 'Do PO, Clerk and RRB use the same sizes?', a: 'The 2025 annexures for RRB-XIV and the PSB recruitment are identical. Confirm on the notice for your exam before you submit.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'sbi-photo-signature-size',
    kind: 'exam',
    title: 'SBI Clerk photo, signature and declaration size',
    description:
      'Resize the SBI Clerk (Junior Associate) uploads: photo 200 × 230 px, signature 140 × 60 px, left thumb 240 × 240 px and handwritten declaration 800 × 400 px, each in its KB range.',
    keywords: ['sbi clerk photo size', 'sbi photo signature size', 'sbi handwritten declaration', 'sbi ja photo resize', 'sbi po photo size'],
    intro: [
      'SBI runs its Clerk (Junior Associate) applications on the same portal as IBPS, with the same four uploads and sizes. The difference is the wording of the handwritten declaration, which adds your date of birth and a line confirming the signature, photograph and thumb impression are yours.',
      'Worked example: a signature signed with a thick pen and photographed on a phone is cropped close and saved at 140 × 60 px; at that size it usually lands around 12–16 KB inside the 10–20 KB range. The left thumb impression, pressed on white paper with a stamp pad, becomes 240 × 240 px at 200 DPI and about 35 KB.',
    ],
    uploads: IBPS_UPLOADS(
      'SBI wording adds your date of birth: "I, ____ (Name of the candidate), Date of Birth ____, hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required. The signature, photograph and left thumb impression is of mine."',
    ),
    source: {
      url: 'https://sbi.bank.in/documents/77530/52947104/JA+2025+-Detailed+Advt.pdf/8f7ff18f-1972-21c8-9212-5a8cf85a7099?t=1754398573326',
      notice: 'SBI JA 2025 Advt CRPD/CR/2025-26/06',
      checked: CHECKED,
    },
    faq: [
      { q: 'Is the SBI declaration the same as IBPS?', a: 'The sizes are the same, but SBI’s text adds "Date of Birth" and "The signature, photograph and left thumb impression is of mine". Copy the wording from your notice exactly.' },
      { q: 'Does SBI PO use the same sizes?', a: 'It is the same portal and very likely the same sizes, but this page was checked against the Clerk notice only. Confirm on the PO notice before you submit.' },
      { q: 'Which thumb should I use?', a: 'The left thumb. If that is not possible, the notice explains the alternatives.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'ssc-signature-size',
    kind: 'exam',
    title: 'SSC signature size: resize signature to 10–20 KB',
    description:
      'Resize a signature for SSC CGL, CHSL, MTS and GD: JPG, 10–20 KB, about 6.0 × 2.0 cm (472 × 157 px at 200 DPI). The SSC photo is captured live, so only the signature is prepared here.',
    keywords: ['ssc signature size', 'resize signature to 20kb', 'signature resize 10 to 20 kb', 'signature resize 6cm x 2cm', 'ssc cgl signature size', 'signature compressor 20kb'],
    intro: [
      'On the SSC one-time registration the photo is captured live by webcam or phone, and capturing a photo of an existing photo is grounds for rejection. The only image you prepare is your signature: a JPG between 10 and 20 KB.',
      'Worked example: sign twice on plain white paper with a dark pen, photograph the better one, and drop it here. The tool crops it to 472 × 157 px — 6.0 × 2.0 cm at 200 DPI — and keeps the highest JPEG quality that stays under 20 KB. A faint signature may compress below 10 KB; the tool then pads the file so it still clears the minimum. The same steps work for any form that asks for a signature resized to 20 KB.',
    ],
    uploads: [
      {
        type: 'signature',
        px: [cmToPx(6), cmToPx(2)],
        kb: [10, 20],
        note: 'Your photo is captured live on the SSC portal, so only the signature is uploaded. The notice says about 6.0 × 2.0 cm in one place and 4.0 × 2.0 cm in its annexure; this uses 6.0 × 2.0 cm.',
      },
    ],
    source: {
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf',
      notice: 'SSC CGL 2026 notice HQ-C11018/1/2026-C-1',
      checked: CHECKED,
    },
    faq: [
      { q: 'What size should the SSC signature be?', a: 'The notice asks for a JPG of 10–20 KB, about 6.0 × 2.0 cm in its body, while its annexure says 4.0 × 2.0 cm. This page uses 6.0 × 2.0 cm (472 × 157 px at 200 DPI). Confirm on the official notice before you submit.' },
      { q: 'Do I need to upload a photo for SSC?', a: 'No. The photo is captured live during registration. Do not hold up a printed photo — the notice treats that as grounds for rejection.' },
      { q: 'Can I use this to resize a signature to 20 KB for other forms?', a: 'Yes. The output is a standard 10–20 KB JPG. If your form fixes different pixels, use the 20 KB page and type them in.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'rrb-signature-size',
    kind: 'exam',
    title: 'RRB signature size (Group D): 30–49 KB resizer',
    description:
      'Resize your signature for RRB Group D (CEN 09/2025): JPG, 30–49 KB, at least 140 × 60 px, fitting a 35 × 20 mm box. The RRB photo is captured live.',
    keywords: ['rrb signature size', 'rrb group d signature size', 'railway signature resize', 'rrb signature 30 to 49 kb', 'rrb signature resize'],
    intro: [
      'Railway Recruitment Board forms for Group D capture your photo live, so the upload you prepare is the signature. Its range is unusual: 30–49 KB, much larger than the 10–20 KB most forms ask for, and a file under 30 KB is rejected.',
      'Worked example: a signature photographed on white paper is cropped to 276 × 157 px, the 35 × 20 mm box at 200 DPI. A clean signature on white often compresses to about 20 KB even at 95% quality, so the tool pads it with blank bytes to clear 30 KB; a darker, more detailed scan may land near 39 KB on its own. Whitening is on by default to keep the background clean.',
    ],
    uploads: [
      {
        type: 'signature',
        px: [cmToPx(3.5), cmToPx(2)],
        kb: [30, 49],
        dpi: 200,
        whiteBg: true,
        note: 'The photo is captured live (CEN 09/2025 §16.4). Sign in black ink, cursive, not in capitals.',
      },
    ],
    source: {
      url: 'https://rrbajmer.gov.in/Upload_PDF/Final-Detailed%20CEN%2009-2025%20Level-1-updated%20on%2030012026-639054049190206941.pdf',
      notice: 'RRB CEN 09/2025 (updated 30-01-2026)',
      checked: CHECKED,
    },
    faq: [
      { q: 'Why does RRB need such a large signature file?', a: 'CEN 09/2025 sets 30–49 KB for the signature. Small signature scans are often under that, which is why the tool can pad the file.' },
      { q: 'Does RRB NTPC use the same size?', a: 'Not confirmed. Secondary sources give 30–70 KB for NTPC; check the NTPC notice before you submit.' },
      { q: 'Can I sign in capital letters?', a: 'No. The notice asks for a cursive signature in black ink on a white background.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'upsc-photo-signature-size',
    kind: 'exam',
    title: 'UPSC photo and signature size 2026 (three signatures)',
    description:
      'Prepare the UPSC CSE 2026 uploads: photo 20–200 KB with the face covering at least 75%, and one image holding three signatures, 350–500 px and 20–100 KB.',
    keywords: ['upsc photo size', 'upsc signature size', 'upsc three signature', 'upsc photo resize', 'upsc cse 2026 photo size'],
    intro: [
      'UPSC’s new portal asks for an uploaded photo and also takes a live photo, which is face-matched against the upload. The signature upload is unusual: the same signature three times, one under another, in a single image.',
      'Worked example: sign three times on one plain white sheet, photograph it, and drop it in the signature box. The tool crops it to a 450 × 500 px frame — inside the 350–500 px rule both ways, even from a tall portrait photo — and keeps the highest quality under 100 KB. For the photo, zoom in until your face fills at least three quarters of the frame.',
    ],
    uploads: [
      { type: 'photo', kb: [20, 200], whiteBg: true, note: 'Face should cover at least 75% of the photo.' },
      {
        type: 'signature',
        label: 'Signature (three on one sheet)',
        px: [450, 500],
        kb: [20, 100],
        note: 'Sign three times, one under another, on plain white paper and photograph the sheet. UPSC also takes a live photo at the exam centre and matches it with this one.',
      },
    ],
    source: {
      url: 'https://upsconline.nic.in/ngrp/assets/PDF/instruction-photo-signature-upload-upsc.pdf',
      notice: 'UPSC CSE 2026 notice 05/2026-CSE and upsconline photo/signature instructions',
      checked: CHECKED,
    },
    faq: [
      { q: 'How do I upload three signatures?', a: 'Sign three times, one below another, on one sheet of white paper, then photograph the sheet. It becomes a single image, which is what the portal expects.' },
      { q: 'Do I still need the name and date on the UPSC photo?', a: 'That was a rule on the older portal. The 2026 instructions checked here do not ask for it.' },
      { q: 'Why is my face covering only part of the photo?', a: 'Use the Zoom and Move sliders before making the file; the preview shows the exact output frame.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'neet-photo-signature-size',
    kind: 'exam',
    title: 'NEET UG 2026 photo, signature and thumb impression size',
    description:
      'Resize the NEET UG 2026 uploads: photo 10–200 KB on white, signature 10–100 KB, and left- and right-hand finger and thumb impressions, 10–200 KB each.',
    keywords: ['neet photo size', 'neet signature size', 'neet thumb impression size', 'neet ug 2026 photo size', 'neet left hand right hand impression'],
    intro: [
      'NEET UG 2026 asks for four images: a photo, a signature and two impressions — the fingers and thumb of the left hand, and of the right hand. The postcard-size photo is a physical print you carry, not an upload, whatever older guides say.',
      'Worked example: press all four fingers and the thumb of your left hand on white paper, photograph it, and drop it in the left-hand box; then the same for the right hand. Each keeps its proportions, is capped at 1000 px and saved at the highest quality that stays under 200 KB. The photo, with your face filling about 80% and both ears visible, goes through the same search with whitening on.',
    ],
    uploads: [
      { type: 'photo', kb: [10, 200], whiteBg: true, note: 'Face should cover about 80% of the photo with both ears visible.' },
      { type: 'signature', kb: [10, 100] },
      { type: 'thumb', label: 'Left-hand fingers and thumb', kb: [10, 200], note: 'Make one file for each hand.' },
      { type: 'thumb', label: 'Right-hand fingers and thumb', kb: [10, 200], note: 'Make one file for each hand.' },
    ],
    source: {
      url: 'https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf',
      notice: 'NEET UG 2026 information bulletin',
      checked: CHECKED,
    },
    faq: [
      { q: 'Do I upload a postcard-size photo for NEET 2026?', a: 'No. The 2026 bulletin has no postcard upload; the postcard photo is a print you bring along.' },
      { q: 'What goes in the finger and thumb impression files?', a: 'All four fingers and the thumb of one hand, pressed on white paper. Make one image for the left hand and one for the right.' },
      { q: 'Can the NEET photo be black and white?', a: 'The bulletin allows colour or black and white, on a white background.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'jee-main-photo-signature-size',
    kind: 'exam',
    title: 'JEE Main 2026 photo and signature size',
    description:
      'Resize the JEE Main 2026 photo (10–200 KB, face about 80% with ears visible, white background) and signature (10–100 KB) as JPGs.',
    keywords: ['jee main photo size', 'jee main signature size', 'jee mains photo resize', 'jee main 2026 photo size', 'nta photo size'],
    intro: [
      'JEE Main is run by NTA and asks for two images in the application: a recent photo and your signature. Both are JPGs with generous ranges, so the usual problem is a phone photo that is several megabytes too big, not one that is too small.',
      'Worked example: a 4 MB selfie taken against a white wall is zoomed until the face fills about 80% of the frame, capped at 1000 px and saved at the highest quality that stays under 200 KB. The signature, signed on white paper, keeps its proportions and stays under 100 KB. Both files keep 200 DPI.',
    ],
    uploads: [
      { type: 'photo', kb: [10, 200], whiteBg: true, note: 'Face should cover about 80% of the photo with both ears visible.' },
      { type: 'signature', kb: [10, 100] },
    ],
    source: {
      url: 'https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2025/11/202511021649722475.pdf',
      notice: 'JEE Main 2026 information bulletin',
      checked: CHECKED,
    },
    faq: [
      { q: 'Is a selfie acceptable for JEE Main?', a: 'The bulletin asks for a clear, recent photo with the face covering about 80% and ears visible on a white background. Whatever camera you use, crop to that framing.' },
      { q: 'Does session 2 use the same sizes?', a: 'The 2026 bulletin covers both sessions. Confirm on the current bulletin before you submit.' },
      { q: 'Do I need fixed pixels?', a: 'The bulletin sets only the file size, so the tool keeps your crop’s proportions.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'cuet-photo-signature-size',
    kind: 'exam',
    title: 'CUET UG 2026 photo and signature size',
    description:
      'Resize the CUET UG 2026 photo (10–200 KB) and signature (10–50 KB) as JPGs. CUET also takes a live photo during the application.',
    keywords: ['cuet photo size', 'cuet signature size', 'cuet ug 2026 photo size', 'cuet photo resize', 'cuet signature 50kb'],
    intro: [
      'CUET UG takes a live photo during the application and also asks you to upload one. The signature has a tighter ceiling than JEE or NEET: 50 KB, not 100 KB.',
      'Worked example: a signature photographed in daylight at 3000 × 1200 px is capped at 1000 × 400 px. With a dark pen on white paper it usually fits under the 50 KB ceiling at a high JPEG quality. A faint signature on grey paper compresses less well; turn on whitening to clean the background before making the file.',
    ],
    uploads: [
      { type: 'photo', kb: [10, 200] },
      { type: 'signature', kb: [10, 50] },
    ],
    source: {
      url: 'https://cdnbbsr.s3waas.gov.in/s3d1a21da7bca4abff8b0b61b87597de73/uploads/2026/01/202601031633478370.pdf',
      notice: 'CUET UG 2026 information bulletin',
      checked: CHECKED,
    },
    faq: [
      { q: 'Why is the CUET signature limit 50 KB?', a: 'That is the range in the 2026 bulletin (10–50 KB). The photo range is wider, 10–200 KB.' },
      { q: 'Does the live photo replace the upload?', a: 'No. CUET asks for both a live capture and an uploaded photo.' },
      { q: 'Does the photo need a white background?', a: 'The bulletin checked here does not state one, so whitening is off by default. A plain, light background still gives the cleanest result.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'ctet-photo-signature-size',
    kind: 'exam',
    title: 'CTET photo and signature size (3.5 × 4.5 cm)',
    description:
      'Resize the CTET photo to 3.5 × 4.5 cm (276 × 354 px at 200 DPI, 10–100 KB) and the signature to 3.5 × 1.5 cm (276 × 118 px, 3–30 KB).',
    keywords: ['ctet photo size', 'ctet signature size', 'ctet photo resize', 'ctet 3.5 x 4.5 cm', 'ctet signature 3.5 x 1.5 cm'],
    intro: [
      'The CTET bulletin gives sizes in centimetres rather than pixels. At the usual 200 DPI scanning resolution a 3.5 × 4.5 cm photo is 276 × 354 px and a 3.5 × 1.5 cm signature is 276 × 118 px, which is what the tool produces.',
      'Worked example: the photo, cropped to 276 × 354 px from a phone shot, usually fits under 100 KB at a high quality. The signature has a very low floor — 3 KB — and a 30 KB ceiling, so at 276 × 118 px a clean signature usually fits at a high quality without any scaling or padding.',
    ],
    uploads: [
      { type: 'photo', px: [cmToPx(3.5), cmToPx(4.5)], kb: [10, 100] },
      { type: 'signature', px: [cmToPx(3.5), cmToPx(1.5)], kb: [3, 30] },
    ],
    source: {
      url: 'https://cdnbbsr.s3waas.gov.in/s3443dec3062d0286986e21dc0631734c9/uploads/2026/05/202605111250310617.pdf',
      notice: 'CTET Sept 2026 information bulletin',
      checked: CHECKED,
    },
    faq: [
      { q: 'How many pixels is 3.5 × 4.5 cm?', a: 'At 200 DPI it is 276 × 354 px. The tool also writes 200 DPI into the file so it prints at 3.5 × 4.5 cm.' },
      { q: 'Is a 5 KB signature acceptable?', a: 'The CTET bulletin gives a 3–30 KB range, so a 5 KB file is inside it. The tool keeps the highest quality that stays under 30 KB.' },
      { q: 'Does CTET need a white background?', a: 'The bulletin checked here does not say so. A plain, light background is still the safe choice.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'tnpsc-photo-signature-size',
    kind: 'exam',
    title: 'TNPSC photo with name and date: size and resizer',
    description:
      'Make the TNPSC photo with your name and the date printed at the bottom (130 × 170 px, 55 px strip, 20–50 KB, 200 DPI) and the signature (10–20 KB, 200 DPI).',
    keywords: ['tnpsc photo size', 'tnpsc photo with name and date', 'tnpsc signature size', 'tnpsc photo resize', 'photo with name and date online'],
    intro: [
      'TNPSC asks for a studio-style photo with your name and the date of photography printed on a strip at the bottom: 130 × 170 px in total, of which the bottom 55 px is the strip. The date must be on or after the notification date.',
      'Worked example: drop a recent photo against a white wall, type your name as on the form, and keep today’s date. The tool draws the photo into the top 115 px, prints the name and date in the 55 px strip, whitens the background and saves it at 200 DPI inside 20–50 KB. The signature keeps its proportions and is saved inside 10–20 KB.',
    ],
    uploads: [
      {
        type: 'photo',
        px: [130, 170],
        kb: [20, 50],
        dpi: 200,
        nameDate: { stripPx: 55 },
        whiteBg: true,
        note: 'The date must be on or after the notification date. No selfies.',
      },
      { type: 'signature', kb: [10, 20], dpi: 200 },
    ],
    source: {
      url: 'https://tnpsc.gov.in/document/english/16_2025_Group%20VA_English.pdf',
      notice: 'TNPSC notification 16/2025 (Group VA)',
      checked: CHECKED,
    },
    faq: [
      { q: 'Which date should be on the TNPSC photo?', a: 'The date the photo was taken, on or after the notification date. The tool defaults to today; change it if the photo is older.' },
      { q: 'Why does 3.5 × 4.5 cm not match 130 × 170 px?', a: 'At 200 DPI, 3.5 × 4.5 cm would be 276 × 354 px. The notice gives both figures; this page uses the pixel values (130 × 170 px). Confirm on the official notice before you submit.' },
      { q: 'Can I use a selfie?', a: 'The notice asks for a studio-style photo and rules out selfies.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'passport-photo-size',
    kind: 'exam',
    title: 'Passport photo size online (630 × 810 px)',
    description:
      'Crop a photo to the Passport Seva size, 630 × 810 px, saved as a high-quality JPG under 1 MB. The ICAO guideline does not state a file-size limit and asks for an unaltered photo.',
    keywords: ['passport photo size', 'passport photo size in pixels', 'passport seva photo size', '630 x 810 photo', 'passport photo online india'],
    intro: [
      'Passport Seva’s ICAO photo guideline asks for a colour photo of 630 × 810 px with a white background and the face filling 80–85% of the frame. It does not state a file-size limit, and it asks for a photo "unaltered by computer software" — so the tool only crops and re-saves, without whitening or padding.',
      'Worked example: a 12-megapixel photo taken against a white wall is cropped so the face fills about 80% of the frame and resized to 630 × 810 px. Saved at 95% JPEG quality it typically weighs around 150–300 KB, well under 1 MB. If your background is not white, retake the photo rather than editing it.',
    ],
    uploads: [
      {
        type: 'photo',
        px: [630, 810],
        kb: [0, 1000],
        note: 'Passport Seva’s ICAO guideline does not state a file-size limit and asks for a photo unaltered by computer software. This keeps quality high (up to 95%) and the file under 1 MB, without whitening or padding. Shoot against a plain white wall.',
      },
    ],
    source: {
      url: 'https://mportal.passportindia.gov.in/pdf/Guidelines_for_ICAO_Compliant_Photographs_for_Passport_Applications.pdf',
      notice: 'Passport Seva ICAO photo guidelines',
      checked: CHECKED,
    },
    faq: [
      { q: 'What is the file-size limit for a passport photo?', a: 'The ICAO guideline on Passport Seva does not state one. The tool keeps quality high and the file under 1 MB.' },
      { q: 'Can I whiten the background of my passport photo?', a: 'The guideline asks for a photo unaltered by computer software, so whitening is off on this page. Take the photo against a white wall instead.' },
      { q: 'How much of the frame should my face fill?', a: '80–85%. Use Zoom and the Move sliders; the preview shows the exact 630 × 810 px frame.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'pan-card-photo-signature-size',
    kind: 'exam',
    title: 'PAN card photo and signature size (NSDL / Protean)',
    description:
      'Resize the PAN photo to 3.5 × 2.5 cm (197 × 276 px, up to 20 KB) and the signature to 2 × 4.5 cm (354 × 157 px, up to 10 KB), both JPG at 200 DPI.',
    keywords: ['pan card photo size', 'pan card signature size', 'photo resizer for pan card', 'nsdl pan photo size', 'pan card photo 20kb'],
    intro: [
      'Protean (NSDL) writes its sizes as height × width: the photo is 3.5 cm tall and 2.5 cm wide, the signature 2 cm tall and 4.5 cm wide. At 200 DPI that is a portrait 197 × 276 px photo and a landscape 354 × 157 px signature. Only a maximum file size is set.',
      'Worked example: a phone photo cropped to 197 × 276 px is saved at the highest quality that stays under 20 KB. The signature at 354 × 157 px stays under its 10 KB cap; a busy background may push it higher, so sign on plain white paper and turn whitening on if needed.',
    ],
    uploads: [
      { type: 'photo', px: [cmToPx(2.5), cmToPx(3.5)], kb: [0, 20], dpi: 200, note: 'Only a maximum is set.' },
      { type: 'signature', px: [cmToPx(4.5), cmToPx(2)], kb: [0, 10], dpi: 200, note: 'Only a maximum is set.' },
    ],
    source: {
      url: 'https://tin.tin.proteantech.in/pan/InstructionDSC.html',
      notice: 'Protean (NSDL) PAN InstructionDSC',
      checked: CHECKED,
    },
    faq: [
      { q: 'Is the PAN photo portrait or landscape?', a: 'Portrait: 3.5 cm tall and 2.5 cm wide, as on the card. The signature is landscape, 2 cm tall and 4.5 cm wide.' },
      { q: 'Is there a minimum size for the PAN photo?', a: 'Protean sets only a maximum (20 KB for the photo, 10 KB for the signature), so the tool never pads these files.' },
      { q: 'Does UTIITSL use the same sizes?', a: 'Not confirmed. This page was checked against Protean’s instructions only.' },
      PRIVACY_FAQ,
    ],
  },
  {
    slug: 'indian-visa-photo-size',
    kind: 'exam',
    title: 'Indian visa photo size: square JPG, 10–300 KB',
    description:
      'Make a square Indian visa photo (600 × 600 px, inside the 350–1000 px rule) as a JPG between 10 and 300 KB.',
    keywords: ['indian visa photo size', 'india visa photo resize', 'indian visa photo 350x350', 'visa photo square jpg', 'indian visa photo kb'],
    intro: [
      'The regular Indian visa application requires a square JPEG between 350 × 350 and 1000 × 1000 px and between 10 and 300 KB; the guideline says an application with a photo outside this will not be accepted.',
      'Worked example: a portrait phone photo of 3024 × 4032 px is cropped to a square around the face and resized to 600 × 600 px, comfortably inside the pixel rule. At 95% quality a 600 px photo is usually well under 300 KB, so it saves in a single pass with no scaling or padding.',
    ],
    uploads: [{ type: 'photo', px: [600, 600], kb: [10, 300], note: 'Must be square, 350–1000 px.' }],
    source: {
      url: 'https://indianvisaonline.gov.in/visa/VSS_IMAGE.pdf',
      notice: 'Indian visa VSS_IMAGE.pdf',
      checked: CHECKED,
    },
    faq: [
      { q: 'Why 600 × 600 px?', a: 'It sits well inside the 350–1000 px square rule and leaves room for detail within 300 KB.' },
      { q: 'Does the e-Visa use the same rule?', a: 'The e-Visa photo limit differs (up to 1 MB). This page follows the regular visa guideline.' },
      { q: 'Must the visa photo be square?', a: 'Yes. The guideline calls the square format mandatory.' },
      PRIVACY_FAQ,
    ],
  },
]

export function getPreset(slug: string): PhotoPreset | undefined {
  return PHOTO_PRESETS.find((p) => p.slug === slug)
}

const TYPE_LABEL: Record<UploadType, string> = {
  photo: 'Photo',
  signature: 'Signature',
  thumb: 'Thumb impression',
  declaration: 'Handwritten declaration',
}

export function uploadLabel(u: Upload): string {
  return u.label ?? TYPE_LABEL[u.type]
}

/** Fixed download names: 'photo.jpg', or 'thumb-1.jpg' / 'thumb-2.jpg' when a type repeats. */
export function uploadFileName(p: PhotoPreset, i: number): string {
  const type = p.uploads[i].type
  const same = p.uploads.filter((u) => u.type === type)
  if (same.length < 2) return `${type}.jpg`
  const n = p.uploads.slice(0, i + 1).filter((u) => u.type === type).length
  return `${type}-${n}.jpg`
}

export function specRow(u: Upload): { upload: string; pixels: string; size: string; dpi: string } {
  return {
    upload: uploadLabel(u),
    pixels: u.px ? `${u.px[0]} × ${u.px[1]} px` : u.width ? `${u.width} px wide` : 'Any (proportions kept)',
    size: u.kb[0] > 0 ? `${u.kb[0]}–${u.kb[1]} KB` : `up to ${u.kb[1]} KB`,
    dpi: String(u.dpi ?? DEFAULT_DPI),
  }
}
