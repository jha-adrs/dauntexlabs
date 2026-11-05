// Lossless JPEG metadata handling: read the EXIF orientation and drop metadata
// segments (EXIF incl. GPS, XMP, IPTC, comments, maker data) without re-encoding.
// Kept: APP0 (JFIF), APP2 ICC_PROFILE (colour) and APP14 Adobe (colour transform),
// plus every segment the decoder needs. Pure byte logic, no network.

const SOI = 0xd8
const SOS = 0xda
const APP0 = 0xe0
const APP1 = 0xe1
const APP2 = 0xe2
const APP13 = 0xed
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

/** What an EXIF (TIFF) block says about the photo. Absent fields are left out. */
export type ExifSummary = {
  gps: boolean
  orientation: number
  make?: string
  model?: string
  software?: string
  dateTime?: string
  dateTimeOriginal?: string
}

type TextField = 'make' | 'model' | 'software' | 'dateTime' | 'dateTimeOriginal'
const TEXT_TAGS: Record<number, TextField> = {
  0x010f: 'make',
  0x0110: 'model',
  0x0131: 'software',
  0x0132: 'dateTime',
  0x9003: 'dateTimeOriginal',
}

/**
 * Reads the TIFF structure at b[t..end) (an EXIF block after any "Exif\0\0" prefix).
 * Also used for PNG eXIf and WebP EXIF chunks. Null when it is not a readable TIFF.
 */
export function readExif(b: Uint8Array, t: number, end: number): ExifSummary | null {
  if (t + 8 > end || end > b.length) return null
  const le = b[t] === 0x49 && b[t + 1] === 0x49
  if (!le && !(b[t] === 0x4d && b[t + 1] === 0x4d)) return null
  const u16 = (o: number) => {
    if (o < t || o + 2 > end) throw new Error('Corrupt EXIF')
    return le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]
  }
  const u32 = (o: number) => (le ? u16(o) + u16(o + 2) * 65536 : u16(o) * 65536 + u16(o + 2))
  const ascii = (e: number) => {
    const n = u32(e + 4)
    const at = n <= 4 ? e + 8 : t + u32(e + 8)
    if (at + n > end) return undefined
    let s = ''
    for (let i = 0; i < Math.min(n, 256); i++) s += String.fromCharCode(b[at + i])
    return s.replace(/\0+$/, '').trim() || undefined
  }
  const out: ExifSummary = { gps: false, orientation: 1 }
  const readIfd = (ifd: number, top: boolean) => {
    const n = u16(ifd)
    for (let k = 0; k < n; k++) {
      const e = ifd + 2 + k * 12
      const tag = u16(e)
      if (top && tag === 0x0112) {
        const v = u16(e + 8)
        if (v >= 1 && v <= 8) out.orientation = v
      } else if (top && tag === 0x8825) out.gps = true
      else if (top && tag === 0x8769) {
        try {
          readIfd(t + u32(e + 8), false)
        } catch {
          // unreadable Exif sub-IFD: keep what IFD0 gave
        }
      } else if (TEXT_TAGS[tag] && u16(e + 2) === 2) {
        const v = ascii(e)
        if (v) out[TEXT_TAGS[tag]] = v
      }
    }
  }
  try {
    readIfd(t + u32(t + 4), true)
  } catch {
    // truncated IFD0: report whatever was read before the damage
  }
  return out
}

function isExif(b: Uint8Array, marker: number, start: number) {
  return marker === APP1 && startsWith(b, start + 4, 'Exif\0\0')
}

/** EXIF orientation (1–8); 1 when absent or unreadable. */
export function jpegOrientation(b: Uint8Array): number {
  if (!isJpeg(b)) return 1
  let found = 0
  try {
    walk(b, (marker, start, end) => {
      if (!found && isExif(b, marker, start)) found = readExif(b, start + 10, end)?.orientation ?? 1
    })
  } catch {
    return 1
  }
  return found || 1
}

export type JpegMetadataSummary = {
  exif: ExifSummary | null
  xmp: boolean
  iptc: boolean
  comment: boolean
  /** Any other APPn block that is removed (maker data, previews, vendor blocks). */
  other: boolean
}

/** What metadata a JPEG carries. Throws if the bytes are not a JPEG. */
export function jpegMetadataSummary(b: Uint8Array): JpegMetadataSummary {
  if (!isJpeg(b)) throw new Error('Not a JPEG')
  const s: JpegMetadataSummary = { exif: null, xmp: false, iptc: false, comment: false, other: false }
  walk(b, (marker, start, end) => {
    if (isExif(b, marker, start)) s.exif = s.exif ?? readExif(b, start + 10, end) ?? { gps: false, orientation: 1 }
    else if (marker === APP1 && startsWith(b, start + 4, 'http://ns.adobe.com/')) s.xmp = true
    else if (marker === APP13) s.iptc = true
    else if (marker === COM) s.comment = true
    else if (!keep(b, marker, start)) s.other = true
  })
  return s
}

function keep(b: Uint8Array, marker: number, start: number) {
  if (marker === COM) return false
  if (marker === APP2) return startsWith(b, start + 4, 'ICC_PROFILE\0')
  if (marker === APP14) return startsWith(b, start + 4, 'Adobe')
  if (marker > 0xe0 && marker <= 0xef) return false
  return true
}

/** A minimal EXIF APP1 segment holding only the Orientation tag (big-endian TIFF). */
function orientationSegment(o: number): Uint8Array {
  // prettier-ignore
  return Uint8Array.from([
    0xff, APP1, 0, 34,
    0x45, 0x78, 0x69, 0x66, 0, 0, // "Exif\0\0"
    0x4d, 0x4d, 0, 42, 0, 0, 0, 8, // "MM", 42, IFD0 at offset 8
    0, 1, // one entry
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, // Orientation, SHORT, count 1, value
    0, 0, 0, 0, // no next IFD
  ])
}

/**
 * Copy of the JPEG without metadata segments. Throws if the bytes are not a JPEG.
 * With keepOrientation, a non-default EXIF orientation is written back as a minimal
 * EXIF block (that tag only), after SOI/APP0, so the photo still displays upright.
 */
export function stripJpegMetadata(b: Uint8Array, opts: { keepOrientation?: boolean } = {}): Uint8Array {
  if (!isJpeg(b)) throw new Error('Not a JPEG')
  const orientation = opts.keepOrientation ? jpegOrientation(b) : 1
  const parts: Uint8Array[] = [b.subarray(0, 2)]
  let inserted = orientation === 1
  const sos = walk(b, (marker, start, end) => {
    if (!keep(b, marker, start)) return
    if (!inserted && marker !== APP0) {
      parts.push(orientationSegment(orientation))
      inserted = true
    }
    parts.push(b.subarray(start, end))
    if (!inserted) {
      parts.push(orientationSegment(orientation))
      inserted = true
    }
  })
  if (!inserted) parts.push(orientationSegment(orientation))
  parts.push(b.subarray(sos))
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
