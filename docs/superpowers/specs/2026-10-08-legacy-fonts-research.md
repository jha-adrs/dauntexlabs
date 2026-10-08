# Task 5 — legacy font research gate (2026-10-08)

Gate (owner's bar): a font ships only if **≥ 2 independent published character maps agree on
every glyph we map** AND **≥ 10 real word pairs from public text convert exactly**. Glyphs the
maps disagree on are left unmapped and pass through unchanged.

| Font | Result | One-line reason |
|---|---|---|
| Walkman-Chanakya 901 (and 905) | **PASS** | 3 independent maps agree on the core; 45+ real word pairs from Government of India PDFs (901 and 905) convert exactly |
| Shree-Lipi (Shree-Dev-0714) | **FAIL** | Only one map lineage for 0714; a second published "Shree714" table contradicts it on core letters; no real 0714 text obtained |
| Shivaji (finish) | **FAIL** | No new independent map exists; both published maps contradict real Shivaji01 text — stays `maintenance` |

---

## 1. Walkman-Chanakya 901 — PASS

### Is it the same as the existing `chanakya` font? No.
The existing `chanakya` table is the Chanakya (Bhaskar / Punjab Kesari) family: `·¤` = क, `ÖæÚUÌ` =
भारत. Walkman-Chanakya is a different encoding on the Remington / Kruti Dev-style layout:
`Hkkjr` = भारत, `d` = क. A separate page is **not** a duplicate.

It is also **not** Kruti Dev 010. The letters match, but many glyphs differ, often in common
words: `/` = ध (Kruti: ध्), `=` = त्र् and `=k` = त्र (Kruti: `=` = त्र), `(` `)` are literal
brackets (Kruti: `(` = `;`), `_` = `;` (Kruti: ऋ), `¼` = द्ध (Kruti: `(`), `½` = ऋ, `•` = ख,
`ç` = प्र, `Ø` = क्र, `æ` = द्र, `Ù` = त्त्, `Á` = द्म, `Ý` = फ्, Devanagari digits on
`ú`–`ÿ`/`ö`–`ù`, and `Q` is a "hook" glyph (`iQ` = फ). Reusing the Kruti table would garble
real Walkman text, so Walkman gets its own table and its own font id `walkman`.

### 901 vs 905
Same encoding. Evidence: (a) the IIT Delhi map applies one table to both 901 and 905; (b)
Pravakta labels its table "Walkman-Chanakya-901" and dtptips publishes the identical table as
"905"; (c) real `WalkmanChanakya901Bold` text in the Economic Survey prefaces (below) decodes
with exactly the same table as the surrounding `Walkman-Chanakya905Normal/Bold` body text.

### Published maps (independent)
1. **SIL International, `W-C-905.map`** (TECkit, MIT, 2006/2011, Lorna Evans) —
   https://github.com/silnrsi/wsresources/blob/master/scripts/Deva/legacy/w-c-905/mappings/W-C-905.map
   (file itself says "draft … unsure of x96 and x90").
2. **IIT Delhi AssisTech, `walkman.tsv` + `reorder.tsv`** (GPL, 2019; used for Walkman-Chanakya-901
   and -905 per `fonts.tsv`) —
   https://github.com/assistech-iitdelhi/InDesignFontConverters/tree/master/FontConverters
3. **Pravakta.com "Unicode to Walkman-Chanakya-901 Font Converter"** (array_one/array_two in
   page script) — https://www.pravakta.com/unicode-walkman-chanakya-901-font-converter/
   (dtptips.com/unicode-to-walkman-chanakya-font-converter/ ships a byte-identical copy as
   `unicodetowalkman905.js`; counted as the same source, not a fourth.)

Used as references only; no code copied. Tables compared with a script: SIL and IIT-D agree on
149 code points (the whole ASCII core, the conjunct block `Â`–`õ` except a few, digits,
punctuation) and disagree on 34. Pravakta was checked on every glyph it emits.

### Mapping decisions where the maps disagree
- **Mapped (≥ 2 maps agree, third disagrees, real text decides):**
  - `•` = ख — SIL + Pravakta (IIT-D says ऽ). Real: `çeq•` प्रमुख, `tksf•e` जोखिम, `•krk` खाता, `yk•` लाख.
  - `Á` = द्म — IIT-D + Pravakta (SIL says ड्म). Real: `iÁdqekj` पद्मकुमार.
  - `Ý` = फ् — IIT-D + Pravakta (SIL only has `ÝQ`). Real: `lkWÝVos;j` सॉफ्टवेयर, `eqÝr` मुफ्त.
  - `Q` after प (with any matras in between) = फ — SIL (`iQ`, `iQ+`, `iszQ`), IIT-D (general
    regex), Pravakta (`iQ`). Real: `eqækLiQhfr` मुद्रास्फीति, `fiQj` फिर.
  - **`Q` after व = क, `Q` after त्त = क्त** (follow-up at the coordinator's request; rule: one
    map + ≥ 3 eye-checked real occurrences counts as two sources). व+Q is in IIT-D only
    (`reorder.tsv`), त्त+Q in Pravakta only (क्त = `ÙkQ`). Real text, every word below checked
    on the rendered page (Economic Survey Hindi chapters 2019-20 … 2025-26 and 2022-23 preface):
    - व+Q: `osQ` के, `mlosQ` उसके, `blosQ` इसके, `osQanz` / `osaQnz` केंद्र, `laosQrk{kj`
      संकेताक्षर (901Bold), `oqQekj` कुमार, `oqQy` कुल — 44 occurrences in the sample.
    - त्त+Q: `miHkksÙkQk` उपभोक्ता, `la;qÙkQ` संयुक्त, `vfrfjÙkQ` अतिरिक्त, `O;fÙkQ` व्यक्ति,
      `eqÙkQ` मुक्त, `'kfÙkQ` शक्ति, `mijksÙkQ` उपरोक्त — 180 occurrences in the sample.
    Both rules allow matras typed between letter and hook (as SIL's `iszQ` and IIT-D's regex do),
    e.g. `osaQnz`. Confirmed → mapped. (In the same sample के is mostly typed `ds`, 5650 times.)
- **Not mapped (pass through unchanged):**
  - A `Q` after any other letter (`dkQh` → "काQी"). These are typos in the source that render
    as junk even in the font (eye-checked: `dkQh`, `çfrQy`, `btkQk`).
  - `Ý` + `z` + `Q` (फ्रे in `ÝzQseodZ`) — single-source pattern.
  - `é`, `Þ`, `Ç`, `Æ`, `Û`, `Ü` (each two maps disagree), all cp1252 0x80–0x9F glyphs except `•`
    (SIL and IIT-D disagree on every one), `µ`, `¶`, `¸` (curly vs straight quotes), `³`, `´`,
    `À`, `Ï`, `Ð`, `Œ` (one map only or conflicting), `AA` = ॥ (SIL only).
  - ZWJ (U+200D) found inside a few words passes through as-is.
- `%` = ः (SIL + IIT-D). Real text uses the same glyph for a colon (`lzksr%` स्रोत:). Encoding
  writes Unicode ":" as `%` too (SIL maps `%` to ":" between digits).

### Real text (public, Government of India, Ministry of Finance)
Text extracted with PyMuPDF from embedded fonts named `WalkmanChanakya901Bold` and
`Walkman-Chanakya905Normal/Bold`; the rendered page images were checked by eye against the
expected Unicode.

- Economic Survey 2025-26 Hindi preface, p.7 (901Bold):
  https://www.indiabudget.gov.in/budget2025-26/economicsurvey/doc/eschapter/hepreface.pdf —
  `çLrkouk% xSj&fofu;eu ds … ls ?kjsyw fodkl vkSj leqRFkku'khyrk dks c<+kok nsuk` =
  प्रस्तावना: गैर-विनियमन के … से घरेलू विकास और समुत्थानशीलता को बढ़ावा देना
- Economic Survey 2024-25 Hindi preface, p.8 (901Bold):
  https://www.indiabudget.gov.in/budget2024-25/economicsurvey/doc/eschapter/hepreface.pdf —
  `le>kSrksa vkSj vke lgefr ds ekè;e ls ns'k dk lapkyu` = समझौतों और आम सहमति के माध्यम से देश का संचालन;
  `rkfydkvksa dh lwph` तालिकाओं की सूची
- Economic Survey 2022-23 Hindi preface, p.11 (901Bold):
  https://www.indiabudget.gov.in/budget2022-23/economicsurvey/doc/eschapter/hepreface.pdf —
  `fiNys vkfFkZd losZ{k.kksa osQ doj i`"B` = पिछले आर्थिक सर्वेक्षणों के कवर पृष्ठ (के typed `osQ`)
- Economic Survey 2025-26 Statistical Appendix (Hindi), pp.185–186 (901Bold):
  https://www.indiabudget.gov.in/economicsurvey/doc/Statistical-Appendix-in-Hindi.pdf — `(la[;k esa)` (संख्या में)
- Economic Survey 2019-20 Vol 1 Hindi preface, p.3 contents (905):
  https://www.indiabudget.gov.in/budget2019-20/economicsurvey/doc/vol1chapter/hepreface_vol1.pdf —
  परिवर्तन, दौर, रोजगार, मुख्य, प्रेरक, निवेश, उपलब्धियाँ, संवृद्धि, सृजन, अर्थशास्त्र, निरंतर,
  अस्थिरता, बढ़ना, महत्वपूर्ण, सुधार, एवं, जोखिम, कारक
- Economic Survey 2019-20 to 2025-26 Hindi chapters (905), single words with the less common
  glyphs: प्रमुख (`•`), कृषि (`Ñ`), मूल्यह्रास (`ß`), चिह्नित (`É`), आर्थिक (`£`), वर्षों (`±`),
  पद्मकुमार (`Á`), ऊर्जा (`Å`), हृदय (`â`), मुद्रास्फीति (`iQ`), ऋण (`Í`), राष्ट्रीय (`ª`), बाह्य (`á`),
  फ्रेमवर्क (`Ú`), प्रक्रिया (`Ø`), मुफ्त (`Ý`), फिर (`iQ`), सॉफ्टवेयर (`W`, `Ý`).

All of these (60+ words incl. 15 hook words, 18 from 901 text) are unit tests in `test/lib/legacy-fonts.test.ts`
and convert exactly.

### Shipped
- `lib/legacy-fonts.ts`: new font id `walkman` (both directions), table `WALKMAN`, Q-hook rule
  (प/व/त्त + Q → फ/क/क्त). Unicode → Walkman writes क as `d` and क्त as `Dr`, which decode the same.
- `components/tools/WalkmanChanakyaToUnicode.tsx`, `lib/tool-content/walkman-chanakya-to-unicode.ts`.
- `components/tools/LegacyFontConverter.tsx`: one added `FONT_NAME` entry (required by the
  `Record<LegacyFont, string>` type).
- Slug to register (Task 11/12): `walkman-chanakya-to-unicode` (India category, like the other
  legacy-font pages).

---

## 2. Shree-Lipi (Shree-Dev-0714) — FAIL

Maps found:
1. **Padma `Shree_Dev_0714.js`** (2007, Kulbir Saini & Harshita Vani) —
   https://github.com/pankaj28843/padma/blob/master/src/content/encodings/Devanagari/Shree_Dev_0714.js
   — the sanskritnlpPHP `unigateway/Encoder/fonts/Shree_Dev_0714.php5` is a port by the same
   authors, so it is **not** independent.
2. **rajbhasha.net `all-converter-logic.min.js`** has two tables: `ShreeDev0714` (agrees with
   Padma: `n` = प, `~` = ब, `{` / `[` / `p` = ि, `o` = े) and `Shree714`, which **contradicts** it
   on core letters (`[` = प, `]` = ब, `{` = े). Its other tables match Padma closely, so the
   agreeing one cannot be shown to be independent of Padma.
3. **IIT Delhi `shree.tsv`** is for **SHREE-DEV-0708**, a sibling font. It agrees with Padma on
   most core glyphs but disagrees on several conjuncts (`Ñ`, `Ó`, `è`), and it is not 0714.

Real text: none obtained. Maharashtra GR PDFs (marathi.gov.in, gr.maharashtra.gov.in) did not
resolve or redirect from this machine; the Maharashtra PDFs that did download use Unicode or
Latin fonts. Without real 0714 text the conflicting tables cannot be settled.

Decision: not built. To revisit: get a public PDF whose embedded font is `SHREE-DEV-0714` (e.g. a
Maharashtra GR), extract it, and check it against Padma vs rajbhasha `Shree714`. Treat IIT-D 0708
as an independent second map only if 0708 and 0714 are shown to share an encoding.

---

## 3. Shivaji (finishing `shivaji-to-unicode`) — FAIL, stays `maintenance`

Searched again for an independent Shivaji01 map: GitHub code search ("Shivaji01", "Shivaji02",
"shivaji05", "shivaji to unicode"), SIL wsresources (no Shivaji), IIT-D (no Shivaji). Only the
two maps already used exist: Padma `Shivaji.js` (unigateway's `Shivaji01.php5` is a copy) and
rajbhasha.net's Shivaji table (r[20], which follows Padma). As recorded in `lib/legacy-fonts.ts`,
real Shivaji01 text contradicts both on `p`, `t`, `K`, `J`, `.` and `:`, so neither can vouch for
the glyphs not yet verified. `ushel/fontconverter` only switches font names, and
`Gourirajeshkogekar/Phadkebook` ships the font file, not a map.

Decision: no glyphs added; `shivaji-to-unicode` **cannot** flip from maintenance to live. To
revisit: a second independent map that matches real Shivaji01 text (e.g. the font vendor's
keyboard chart), plus more real text than the billing labels used so far.
