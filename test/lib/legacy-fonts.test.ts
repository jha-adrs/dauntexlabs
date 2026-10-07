import { describe, it, expect } from 'vitest'
import {
  toUnicode,
  fromUnicode,
  looksLikeUnicodeDevanagari,
  FONT_SUPPORT,
  type LegacyFont,
} from '@/lib/legacy-fonts'

// Unicode literals below are compared after NFC so a precomposed nukta letter
// (e.g. U+095C ड़) and its decomposed form (ड + ़) count as equal.
const nfc = (s: string) => s.normalize('NFC')

/*
 * Reference sources for the vectors (each pair was checked by reading the legacy
 * string glyph-by-glyph against at least one published table):
 *
 *  [P]  Padma transliterator glyph tables (Nagarjuna Venna, 2005–06): Krutidev.js,
 *       Shusha.js, Shivaji.js, BEJA.js — github.com/pankaj28843/padma
 *       src/content/encodings/Devanagari/
 *  [R]  rajbhasha.net live converter tables (all-converter-logic.min.js, tables for
 *       "Krutidev10" and "Shivaji")
 *  [M]  manishprajapatidev/hindi-font-converter (MIT) js/ch.js — Chanakya table
 *  [E]  ErParmod/hindi-font-converter __tests__/converter.test.js — the same sentence
 *       in Unicode, Kruti Dev and Chanakya
 *  [F]  Real Kruti Dev text: Soubhik06/web_scraping data/txt/NA-7093.txt (police FIR)
 *  [B]  Real Chanakya text: CodeFingers809/brnch-htf bse_data/text_content/*.txt
 *       (Hindi newspaper ads filed with BSE); dibyajyotipy/font-converter-hub sample
 *  [S]  Real Shivaji text: AnkushSupnar/AnjaniProject Prints/Marathi Samples.txt
 *       (Marathi restaurant-billing labels)
 */

const SENTENCE_UNI = 'भारत एक विशाल देश है जो दक्षिण एशिया में स्थित है।' // [E]
const SENTENCE_KRUTI = "Hkkjr ,d fo'kky ns'k gS tks nf{k.k ,f'k;k esa fLFkr gSA" // [E]
const SENTENCE_CHANAKYA = 'ÖæÚUÌ °·¤ çßàææÜ Îðàæ ãñ Áô Îçÿæ‡æ °çàæØæ ×ð´ çSÍÌ ãñÐ' // [E]

describe('Kruti Dev 010', () => {
  // Plan vectors — checked against [P] and [R].
  const planPairs: [string, string][] = [
    ['Hkkjr', 'भारत'],
    ['fgUnh', 'हिन्दी'], // short-i f precedes the consonant
    ['deZ', 'कर्म'], // reph Z follows the consonant
    ['iz;ksx', 'प्रयोग'], // z = rakar (्र)
    ['{k=', 'क्षत्र'],
  ]
  // Real-world words [F] plus common words, read with [P]/[R].
  const words: [string, string][] = [
    ['Hkkjrh;', 'भारतीय'],
    ['ukxfjd', 'नागरिक'],
    ['lqj{kk', 'सुरक्षा'],
    ['lafgrk', 'संहिता'],
    ['/kkjk', 'धारा'],
    ['iqfyl', 'पुलिस'],
    ['egRoiw.kZ', 'महत्वपूर्ण'],
    ['izkFkZuk', 'प्रार्थना'],
    ['varxZr', 'अंतर्गत'],
    ["'ks\"k", 'शेष'],
    ['lk{khx.k', 'साक्षीगण'],
    [',oa', 'एवं'],
    ['fnYyh', 'दिल्ली'],
    ['mÙkj', 'उत्तर'],
    ['dk;Z', 'कार्य'],
    ['dhfrZ', 'कीर्ति'], // ि and reph on the same consonant
    ['fiz;', 'प्रिय'], // ि moves past a whole conjunct
    ['vkSj', 'और'],
    ['bZ', 'ई'],
  ]

  for (const [legacy, uni] of [...planPairs, ...words]) {
    it(`${legacy} → ${uni}`, () => expect(toUnicode(legacy, 'krutidev')).toBe(nfc(uni)))
    it(`${uni} → ${legacy}`, () => expect(fromUnicode(uni, 'krutidev')).toBe(legacy))
  }

  it('converts the reference sentence both ways [E]', () => {
    expect(toUnicode(SENTENCE_KRUTI, 'krutidev')).toBe(SENTENCE_UNI)
    expect(fromUnicode(SENTENCE_UNI, 'krutidev')).toBe(SENTENCE_KRUTI)
  })

  it('maps legacy punctuation (A = purna viram, - = full stop, ] = comma)', () => {
    expect(toUnicode('gSA', 'krutidev')).toBe('है।')
    expect(toUnicode('Mh-,e-', 'krutidev')).toBe('डी.एम.')
    expect(toUnicode("jke] ';ke", 'krutidev')).toBe('राम, श्याम')
  })

  it('accepts alternative legacy spellings (Ã for ई, Dk for क)', () => {
    expect(toUnicode('Ã', 'krutidev')).toBe('ई')
    expect(toUnicode('Dk', 'krutidev')).toBe('क')
  })

  it('round-trips a 200+ character legacy corpus', () => {
    const corpus = [
      SENTENCE_KRUTI,
      'Hkkjrh; ukxfjd lqj{kk lafgrk /kkjk',
      "ifjoknh ,oa egRoiw.kZ lk{khx.k ds c;ku 'ks\"k gSaA",
      "mÙkj izns'k ljdkj dk dk;Z fnYyh esa gksxkA",
      'izkFkZuk i= varxZr dhfrZ vkSj deZA',
    ].join(' ')
    expect(corpus.length).toBeGreaterThanOrEqual(200)
    expect(fromUnicode(toUnicode(corpus, 'krutidev'), 'krutidev')).toBe(corpus)
  })
})

describe('DevLys 010 (same layout as Kruti Dev 010)', () => {
  it('converts exactly like Kruti Dev', () => {
    expect(toUnicode(SENTENCE_KRUTI, 'devlys')).toBe(SENTENCE_UNI)
    expect(fromUnicode(SENTENCE_UNI, 'devlys')).toBe(SENTENCE_KRUTI)
    expect(toUnicode('deZ', 'devlys')).toBe('कर्म')
  })
})

describe('Chanakya', () => {
  // Real text [B]/[E], glyphs read with [P] (BEJA) and [M]; both tables agree on every
  // glyph used here. U and ¤ are invisible spacing glyphs and are dropped.
  const words: [string, string][] = [
    ['ÖæÚUÌ', 'भारत'],
    ['çßàææÜ', 'विशाल'],
    ['Îçÿæ‡æ', 'दक्षिण'],
    ['çSÍÌ', 'स्थित'],
    ['ŒÚUæÍèü', 'प्रार्थी'], // reph ü follows the syllable
    ['Ÿæè', 'श्री'],
    ['ÜæÜ¿¢Î', 'लालचंद'],
    ['çß·¤æâ', 'विकास'],
    ['Ù»ÚU', 'नगर'],
    ['Ù§ü çÎËÜè', 'नई दिल्ली'],
    ['¥æßÔÎÙ', 'आवेदन'],
    ['ÂÌý', 'पत्र'],
    ['×ŠØ ÂýÎðàæ', 'मध्य प्रदेश'],
    ['Ùãè´', 'नहीं'],
    ['ÚUãè ãñ', 'रही है'],
    ['ÖæÚUÌèØ', 'भारतीय'],
    ['¥»SÌ', 'अगस्त'],
    ['·¤Ç¸æ·Ô¤', 'कड़ाके'], // nukta ¸, alternate e-matra Ô
    ['R¤æ§×', 'क्राइम'],
    ['çR¤Øæ‹ßØÙ', 'क्रियान्वयन'],
  ]
  for (const [legacy, uni] of words) {
    it(`${legacy} → ${uni}`, () => expect(toUnicode(legacy, 'chanakya')).toBe(nfc(uni)))
  }

  it('reads Latin-shaped digits (v–~, ®) and Devanagari digits (0–9) [B][M]', () => {
    expect(toUnicode('v çÎâ¢ÕÚUÐ', 'chanakya')).toBe('1 दिसंबर।')
    expect(toUnicode('x®', 'chanakya')).toBe('30')
    expect(toUnicode('25', 'chanakya')).toBe('२५')
  })

  it('converts the reference sentence both ways [E]', () => {
    expect(toUnicode(SENTENCE_CHANAKYA, 'chanakya')).toBe(SENTENCE_UNI)
    expect(fromUnicode(SENTENCE_UNI, 'chanakya')).toBe(SENTENCE_CHANAKYA)
  })

  it('writes the spacing glyphs real Chanakya text uses (के = ·Ô¤, क्र = R¤) [B]', () => {
    expect(fromUnicode('के', 'chanakya')).toBe('·Ô¤')
    expect(fromUnicode('कि', 'chanakya')).toBe('ç·¤')
    expect(fromUnicode('फ', 'chanakya')).toBe('È¤')
    expect(fromUnicode('क्रिया', 'chanakya')).toBe('çR¤Øæ')
  })

  it('round-trips Unicode through Chanakya', () => {
    const text = 'श्री लालचंद प्रार्थी, विकास नगर, नई दिल्ली। मध्य प्रदेश के क्रियान्वयन'
    expect(toUnicode(fromUnicode(text, 'chanakya'), 'chanakya')).toBe(text)
  })
})

describe('Shivaji (Marathi) — legacy → Unicode', () => {
  // Real Shivaji text [S], read with [P] (Shusha/Shivaji tables) and [R] (Shivaji).
  const words: [string, string][] = [
    ['maharaYT/', 'महाराष्ट्र'],
    ['ba^Mk', 'बँक'],
    ['Aa^f', 'ऑफ'],
    ['ha^Tola', 'हॉटेल'],
    ['AMjanaI', 'अंजनी'],
    ['idnaaMk', 'दिनांक'],
    ['paasavaD-', 'पासवर्ड'], // reph "-" follows the syllable
    ['paaTI-', 'पार्टी'],
    ['vaYa-', 'वर्ष'],
    ['ivak`I', 'विक्री'],
    ['ijalha', 'जिल्हा'],
    ['iSallak', 'शिल्लक'],
    ['maaobaa[la', 'मोबाइल'],
    ['r@kma', 'रक्कम'],
    ['kamagaar', 'कामगार'],
    ['Sahr', 'शहर'],
    ['taalauka', 'तालुका'],
    ['vyavahar', 'व्यवहार'],
    ['ga`ahk', 'ग्राहक'],
    ['DolaI', 'डेली'],
    ['Gar', 'घर'],
    ['paavataI', 'पावती'],
    ['pagaar', 'पगार'],
    ['tapaiSala', 'तपशिल'],
    ['KarodI', 'खरेदी'], // K is a half form in Shivaji01
    ['Kacaa-caa', 'खर्चाचा'],
    ['paOsao', 'पैसे'],
    ['yaujar', 'युजर'],
    ['Baava', 'भाव'],
    ['ekUNa', 'एकूण'],
  ]
  for (const [legacy, uni] of words) {
    it(`${legacy} → ${uni}`, () => expect(toUnicode(legacy, 'shivaji')).toBe(nfc(uni)))
  }

  it('keeps ASCII digits and ordinary punctuation', () => {
    // "." is an abbreviation dot in real Shivaji text ("ija." = जि. for जिल्हा)
    expect(toUnicode('ija. 414105', 'shivaji')).toBe('जि. 414105')
  })

  it('leaves glyphs it cannot verify untouched instead of guessing', () => {
    // "J" is झ् in the published Shusha tables, but real Shivaji text uses "J-" for
    // ई, so it is deliberately not mapped.
    expect(toUnicode('J', 'shivaji')).toBe('J')
  })

  it('does not support Unicode → Shivaji (returns the input unchanged)', () => {
    expect(FONT_SUPPORT.shivaji.fromUnicode).toBe(false)
    expect(fromUnicode('महाराष्ट्र', 'shivaji')).toBe('महाराष्ट्र')
  })
})

describe('support matrix', () => {
  it('declares which directions each font supports', () => {
    const fonts: LegacyFont[] = ['krutidev', 'devlys', 'chanakya', 'shivaji']
    for (const f of fonts) expect(FONT_SUPPORT[f].toUnicode).toBe(true)
    expect(FONT_SUPPORT.krutidev.fromUnicode).toBe(true)
    expect(FONT_SUPPORT.devlys.fromUnicode).toBe(true)
    expect(FONT_SUPPORT.chanakya.fromUnicode).toBe(true)
  })
})

describe('looksLikeUnicodeDevanagari', () => {
  it('is true for Unicode Hindi', () => expect(looksLikeUnicodeDevanagari(SENTENCE_UNI)).toBe(true))
  it('is false for Kruti Dev text', () => expect(looksLikeUnicodeDevanagari(SENTENCE_KRUTI)).toBe(false))
  it('is false for Chanakya text', () => expect(looksLikeUnicodeDevanagari(SENTENCE_CHANAKYA)).toBe(false))
  it('is false for empty input', () => expect(looksLikeUnicodeDevanagari('')).toBe(false))
})

describe('edge cases', () => {
  it('returns empty string for empty input', () => {
    expect(toUnicode('', 'krutidev')).toBe('')
    expect(fromUnicode('', 'krutidev')).toBe('')
  })
  it('preserves line breaks and spaces', () => {
    expect(toUnicode('Hkkjr\n\ndeZ', 'krutidev')).toBe('भारत\n\nकर्म')
  })
})
