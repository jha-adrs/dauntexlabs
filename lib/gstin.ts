// GSTIN (Goods and Services Tax Identification Number) format checks.
// Layout: 2-digit state code + 10-char PAN + entity number (1-9, A-Z) + 'Z' + check character.
// The check character is GSTN's mod-36 scheme over 0-9A-Z. Pure logic, no lookups.

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const FORMAT = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export const GST_STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (before 2014)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other territory',
  '99': 'Centre jurisdiction',
}

const ENTITY: Record<string, string> = {
  P: 'Individual',
  C: 'Company',
  H: 'HUF',
  F: 'Firm',
  A: 'AOP',
  T: 'Trust',
  B: 'BOI',
  L: 'Local authority',
  J: 'Artificial juridical person',
  G: 'Government',
  K: 'Krish (AJP)',
}

/** Mod-36 check character for the first 14 characters of a GSTIN. */
export function gstinCheckChar(first14: string): string {
  let sum = 0
  for (let i = 0; i < first14.length; i++) {
    const v = CHARS.indexOf(first14[i].toUpperCase())
    const p = (v < 0 ? 0 : v) * (i % 2 === 0 ? 1 : 2)
    sum += Math.floor(p / 36) + (p % 36)
  }
  return CHARS[(36 - (sum % 36)) % 36]
}

export type GstinInfo =
  | { ok: true; gstin: string; state: string; stateCode: string; pan: string; entity: string; entityNo: string }
  | { ok: false; gstin: string; error: string }

export function validateGstin(input: string): GstinInfo {
  const gstin = input.trim().toUpperCase()
  if (!gstin) return { ok: false, gstin, error: 'Enter a GSTIN.' }
  if (gstin.length !== 15) return { ok: false, gstin, error: `A GSTIN has 15 characters; this has ${gstin.length}.` }
  if (!FORMAT.test(gstin)) {
    return {
      ok: false,
      gstin,
      error: 'Invalid format: expected 2-digit state code, 10-character PAN, entity number, Z, check character.',
    }
  }
  const stateCode = gstin.slice(0, 2)
  const state = GST_STATES[stateCode]
  if (!state) return { ok: false, gstin, error: `Unknown state code ${stateCode}.` }
  const expected = gstinCheckChar(gstin.slice(0, 14))
  if (gstin[14] !== expected) {
    return { ok: false, gstin, error: `Wrong check character: expected ${expected}, found ${gstin[14]}.` }
  }
  const pan = gstin.slice(2, 12)
  return {
    ok: true,
    gstin,
    state,
    stateCode,
    pan,
    entity: ENTITY[pan[3]] ?? `Unknown (${pan[3]})`,
    entityNo: gstin[12],
  }
}
