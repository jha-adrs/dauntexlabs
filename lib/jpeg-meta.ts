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

const EOI = 0xd9
const DATA = -1

/** A marker segment, a run of entropy-coded scan data (DATA) or the EOI marker. */
type Part = { marker: number; start: number; end: number }

/**
 * Splits the primary image into parts, following the scan data (where FF00 and RSTn
 * are data) through any segments between progressive scans, up to the EOI that
 * closes it. `end` is where the primary image stops; anything after it (MPF images,
 * maker trailers, motion-photo videos) is not part of the picture.
 */
function parse(b: Uint8Array): { parts: Part[]; end: number } {
  const parts: Part[] = []
  let i = 2
  let scanned = false
  while (i < b.length) {
    if (i + 2 > b.length || b[i] !== 0xff) {
      if (scanned) break
      throw new Error('Corrupt JPEG')
    }
    const marker = b[i + 1]
    if (marker === 0xff) {
      i++ // fill byte
      continue
    }
    if (marker === EOI) {
      parts.push({ marker, start: i, end: i + 2 })
      return { parts, end: i + 2 }
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      parts.push({ marker, start: i, end: i + 2 }) // standalone marker
      i += 2
      continue
    }
    if (i + 4 > b.length) throw new Error('Corrupt JPEG')
    const end = i + 2 + ((b[i + 2] << 8) | b[i + 3])
    if (end > b.length) throw new Error('Corrupt JPEG')
    parts.push({ marker, start: i, end })
    i = end
    if (marker === SOS) {
      scanned = true
      let j = i
      while (j < b.length) {
        if (b[j] !== 0xff) j++
        else if (b[j + 1] === 0x00 || (b[j + 1] >= 0xd0 && b[j + 1] <= 0xd7)) j += 2
        else if (b[j + 1] === 0xff) j++
        else break
      }
      j = Math.min(j, b.length)
      if (j > i) parts.push({ marker: DATA, start: i, end: j })
      i = j
    }
  }
  if (!scanned) throw new Error('Corrupt JPEG')
  return { parts, end: b.length } // truncated: no EOI, keep what is there
}

/** Calls fn(marker, start, end) for every marker segment that has a length. */
function walk(b: Uint8Array, fn: (marker: number, start: number, end: number) => void) {
  for (const p of parse(b).parts) if (p.marker !== DATA && p.end - p.start > 2) fn(p.marker, p.start, p.end)
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
  /** Any other APPn block that is removed (maker data, previews, JFIF thumbnails, vendor blocks). */
  other: boolean
  /** Data after the primary image: MPF images (gain/depth maps), maker trailers, motion-photo video. */
  trailer: boolean
}

/** What metadata a JPEG carries. Throws if the bytes are not a JPEG. */
export function jpegMetadataSummary(b: Uint8Array): JpegMetadataSummary {
  if (!isJpeg(b)) throw new Error('Not a JPEG')
  const s: JpegMetadataSummary = { exif: null, xmp: false, iptc: false, comment: false, other: false, trailer: false }
  const { parts, end } = parse(b)
  for (const { marker, start, end } of parts) {
    if (marker === DATA || end - start <= 2) continue
    if (isExif(b, marker, start)) s.exif = s.exif ?? readExif(b, start + 10, end) ?? { gps: false, orientation: 1 }
    else if (marker === APP1 && startsWith(b, start + 4, 'http://ns.adobe.com/')) s.xmp = true
    else if (marker === APP13) s.iptc = true
    else if (marker === COM) s.comment = true
    else if (!keep(b, marker, start) || hasJfifThumbnail(b, marker, start, end)) s.other = true
  }
  s.trailer = end < b.length
  return s
}

function keep(b: Uint8Array, marker: number, start: number) {
  if (marker === COM) return false
  if (marker === APP0) return startsWith(b, start + 4, 'JFIF\0')
  if (marker === APP2) return startsWith(b, start + 4, 'ICC_PROFILE\0')
  if (marker === APP14) return startsWith(b, start + 4, 'Adobe')
  if (marker > 0xe0 && marker <= 0xef) return false
  return true
}

/** JFIF APP0 body: "JFIF\0", version(2), units, Xdensity(2), Ydensity(2), Xthumb, Ythumb, thumbnail. */
const JFIF_HEAD = 14
function hasJfifThumbnail(b: Uint8Array, marker: number, start: number, end: number) {
  return marker === APP0 && startsWith(b, start + 4, 'JFIF\0') && end - start > 4 + JFIF_HEAD - 2 &&
    (end - start > 4 + JFIF_HEAD || b[start + 4 + 12] !== 0 || b[start + 4 + 13] !== 0)
}

/** JFIF APP0 with its thumbnail removed (Xthumb = Ythumb = 0). */
function jfifWithoutThumbnail(b: Uint8Array, start: number): Uint8Array {
  const out = new Uint8Array(4 + JFIF_HEAD)
  out.set([0xff, APP0, 0, JFIF_HEAD + 2])
  out.set(b.subarray(start + 4, start + 4 + 12), 4)
  return out // last two bytes stay 0
}

/** A minimal big-endian TIFF block holding only the Orientation tag (26 bytes). */
export function orientationTiff(o: number): Uint8Array {
  // prettier-ignore
  return Uint8Array.from([
    0x4d, 0x4d, 0, 42, 0, 0, 0, 8, // "MM", 42, IFD0 at offset 8
    0, 1, // one entry
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, // Orientation, SHORT, count 1, value
    0, 0, 0, 0, // no next IFD
  ])
}

/** A minimal EXIF APP1 segment holding only the Orientation tag. */
function orientationSegment(o: number): Uint8Array {
  const out = new Uint8Array(4 + 6 + 26)
  out.set([0xff, APP1, 0, 2 + 6 + 26, 0x45, 0x78, 0x69, 0x66, 0, 0]) // "Exif\0\0"
  out.set(orientationTiff(o), 10)
  return out
}

/**
 * Copy of the JPEG without metadata segments (also between progressive scans) and
 * without anything after the primary image's EOI. Throws if the bytes are not a JPEG.
 * With keepOrientation, a non-default EXIF orientation is written back as a minimal
 * EXIF block (that tag only), after SOI/APP0, so the photo still displays upright.
 */
export function stripJpegMetadata(b: Uint8Array, opts: { keepOrientation?: boolean } = {}): Uint8Array {
  if (!isJpeg(b)) throw new Error('Not a JPEG')
  const orientation = opts.keepOrientation ? jpegOrientation(b) : 1
  const parts: Uint8Array[] = [b.subarray(0, 2)]
  let inserted = orientation === 1
  for (const { marker, start, end } of parse(b).parts) {
    const segment = marker !== DATA && end - start > 2
    if (segment && !keep(b, marker, start)) continue
    if (!inserted && marker !== APP0) {
      parts.push(orientationSegment(orientation))
      inserted = true
    }
    parts.push(hasJfifThumbnail(b, marker, start, end) ? jfifWithoutThumbnail(b, start) : b.subarray(start, end))
    if (!inserted) {
      parts.push(orientationSegment(orientation))
      inserted = true
    }
  }
  if (!inserted) parts.push(orientationSegment(orientation))
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
