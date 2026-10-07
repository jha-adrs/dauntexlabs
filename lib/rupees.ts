// Amount → words in the Indian numbering system (thousand, lakh, crore), English or Hindi.
// Above 99 crore the crore count itself is spelled out (1,00,00,00,000 = "One Hundred Crore").

export type RupeeLang = 'en' | 'hi'
export type RupeesResult =
  | { ok: true; words: string; formatted: string }
  | { ok: false; error: string }

/** Largest accepted amount: ₹99,99,99,99,99,999.99 */
const MAX_DIGITS = 13

const EN_ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

// Hindi cardinals 0–99. Every form was checked against its en.wiktionary.org entry
// (each Hindi section carries {{number box|hi|N}}); 95 uses the lemma पंचानवे
// (Wiktionary redirects पचानवे there). Hindi 1–99 are irregular and cannot be composed.
const HI_0_99 = (
  'शून्य एक दो तीन चार पाँच छह सात आठ नौ ' +
  'दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस ' +
  'बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस ' +
  'तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस ' +
  'चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास ' +
  'पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ ' +
  'साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर ' +
  'सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी ' +
  'अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी ' +
  'नब्बे इक्यानवे बानवे तिरानवे चौरानवे पंचानवे छियानवे सत्तानवे अट्ठानवे निन्यानवे'
).split(' ')

const WORDS = {
  en: {
    below100: (n: number) =>
      n < 20 ? EN_ONES[n] : EN_TENS[Math.floor(n / 10)] + (n % 10 ? '-' + EN_ONES[n % 10] : ''),
    hundred: 'Hundred', thousand: 'Thousand', lakh: 'Lakh', crore: 'Crore',
    rupee: 'Rupee', rupees: 'Rupees', paisa: 'Paisa', paise: 'Paise', and: 'and', only: 'Only',
  },
  hi: {
    below100: (n: number) => HI_0_99[n],
    hundred: 'सौ', thousand: 'हज़ार', lakh: 'लाख', crore: 'करोड़',
    rupee: 'रुपया', rupees: 'रुपये', paisa: 'पैसा', paise: 'पैसे', and: 'और', only: 'मात्र',
  },
}

/** Words for a positive integer (no "zero"), Indian grouping, recursive above 99 crore. */
function intWords(n: number, lang: RupeeLang): string {
  const w = WORDS[lang]
  const parts: string[] = []
  const crore = Math.floor(n / 1e7)
  if (crore) parts.push(intWords(crore, lang) + ' ' + w.crore)
  let r = n % 1e7
  const lakh = Math.floor(r / 1e5)
  if (lakh) parts.push(w.below100(lakh) + ' ' + w.lakh)
  r %= 1e5
  const thousand = Math.floor(r / 1e3)
  if (thousand) parts.push(w.below100(thousand) + ' ' + w.thousand)
  r %= 1e3
  const hundred = Math.floor(r / 100)
  if (hundred) parts.push(w.below100(hundred) + ' ' + w.hundred)
  r %= 100
  if (r) parts.push(w.below100(r))
  return parts.join(' ')
}

/** Indian digit grouping for a string of digits: 12345678 → 1,23,45,678 */
export function formatIndian(digits: string): string {
  const d = digits.replace(/^0+(?=\d)/, '')
  if (d.length <= 3) return d
  const last3 = d.slice(-3)
  const rest = d.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  return rest + ',' + last3
}

export function rupeesInWords(
  amount: string,
  lang: RupeeLang,
  opts: { only: boolean },
): RupeesResult {
  const s = amount.replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '')
  if (!s) return { ok: false, error: 'Enter an amount.' }
  if (s.startsWith('-')) return { ok: false, error: 'Negative amounts are not supported.' }
  const m = /^(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m || (!m[1] && !m[2])) return { ok: false, error: 'Enter a number, like 1,25,000.50.' }
  const intPart = (m[1] || '0').replace(/^0+(?=\d)/, '')
  const dec = m[2] ?? ''
  if (dec.length > 2) return { ok: false, error: 'Use at most two decimal places (paise).' }
  if (intPart.length > MAX_DIGITS)
    return { ok: false, error: 'Amount is too large. The maximum is ₹99,99,99,99,99,999.99.' }

  const rupees = Number(intPart)
  const paise = Number(dec.padEnd(2, '0'))
  const w = WORDS[lang]

  const segs: string[] = []
  if (rupees > 0 || paise === 0) {
    segs.push(
      (rupees === 0 ? w.below100(0) : intWords(rupees, lang)) +
        ' ' + (rupees === 1 ? w.rupee : w.rupees),
    )
  }
  if (paise > 0) {
    if (segs.length) segs.push(w.and)
    segs.push(w.below100(paise) + ' ' + (paise === 1 ? w.paisa : w.paise))
  }
  if (opts.only) segs.push(w.only)

  return {
    ok: true,
    words: segs.join(' '),
    formatted: '₹' + formatIndian(intPart) + '.' + String(paise).padStart(2, '0'),
  }
}
