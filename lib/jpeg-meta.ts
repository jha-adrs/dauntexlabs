// Lossless JPEG metadata handling: read the EXIF orientation and drop metadata
// segments (EXIF incl. GPS, XMP, IPTC, comments, maker data) without re-encoding.
// Kept: APP0 (JFIF), APP2 ICC_PROFILE (colour) and APP14 Adobe (colour transform),
// plus every segment the decoder needs. Pure byte logic, no network.

const SOI = 0xd8
const SOS = 0xda
const APP1 = 0xe1
const APP2 = 0xe2
const APP14 = 0xee
const COM = 0xfe

function isJpeg(b: Uint8Array) {
  return b.length > 3 && b[0] === 0xff && b[1] === SOI
}

function startsWith(b: Uint8Array, at: number, s: string) {
  for (let i = 0; i < s.length; i++) if (b[at + i] !== s.charCodeAt(i)) return false
  return true
}

/** Walks the header segments up to SOS. Calls fn(marker, start, end) per segment. */
function walk(b: Uint8Array, fn: (marker: number, start: number, end: number) => void): number {
  let i = 2
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw new Error('Corrupt JPEG')
    const marker = b[i + 1]
    if (marker === 0xff) {
      i++ // fill byte
      continue
    }
    const end = i + 2 + ((b[i + 2] << 8) | b[i + 3])
    if (end > b.length) throw new Error('Corrupt JPEG')
    if (marker === SOS) return i
    fn(marker, i, end)
    i = end
  }
  throw new Error('Corrupt JPEG')
}

/** EXIF orientation (1–8); 1 when absent or unreadable. */
export function jpegOrientation(b: Uint8Array): number {
  if (!isJpeg(b)) return 1
  let found = 1
  try {
    walk(b, (marker, start, end) => {
      const t = start + 10 // TIFF header after "Exif\0\0"
      if (marker !== APP1 || !startsWith(b, start + 4, 'Exif\0\0') || t + 8 > end) return
      const le = b[t] === 0x49
      const u16 = (o: number) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1])
      const u32 = (o: number) => (le ? u16(o) + u16(o + 2) * 65536 : u16(o) * 65536 + u16(o + 2))
      const ifd = t + u32(t + 4)
      if (ifd + 2 > end) return
      const n = u16(ifd)
      for (let k = 0; k < n; k++) {
        const e = ifd + 2 + k * 12
        if (e + 12 > end) return
        if (u16(e) === 0x0112) {
          const v = u16(e + 8)
          if (v >= 1 && v <= 8) found = v
          return
        }
      }
    })
  } catch {
    return 1
  }
  return found
}

function keep(b: Uint8Array, marker: number, start: number) {
  if (marker === COM) return false
  if (marker === APP2) return startsWith(b, start + 4, 'ICC_PROFILE\0')
  if (marker === APP14) return startsWith(b, start + 4, 'Adobe')
  if (marker > 0xe0 && marker <= 0xef) return false
  return true
}

/** Copy of the JPEG without metadata segments. Throws if the bytes are not a JPEG. */
export function stripJpegMetadata(b: Uint8Array): Uint8Array {
  if (!isJpeg(b)) throw new Error('Not a JPEG')
  const parts: Uint8Array[] = [b.subarray(0, 2)]
  const sos = walk(b, (marker, start, end) => {
    if (keep(b, marker, start)) parts.push(b.subarray(start, end))
  })
  parts.push(b.subarray(sos))
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
