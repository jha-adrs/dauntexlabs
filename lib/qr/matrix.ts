// Thin wrapper over `qrcode-generator` (lazy-loaded so it stays out of the shared bundle).

export type Ec = 'L' | 'M' | 'Q' | 'H'

export interface QrMatrix {
  size: number
  dark: boolean[][]
  /** True inside one of the three 7×7 finder patterns ("eyes"). */
  isEye(r: number, c: number): boolean
}

/** UTF-8 bytes as a binary string — the library's default encoder keeps the low byte of each char only. */
function utf8Binary(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return s
}

/** Throws if the text does not fit in a version-40 code at this EC level. */
export async function makeMatrix(text: string, ec: Ec): Promise<QrMatrix> {
  const qrcode = (await import('qrcode-generator')).default
  const qr = qrcode(0, ec)
  qr.addData(utf8Binary(text), 'Byte')
  qr.make()
  const size = qr.getModuleCount()
  const dark: boolean[][] = []
  for (let r = 0; r < size; r++) {
    const row: boolean[] = []
    for (let c = 0; c < size; c++) row.push(qr.isDark(r, c))
    dark.push(row)
  }
  const isEye = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)
  return { size, dark, isEye }
}
