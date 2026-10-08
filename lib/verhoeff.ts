// Verhoeff check digit (dihedral group D5), as used by Aadhaar's 12th digit.

const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

function checksum(digits: string, offset: number): number {
  let c = 0
  for (let i = 0; i < digits.length; i++) {
    const d = digits.charCodeAt(digits.length - 1 - i) - 48
    c = D[c][P[(i + offset) % 8][d]]
  }
  return c
}

/** The check digit to append to `digits`. */
export function verhoeffCheck(digits: string): number {
  return INV[checksum(digits, 1)]
}

/** True when the last digit of `digits` is its correct Verhoeff check digit. */
export function verhoeffValid(digits: string): boolean {
  return /^\d+$/.test(digits) && checksum(digits, 0) === 0
}

export function validateAadhaar(input: string): { ok: true; masked: string } | { ok: false; error: string } {
  const n = input.replace(/[\s-]/g, '')
  if (!n) return { ok: false, error: 'Enter a 12-digit Aadhaar number.' }
  if (!/^\d+$/.test(n)) return { ok: false, error: 'An Aadhaar number contains digits only.' }
  if (n.length !== 12) return { ok: false, error: `An Aadhaar number has 12 digits; this has ${n.length}.` }
  if (n[0] === '0' || n[0] === '1') return { ok: false, error: 'An Aadhaar number cannot start with 0 or 1.' }
  if (!verhoeffValid(n)) return { ok: false, error: 'The check digit (last digit) does not match.' }
  return { ok: true, masked: `XXXX XXXX ${n.slice(8)}` }
}
