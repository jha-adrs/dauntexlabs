/**
 * Legacy Hindi / Marathi font ⇄ Unicode conversion (Kruti Dev 010, DevLys 010,
 * Chanakya, Walkman-Chanakya 901/905, Shivaji). Pure functions, no I/O.
 *
 * Legacy "fonts" draw Devanagari glyphs on top of Latin / Windows-1252 code points,
 * in *visual* order: the short-i matra is typed before its consonant and the reph
 * (र् above a letter) after the syllable it sits on. Converting = a glyph table plus
 * reordering rules.
 *
 * The tables below were written by hand as data. A glyph is included only when at
 * least two independent sources agree on it; glyphs the sources disagree on are
 * left out on purpose and pass through unchanged (garbled Hindi is worse than an
 * obviously untouched character).
 *
 * Sources
 *  - Padma transliterator glyph tables, © 2005–06 Nagarjuna Venna (GPL; used as a
 *    reference only, no code copied): Krutidev.js, Shusha.js, Shivaji.js, BEJA.js in
 *    github.com/pankaj28843/padma/tree/master/src/content/encodings/Devanagari
 *  - rajbhasha.net converter tables (Krutidev10, Shusha, Shivaji), read from the
 *    public converter at rajbhasha.net/unicode-to-shivaji-marathi/
 *  - manishprajapatidev/hindi-font-converter js/ch.js (MIT) — Chanakya table
 *  - Real-world text used to check glyph readings: Kruti Dev FIR text
 *    (Soubhik06/web_scraping), Chanakya newspaper ads filed with BSE
 *    (CodeFingers809/brnch-htf), Shivaji billing labels (AnkushSupnar/AnjaniProject)
 *  - DevLys 010 shares the Kruti Dev 010 keyboard layout ("Devlys font shares same
 *    keyboard layout with Kruti Dev" — typingbaba.com/hindi-font/krutidev-font.php;
 *    converters such as the "Unicode Converter" Google Workspace add-on treat
 *    "KrutiDev/DevLys" as one input), so it reuses the Kruti Dev table.
 *  - Walkman-Chanakya: see the WALKMAN table (SIL W-C-905.map, IIT Delhi walkman.tsv,
 *    pravakta.com 901 converter; real text from the Economic Survey Hindi PDFs).
 *
 * Known gaps
 *  - Shivaji: only legacy → Unicode, and only the glyphs confirmed by real Shivaji
 *    text (see the SHIVAJI table). No reliable published map exists.
 *  - Chanakya: "d", "r", "¨", "ì", "í" are not mapped (sources disagree).
 *  - Walkman-Chanakya: most cp1252 0x80–0x9F glyphs and a few others are not mapped
 *    (only one source, or sources disagree); a "Q" hook after any letter other than
 *    प / व / त्त is left as "Q".
 */

export type LegacyFont = 'krutidev' | 'chanakya' | 'devlys' | 'walkman' | 'shivaji'

export const FONT_SUPPORT: Record<LegacyFont, { toUnicode: boolean; fromUnicode: boolean }> = {
  krutidev: { toUnicode: true, fromUnicode: true },
  devlys: { toUnicode: true, fromUnicode: true },
  chanakya: { toUnicode: true, fromUnicode: true },
  walkman: { toUnicode: true, fromUnicode: true },
  shivaji: { toUnicode: true, fromUnicode: false },
}

/* ---- placeholders (Private Use Area, never in real input) ------------------- */

const I = '' // short-i matra ि, still in front of its consonant
const IM = '' // ि + anusvara, still in front of its consonant
const REPH = '' // reph र्, still after its syllable
const HOOK = '\uE004' // Walkman "Q": hook glyph that turns प/व/त्त into फ/क/क्त

/**
 * [legacy, unicode, flag?] — flag 'd' = decode-only (alternative legacy spelling,
 * never produced when writing legacy text); 'e' = encode-only.
 * For writing legacy text the FIRST non-'d' row for a given Unicode string wins, so
 * the conventional typed form is listed first.
 */
type Row = readonly [string, string, ('d' | 'e')?]

/* ---- Kruti Dev 010 (also DevLys 010) ---------------------------------------- */

const KRUTI: Row[] = [
  // independent vowels
  ['vks', 'ओ'],
  ['vkS', 'औ'],
  ['v‚', 'ऑ'],
  ['vk', 'आ'],
  ['v', 'अ'],
  ['b±', 'ईं'],
  ['bZ', 'ई'],
  ['Ã', 'ई', 'd'],
  ['b', 'इ'],
  ['m', 'उ'],
  ['Å', 'ऊ'],
  [',s', 'ऐ'],
  [',', 'ए'],
  ['_', 'ऋ'],
  // consonants — full forms that are typed as half + k come first
  ['d', 'क'],
  ['D', 'क्'],
  ['[k', 'ख'],
  ['[', 'ख्'],
  ['x', 'ग'],
  ['X', 'ग्'],
  ['?k', 'घ'],
  ['Ä', 'घ', 'd'],
  ['?', 'घ्'],
  ['³', 'ङ'],
  ['p', 'च'],
  ['P', 'च्'],
  ['N', 'छ'],
  ['t', 'ज'],
  ['T', 'ज्'],
  ['>', 'झ'],
  ['÷', 'झ्'],
  ['Ö', 'झ्', 'd'],
  ['¥', 'ञ'],
  ['V', 'ट'],
  ['B', 'ठ'],
  ['M', 'ड'],
  ['<', 'ढ'],
  ['.k', 'ण'],
  ['.', 'ण्'],
  ['r', 'त'],
  ['R', 'त्'],
  ['Fk', 'थ'],
  ['F', 'थ्'],
  ['n', 'द'],
  ['/k', 'ध'],
  ['/', 'ध्'],
  ['Ë', 'ध्', 'd'],
  ['è', 'ध्', 'd'],
  ['u', 'न'],
  ['U', 'न्'],
  ['i', 'प'],
  ['I', 'प्'],
  ['Q', 'फ'],
  ['¶', 'फ्'],
  ['c', 'ब'],
  ['C', 'ब्'],
  ['Hk', 'भ'],
  ['Ò', 'भ', 'd'],
  ['H', 'भ्'],
  ['e', 'म'],
  ['E', 'म्'],
  [';', 'य'],
  ['¸', 'य्'],
  ['j', 'र'],
  ['y', 'ल'],
  ['Y', 'ल्'],
  ['G', 'ळ'],
  ['o', 'व'],
  ['O', 'व्'],
  ["'k", 'श'],
  ["'", 'श्'],
  ['"k', 'ष'],
  ['"', 'ष्'],
  ['l', 'स'],
  ['L', 'स्'],
  ['g', 'ह'],
  ['º', 'ह्'],
  // conjuncts and ligatures
  ['{k', 'क्ष'],
  ['{', 'क्ष्'],
  ['=', 'त्र'],
  ['«', 'त्र्'],
  ['K', 'ज्ञ'],
  ['J', 'श्र'],
  ['ô', 'क्क'],
  ['ä', 'क्त'],
  ['Ø', 'क्र'],
  ['£', 'ख्र'],
  ['ê', 'ट्ट'],
  ['Í', 'ट्ट', 'd'],
  ['ë', 'ट्ठ'],
  ['Î', 'ट्ठ', 'd'],
  ['ð', 'ठ्ठ'],
  ['Ï', 'ड्ड'],
  ['ì', 'ड्ड', 'd'],
  ['ï', 'ड्ढ'],
  ['Ô', 'ड्ढ', 'd'],
  ['Ùk', 'त्त'],
  ['Ù', 'त्त्'],
  ['Ì', 'द्द'],
  ['í', 'द्द', 'd'],
  [')', 'द्ध'],
  ['ö', 'द्भ'],
  ['˜', 'द्भ', 'd'],
  ['|', 'द्य'],
  ['}', 'द्व'],
  ['æ', 'द्र'],
  ['é', 'न्न'],
  ['™', 'न्न्'],
  ['Ý', 'फ्र'],
  ['à', 'ह्न'],
  ['ã', 'ह्म'],
  ['á', 'ह्य'],
  ['ç', 'प्र', 'd'],
  ['Á', 'प्र', 'd'],
  ['Ñ', 'कृ'],
  ['—', 'कृ', 'd'],
  ['–', 'दृ'],
  ['â', 'हृ'],
  ['#', 'रु'],
  [':', 'रू'],
  // rakar after rounded letters
  ['Vª', 'ट्र'],
  ['Mª', 'ड्र'],
  ['Nª', 'छ्र'],
  ['z', '्र'],
  ['ª', '्र', 'd'],
  // matras and signs
  ['ks', 'ो'],
  ['¨', 'ो', 'd'],
  ['®', 'ो', 'd'],
  ['kS', 'ौ'],
  ['©', 'ौ', 'd'],
  ['k', 'ा'],
  ['f', I],
  ['Ç', IM, 'd'],
  ['h', 'ी'],
  ['È', 'ीं', 'd'],
  ['q', 'ु'],
  ['w', 'ू'],
  ['`', 'ृ'],
  ['s', 'े'],
  ['¢', 'े', 'd'],
  ['S', 'ै'],
  ['‚', 'ॉ'],
  ['W', 'ॅ'],
  ['a', 'ं'],
  ['¡', 'ँ'],
  ['%', 'ः'],
  ['~', '्'],
  ['+', '़'],
  ['Z', REPH],
  ['±', REPH + 'ं', 'd'],
  ['Æ', 'र्' + I, 'd'],
  ['É', 'र्' + IM, 'd'],
  // punctuation and digits
  ['A', '।'],
  ['·', 'ऽ'],
  ['-', '.'],
  [']', ','],
  ['(', ';'],
  ['&', '-'],
  ['@', '/'],
  ['\\', '?'],
  ['¼', '('],
  ['½', ')'],
  ['¾', '='],
  ['¿', '{'],
  ['À', '}'],
  ['^', '‘'],
  ['*', '’'],
  ['ƒ', '१'],
  ['„', '२'],
  ['…', '३'],
  ['†', '४'],
  ['‡', '५'],
  ['ˆ', '६'],
  ['‰', '७'],
]

/* ---- Chanakya ----------------------------------------------------------------
 * Chanakya (the Punjab Kesari / Dainik Bhaskar family) uses Windows-1252 code
 * points. "U" and "¤" are invisible spacing glyphs typed after some letters; they
 * carry no meaning and are dropped. A few glyphs live on undefined cp1252 bytes and
 * arrive as C1 control characters (\u0081 etc.).
 */
const CHANAKYA: Row[] = [
  // spaced forms real Chanakya text uses — listed first so they are what we write
  ['·Ô¤', 'के'],
  ['·ñ¤', 'कै'],
  ['ÈÔ¤', 'फे'],
  ['Èñ¤', 'फै'],
  ['·¤', 'क'],
  ['È¤', 'फ'],
  ['ÚU', 'र'],
  ['ÅU', 'ट'],
  ['ª¤', 'ऊ'],
  ['L¤', 'रु'],
  ['M¤', 'रू'],
  ['P¤', 'क्क'],
  ['Q¤', 'क्त'],
  ['R¤', 'क्र'],
  ['`¤', 'क्व'],
  ['Åþ', 'ट्र'],
  ['Çþ', 'ड्र'],
  ['Éþ', 'ढ्र'],
  ['U', ''],
  ['¤', ''],
  // independent vowels
  ['¥æò', 'ऑ'],
  ['¥ô', 'ओ'],
  ['¥æð', 'ओ', 'd'],
  ['¥õ', 'औ'],
  ['¥æñ', 'औ', 'd'],
  ['¥æ', 'आ'],
  ['¥', 'अ'],
  ['§Z', 'ईं'],
  ['§ü', 'ई'],
  ['§', 'इ'],
  ['©', 'उ'],
  ['ª', 'ऊ', 'd'],
  ['«', 'ऋ'],
  ['¬', 'ॠ'],
  ['°ð', 'ऐ'],
  ['°', 'ए'],
  // consonants
  ['·', 'क', 'd'],
  ['€', 'क्'],
  ['¹', 'ख'],
  ['\u0081', 'ख्'],
  ['»', 'ग'],
  ['‚', 'ग्'],
  ['ƒæ', 'घ'],
  ['ƒ', 'घ्'],
  ['¾', 'ङ'],
  ['¿', 'च'],
  ['‘', 'च्'],
  ['“', 'च्च्'],
  ['À', 'छ'],
  ['Á', 'ज'],
  ['…', 'ज्'],
  ['’', 'ज्', 'd'],
  ['”', 'ज्ज्'],
  ['Ê', 'ज़्'],
  ['Ûæ', 'झ'],
  ['Û', 'झ्'],
  ['†', 'ञ्'],
  ['Å', 'ट', 'd'],
  ['Æ', 'ठ'],
  ['Ç', 'ड'],
  ['É', 'ढ'],
  ['‡æ', 'ण'],
  ['‡', 'ण्'],
  ['Ì', 'त'],
  ['ˆ', 'त्'],
  ['Í', 'थ'],
  ['‰', 'थ्'],
  ['Î', 'द'],
  ['¼', 'द', 'd'],
  ['Ï', 'ध'],
  ['Š', 'ध्'],
  ['Ù', 'न'],
  ['‹', 'न्'],
  ['óæ', 'न्न'],
  ['ó', 'न्न्'],
  ['Â', 'प'],
  ['Œ', 'प्'],
  ['È', 'फ', 'd'],
  ['\u008D', 'फ्'],
  ['Õ', 'ब'],
  ['Ž', 'ब्'],
  ['Ö', 'भ'],
  ['\u008F', 'भ्'],
  ['×', 'म'],
  ['\u0090', 'म्'],
  ['Ø', 'य'],
  ['Ä', 'य्'],
  ['Ú', 'र', 'd'],
  ['Ü', 'ल'],
  ['¶', 'ल', 'd'],
  ['Ë', 'ल्'],
  ['Ý', 'ळ'],
  ['ß', 'व'],
  ['Ã', 'व्'],
  ['àæ', 'श'],
  ['o', 'श', 'd'],
  ['à', 'श्'],
  ['³', 'श्', 'd'],
  ['á', 'ष'],
  ['c', 'ष्'],
  ['â', 'स'],
  ['S', 'स्'],
  ['ã', 'ह'],
  ['±', 'ह्'],
  // conjuncts
  ['ÿæ', 'क्ष'],
  ['ÿ', 'क्ष्'],
  ['˜æ', 'त्र'],
  ['G', 'त्र', 'd'],
  ['˜', 'त्र्'],
  ['™æ', 'ज्ञ'],
  ['™', 'ज्ञ्'],
  ['Ÿæ', 'श्र'],
  ['žæ', 'त्त'],
  ['ž', 'त्त्'],
  ['B', 'क्च'],
  ['C', 'ष्ट'],
  ['D', 'ष्ठ'],
  ['E', 'श्व'],
  ['F', 'स्न'],
  ['I', 'ढ्ढ'],
  ['J', 'छ्व'],
  ['L', 'रु', 'd'],
  ['M', 'रू', 'd'],
  ['N', 'हृ'],
  ['O', 'ह्र'],
  ['P', 'क्क', 'd'],
  ['Q', 'क्त', 'd'],
  ['R', 'क्र', 'd'],
  ['T', 'ञ्ज'],
  ['V', 'ङ्क'],
  ['W', 'ङ्ख'],
  ['X', 'ङ्ग'],
  ['Y', 'ङ्घ'],
  ['`', 'क्व', 'd'],
  ['^', 'ट्ट'],
  ['a', 'ड्ड'],
  ['b', 'ड्ढ'],
  ['e', 'द्ग'],
  ['f', 'द्घ'],
  ['g', 'द्द'],
  ['h', 'द्ध'],
  ['i', 'द्ब'],
  ['j', 'द्भ'],
  ['k', 'द्म'],
  ['l', 'द्य'],
  ['m', 'द्व'],
  ['n', 'ठ्ठ'],
  ['p', 'श्च'],
  ['q', 'ह्न'],
  ['s', 'ह्य'],
  ['t', 'ह्ल'],
  ['u', 'ह्व'],
  ['#', 'प्त'],
  ['%', 'त्न'],
  ['@', 'ञ्च'],
  ['„', 'ल्ल'],
  ['¦', 'ष्ट्व'],
  ['¯', 'ख्न'],
  ['µ', 'द्ब्र'],
  ['º', 'ख्र'],
  ['ý', '्र'],
  ['A', '्र', 'd'],
  ['þ', '्र', 'd'],
  ['K', '्य'],
  // matras and signs
  ['æ', 'ा'],
  ['ç', I],
  ['è', 'ी'],
  ['é', 'ु'],
  ['ä', 'ु', 'd'],
  ['ê', 'ू'],
  ['å', 'ू', 'd'],
  ['ë', 'ृ'],
  ['ð', 'े'],
  ['Ô', 'े', 'd'],
  ['ñ', 'ै'],
  ['ô', 'ो'],
  ['õ', 'ौ'],
  ['´', 'ं'],
  ['¢', 'ं', 'd'],
  ['¡', 'ँ'],
  ['ò', 'ॅ'],
  ['÷', '्'],
  ['¸', '़'],
  ['ü', REPH],
  ['Z', REPH + 'ं', 'd'],
  // punctuation and digits
  ['Ð', '।'],
  ['H', '॥'],
  ['ù', 'ऽ'],
  ['Ñ', ':'],
  ['Ñ', 'ः', 'e'],
  ['Ò', '‘'],
  ['Ó', '’'],
  ['®', '0'],
  ['v', '1'],
  ['w', '2'],
  ['x', '3'],
  ['y', '4'],
  ['z', '5'],
  ['{', '6'],
  ['|', '7'],
  ['}', '8'],
  ['~', '9'],
  ['0', '०'],
  ['1', '१'],
  ['2', '२'],
  ['3', '३'],
  ['4', '४'],
  ['5', '५'],
  ['6', '६'],
  ['7', '७'],
  ['8', '८'],
  ['9', '९'],
]

/* ---- Walkman-Chanakya 901 / 905 ------------------------------------------------
 * A Remington (Kruti Dev-style) layout, but NOT the Kruti Dev table: "/" = ध, "=" = त्र्,
 * "(" ")" are brackets, "_" = ";", "¼" = द्ध, "½" = ऋ, "•" = ख, digits ú–ÿ / ö–ù are
 * Devanagari, and "Q" is a hook glyph (प/व/त्त + Q = फ/क/क्त, handled in toUnicode;
 * व and त्त are each in one map only, confirmed by eye-checked real text: osQ = के,
 * ÙkQ = क्त).
 * Sources: [W1] SIL W-C-905.map (silnrsi/wsresources), [W2] IIT Delhi AssisTech
 * walkman.tsv + reorder.tsv (assistech-iitdelhi/InDesignFontConverters, used there for 901
 * and 905), [W3] pravakta.com "Unicode to Walkman-Chanakya-901" converter table. A glyph is
 * here only when two of them agree; where the third disagreed, real Economic Survey text
 * (indiabudget.gov.in, fonts WalkmanChanakya901Bold / Walkman-Chanakya905*) decided it
 * (• = ख, Á = द्म, Ý = फ्). Notes: .superpowers/sdd/2026-10-08-niche-batch-2/fonts-research.md
 */
const WALKMAN: Row[] = [
  // independent vowels
  ['vks', 'ओ'],
  ['vkS', 'औ'],
  ['vkW', 'ऑ'],
  ['vk', 'आ'],
  ['v', 'अ'],
  ['b±', 'ईं'],
  ['bZ', 'ई'],
  ['b', 'इ'],
  ['m', 'उ'],
  ['Å', 'ऊ'],
  [',s', 'ऐ'],
  [',', 'ए'],
  ['½', 'ऋ'],
  ['Í', 'ऋ', 'd'],
  // consonants — full forms typed as half + k come first
  ['d', 'क'],
  ['D', 'क्'],
  ['[k', 'ख'],
  ['•', 'ख', 'd'],
  ['[', 'ख्'],
  ['x', 'ग'],
  ['X', 'ग्'],
  ['?k', 'घ'],
  ['?', 'घ्'],
  ['Ä', 'ङ'],
  ['p', 'च'],
  ['P', 'च्'],
  ['N', 'छ'],
  ['t', 'ज'],
  ['T', 'ज्'],
  ['>', 'झ'],
  ['Ö', 'झ्'],
  ['×k', 'ञ'],
  ['×', 'ञ्'],
  ['V', 'ट'],
  ['ê', 'ट', 'd'],
  ['B', 'ठ'],
  ['ë', 'ठ', 'd'],
  ['M', 'ड'],
  ['î', 'ड', 'd'],
  ['<', 'ढ'],
  ['ì', 'ढ', 'd'],
  ['.k', 'ण'],
  ['.', 'ण्'],
  ['r', 'त'],
  ['R', 'त्'],
  ['Fk', 'थ'],
  ['F', 'थ्'],
  ['n', 'द'],
  ['/', 'ध'],
  ['è', 'ध्'],
  ['u', 'न'],
  ['U', 'न्'],
  ['i', 'प'],
  ['I', 'प्'],
  ['iQ', 'फ'],
  ['Ý', 'फ्'],
  ['c', 'ब'],
  ['C', 'ब्'],
  ['Hk', 'भ'],
  ['H', 'भ्'],
  ['e', 'म'],
  ['E', 'म्'],
  [';', 'य'],
  ['Õ', 'य्'],
  ['j', 'र'],
  ['y', 'ल'],
  ['Y', 'ल्'],
  ['G', 'ळ'],
  ['o', 'व'],
  ['O', 'व्'],
  ["'k", 'श'],
  ["'", 'श्'],
  ['"k', 'ष'],
  ['"', 'ष्'],
  ['l', 'स'],
  ['L', 'स्'],
  ['g', 'ह'],
  // conjuncts and ligatures
  ['{k', 'क्ष'],
  ['{', 'क्ष्'],
  ['=k', 'त्र'],
  ['Ë', 'त्र', 'd'],
  ['=', 'त्र्'],
  ['K', 'ज्ञ'],
  ['J', 'श्र'],
  ['Ø', 'क्र'],
  ['Ñ', 'कृ'],
  ['ç', 'प्र'],
  ['æ', 'द्र'],
  ['Ú', 'फ्र'],
  ['ß', 'ह्र'],
  ['à', 'ह्व'],
  ['á', 'ह्य'],
  ['â', 'हृ'],
  ['ã', 'ह्म'],
  ['É', 'ह्न'],
  ['Ê', 'ह्ण'],
  ['È', 'ह्ल'],
  ['Â', 'न्न'],
  ['ä', 'द्न'],
  ['å', 'द्ग'],
  ['í', 'द्द'],
  ['¼', 'द्ध'],
  ['Á', 'द्म'],
  ['|', 'द्य'],
  ['}', 'द्व'],
  ['Ùk', 'त्त'],
  ['Ù', 'त्त्'],
  ['#', 'रु'],
  [':', 'रू'],
  // rakar after rounded letters, then the other subscript forms
  ['Vª', 'ट्र'],
  ['Mª', 'ड्र'],
  ['Nª', 'छ्र'],
  ['z', '्र'],
  ['ª', '्र', 'd'],
  ['Ò', '्व'],
  ['Ó', '्च'],
  ['Ô', '्य'],
  ['ï', '्क'],
  ['ð', '्ट'],
  ['ò', '्ठ'],
  ['ó', '्ड'],
  ['ô', '्ढ'],
  ['õ', '्ग'],
  // matras and signs
  ['ks', 'ो'],
  ['kS', 'ौ'],
  ['kW', 'ॉ'],
  ['k', 'ा'],
  ['f', I],
  ['¯', IM, 'd'],
  ['h', 'ी'],
  ['q', 'ु'],
  ['w', 'ू'],
  ['`', 'ृ'],
  ['s', 'े'],
  ['S', 'ै'],
  ['W', 'ॅ'],
  ['a', 'ं'],
  ['¡', 'ँ'],
  ['%', 'ः'],
  ['%', ':', 'e'], // the same glyph is the colon
  ['~', '्'],
  ['+', '़'],
  ['Z', REPH],
  ['±', REPH + 'ं', 'd'],
  ['£', 'र्' + I, 'd'],
  ['²', 'र्' + IM, 'd'],
  ['Q', HOOK, 'd'],
  // punctuation and digits ("(", ")", "!" and 0–9 are themselves)
  ['A', '।'],
  ['¿', 'ऽ'],
  ['ñ', '॰'],
  ['-', '.'],
  [']', ','],
  ['_', ';'],
  ['&', '-'],
  ['@', '/'],
  ['\\', '?'],
  ['$', '+'],
  ['»', '%'],
  ['¾', '='],
  ['·', '*'],
  ['¹', '['],
  ['º', ']'],
  ['^', '‘'],
  ['*', '’'],
  ['ú', '०'],
  ['û', '१'],
  ['ü', '२'],
  ['ý', '३'],
  ['þ', '४'],
  ['ÿ', '५'],
  ['ö', '६'],
  ['÷', '७'],
  ['ø', '८'],
  ['ù', '९'],
]

/* ---- Shivaji (Shivaji01; Marathi) — legacy → Unicode only ---------------------
 * Padma documents Shivaji as the Shusha layout, and rajbhasha.net's Shivaji table
 * agrees, but real Shivaji01 text contradicts both for several glyphs: "p", "t" and
 * "K" are stemless half forms (pa = प, ta = त, Ka = ख — e.g. "paasavaD-" पासवर्ड,
 * "taalauka" तालुका, "KarodI" खरेदी), "J-" is used for ई ("saaonaJ-" सोनई) and "."
 * / ":" are used as ordinary punctuation. There is no reliable published map, so
 * this table keeps ONLY glyphs whose reading is confirmed by real Shivaji text (and,
 * where the documents are right, by them too). Everything else passes through
 * unchanged. Most consonants are a half form completed by the "a" stem (m = म्,
 * ma = म).
 */
const SHIVAJI: Row[] = [
  // vowels (आ = A + a, ऑ = A + a + ^ via the fix-ups)
  ['A', 'अ'],
  ['[', 'इ'],
  ['e', 'ए'],
  // consonants
  ['k', 'क'],
  ['@', 'क्'],
  ['K', 'ख्'],
  ['g', 'ग्'],
  ['G', 'घ्'],
  ['c', 'च्'],
  ['j', 'ज्'],
  ['T', 'ट'],
  ['D', 'ड'],
  ['N', 'ण्'],
  ['t', 'त्'],
  ['d', 'द'],
  ['n', 'न्'],
  ['p', 'प्'],
  ['f', 'फ'],
  ['b', 'ब्'],
  ['B', 'भ्'],
  ['m', 'म्'],
  ['y', 'य्'],
  ['r', 'र'],
  ['l', 'ल्'],
  ['v', 'व्'],
  ['S', 'श्'],
  ['Y', 'ष्'],
  ['s', 'स्'],
  ['h', 'ह'],
  ['`', '्र'],
  ['/', '्र'],
  // matras and signs
  ['a', 'ा'],
  ['i', I],
  ['I', 'ी'],
  ['u', 'ु'],
  ['U', 'ू'],
  ['o', 'े'],
  ['O', 'ै'],
  ['^', 'ॅ'],
  ['M', 'ं'],
  ['-', REPH],
]

/* ---- shared engine -------------------------------------------------------------- */

const C = '[क-हक़-य़]' // consonant
const NUK = '़?'
const H = '्' // halant / virama
const CLUSTER = `(?:${C}${NUK}${H})*${C}${NUK}` // half-forms + final consonant

// Fix-ups after glyph lookup (left → right). "्ा" = half form + stem = full letter.
const COMMON_FIXUPS: [string, string][] = [
  ['्ा', ''],
  ['अा', 'आ'],
  ['आे', 'ओ'],
  ['आै', 'औ'],
  ['अो', 'ओ'],
  ['अौ', 'औ'],
  ['आॅ', 'ऑ'],
  ['ाे', 'ो'],
  ['ाै', 'ौ'],
  ['ाॅ', 'ॉ'],
  ['एे', 'ऐ'],
]
const SHIVAJI_FIXUPS: [string, string][] = [...COMMON_FIXUPS, ['ॅं', 'ँ']]

interface Spec {
  decode: Map<string, string>
  decodeMax: number
  encode: Map<string, string>
  encodeMax: number
  fixups: [string, string][]
}

const SPACERS = /[U¤]$/

function buildSpec(rows: Row[], fixups: [string, string][]): Spec {
  const decode = new Map<string, string>()
  const encode = new Map<string, string>()
  for (const [legacy, uni, flag] of rows) {
    if (flag !== 'e' && !decode.has(legacy)) decode.set(legacy, uni)
    if (flag !== 'd' && uni && !encode.has(uni)) encode.set(uni, legacy)
  }
  // Consonant + rakar (प्र) is written full letter + rakar glyph; without these rows
  // the longest match would pick the half form (प्) and then a bare र.
  const rakar = encode.get('\u094D\u0930')
  if (rakar) {
    for (let cp = 0x915; cp <= 0x939; cp++) {
      const c = String.fromCharCode(cp)
      const full = encode.get(c)
      if (!full || encode.has(c + '\u094D\u0930')) continue
      // a trailing spacing glyph stays last (Chanakya: प्र = Âý, क्र = ·ý¤)
      const m = full.match(SPACERS)
      encode.set(c + '\u094D\u0930', m ? full.slice(0, -1) + rakar + m[0] : full + rakar)
    }
  }
  const max = (m: Map<string, string>) => Math.max(1, ...[...m.keys()].map((k) => k.length))
  return { decode, decodeMax: max(decode), encode, encodeMax: max(encode), fixups }
}

/** Greedy longest-match replacement; unknown characters pass through. */
function translate(s: string, map: Map<string, string>, maxLen: number): string {
  let out = ''
  for (let i = 0; i < s.length; ) {
    let hit = false
    for (let len = Math.min(maxLen, s.length - i); len > 0; len--) {
      const v = map.get(s.slice(i, i + len))
      if (v !== undefined) {
        out += v
        i += len
        hit = true
        break
      }
    }
    if (!hit) out += s[i++]
  }
  return out
}

const KRUTI_SPEC = buildSpec(KRUTI, COMMON_FIXUPS)
const SPECS: Record<LegacyFont, Spec> = {
  krutidev: KRUTI_SPEC,
  devlys: KRUTI_SPEC,
  chanakya: buildSpec(CHANAKYA, COMMON_FIXUPS),
  walkman: buildSpec(WALKMAN, COMMON_FIXUPS),
  shivaji: buildSpec(SHIVAJI, SHIVAJI_FIXUPS),
}

const RE_I_FORWARD = new RegExp(`([${I}${IM}])(${CLUSTER})`, 'g')
const RE_REPH_BACK = new RegExp(`(${CLUSTER}[ा-ौॢॣँं]*)${REPH}`, 'g')
const RE_ANUSVARA_FIRST = /([ँं])([ा-ौ])/g
// Walkman hook "Q" (with any matras typed between): प → फ, व → क, त्त → क्त
const HOOKED: Record<string, string> = { प: 'फ', व: 'क', त्त: 'क्त' }
const RE_HOOK = new RegExp(`(त्त|[पव])(${NUK}(?:्र)?[ा-ौॅँं]*)${HOOK}`, 'g')

/** Legacy-encoded text → Unicode Devanagari (NFC). */
export function toUnicode(text: string, font: LegacyFont): string {
  if (!text) return ''
  const spec = SPECS[font]
  let s = translate(text, spec.decode, spec.decodeMax)
  for (const [from, to] of spec.fixups) s = s.split(from).join(to)
  if (s.includes(HOOK)) s = s.replace(RE_HOOK, (_, base: string, marks: string) => HOOKED[base] + marks).replaceAll(HOOK, 'Q')
  // anusvara typed before a vowel sign → after it
  s = s.replace(RE_ANUSVARA_FIRST, '$2$1')
  // short-i: typed before the consonant (cluster) → after it
  s = s.replace(RE_I_FORWARD, (_, mark: string, cluster: string) => cluster + (mark === I ? 'ि' : 'िं'))
  // reph: typed after the syllable → र् before its cluster
  s = s.replace(RE_REPH_BACK, 'र्$1')
  s = s.replaceAll(I, 'ि').replaceAll(IM, 'िं').replaceAll(REPH, 'र्')
  return s.normalize('NFC')
}

const RE_REPH_FORWARD = new RegExp(`र्(${CLUSTER}[ा-ौ]*)`, 'g')
const RE_I_BACK = new RegExp(`(${CLUSTER})ि`, 'g')

/**
 * Unicode Devanagari → legacy-encoded text. Returns the input unchanged for a font
 * whose Unicode → legacy direction is unsupported (see FONT_SUPPORT).
 */
export function fromUnicode(text: string, font: LegacyFont): string {
  if (!text) return ''
  if (!FONT_SUPPORT[font].fromUnicode) return text
  const spec = SPECS[font]
  let s = text.normalize('NFC')
  s = s.replace(RE_REPH_FORWARD, `$1${REPH}`)
  s = s.replace(RE_I_BACK, `${I}$1`)
  return translate(s, spec.encode, spec.encodeMax)
}

/** True when the text is mostly Unicode Devanagari (i.e. not legacy-encoded). */
export function looksLikeUnicodeDevanagari(text: string): boolean {
  const deva = (text.match(/[ऀ-ॿ]/g) ?? []).length
  if (!deva) return false
  const other = (text.match(/[A-Za-z\u0080-ÿŒ-™]/g) ?? []).length
  return deva >= other
}
