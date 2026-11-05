// Lossless MP4 / MOV (ISO BMFF) metadata removal. Removes the user-data boxes where
// phones and cameras put GPS, device and software details (`udta` and `meta` inside
// `moov` and each `trak`) plus top-level XMP `uuid` boxes. Audio/video samples are
// copied byte-for-byte; every ancestor box size is recomputed, and absolute media
// offsets (stco, co64, tfhd base_data_offset, tfra moof_offset) are moved back by the number of bytes
// removed in front of them. Pure byte logic, no DOM, no network.

export type Mp4Metadata = {
  location?: string
  make?: string
  model?: string
  software?: string
  date?: string
  xmp: boolean
  /** True when any udta/meta box is present (and will be removed). */
  userData: boolean
}

type Box = { type: string; start: number; hdr: number; end: number; large: boolean; toEnd: boolean }

const XMP_UUID = [0xbe, 0x7a, 0xcf, 0xcb, 0x97, 0xa9, 0x42, 0xe8, 0x9c, 0x71, 0x99, 0x94, 0x91, 0xe3, 0xaf, 0xac]
const TOP_TYPES = new Set(['ftyp', 'moov', 'mdat', 'free', 'skip', 'wide', 'pnot', 'uuid', 'styp', 'sidx'])
/** Boxes we descend into: the path to stco/co64 and to fragment headers. */
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'moof', 'traf', 'mfra'])

const u32 = (b: Uint8Array, i: number) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3]
const u64 = (b: Uint8Array, i: number) => u32(b, i) * 2 ** 32 + u32(b, i + 4)
const type4 = (b: Uint8Array, i: number) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3])

function setU32(b: Uint8Array, i: number, v: number) {
  b[i] = v >>> 24
  b[i + 1] = (v >>> 16) & 0xff
  b[i + 2] = (v >>> 8) & 0xff
  b[i + 3] = v & 0xff
}
function setU64(b: Uint8Array, i: number, v: number) {
  setU32(b, i, Math.floor(v / 2 ** 32))
  setU32(b, i + 4, v >>> 0)
}

function boxes(b: Uint8Array, start: number, end: number): Box[] {
  const out: Box[] = []
  let i = start
  while (i + 8 <= end) {
    let size = u32(b, i)
    let hdr = 8
    const large = size === 1
    const toEnd = size === 0
    if (large) {
      if (i + 16 > end) throw new Error('Corrupt MP4')
      size = u64(b, i + 8)
      hdr = 16
    } else if (toEnd) size = end - i
    if (size < hdr || i + size > end) throw new Error('Corrupt MP4')
    out.push({ type: type4(b, i + 4), start: i, hdr, end: i + size, large, toEnd })
    i += size
  }
  return out
}

/** True when the bytes start like an ISO BMFF (MP4, MOV, M4V, 3GP) file. */
export const isMp4 = (b: Uint8Array) => b.length >= 8 && TOP_TYPES.has(type4(b, 4))

function topBoxes(b: Uint8Array) {
  if (!isMp4(b)) throw new Error('Not an MP4/MOV file')
  return boxes(b, 0, b.length)
}

const isXmp = (b: Uint8Array, x: Box) =>
  x.type === 'uuid' && x.end - x.start >= x.hdr + 16 && XMP_UUID.every((v, k) => b[x.start + x.hdr + k] === v)
const isUserData = (parent: string, x: Box) => (parent === 'moov' || parent === 'trak') && (x.type === 'udta' || x.type === 'meta')

/** Every byte range this tool removes, in file order. */
function removals(b: Uint8Array, top: Box[]): Box[] {
  const out: Box[] = []
  const visit = (parent: string, list: Box[]) => {
    for (const x of list) {
      if (isUserData(parent, x)) out.push(x)
      else if (x.type === 'moov' || (parent === 'moov' && x.type === 'trak')) visit(x.type, boxes(b, x.start + x.hdr, x.end))
    }
  }
  for (const x of top) if (isXmp(b, x)) out.push(x)
  visit('', top)
  return out.sort((p, q) => p.start - q.start)
}

/** Copy of the MP4/MOV without user metadata. Throws if the bytes are not ISO BMFF. */
export function stripMp4Metadata(b: Uint8Array): Uint8Array {
  const top = topBoxes(b)
  const removed = removals(b, top)
  if (!removed.length) return b.slice()
  const gone = new Set(removed.map((x) => x.start))
  const shift = (off: number) => {
    let s = 0
    for (const r of removed) if (r.end <= off) s += r.end - r.start
    return off - s
  }

  const emit = (x: Box): Uint8Array => {
    if (CONTAINERS.has(x.type)) {
      const kids = boxes(b, x.start + x.hdr, x.end)
        .filter((k) => !gone.has(k.start))
        .map(emit)
      const size = x.hdr + kids.reduce((n, k) => n + k.length, 0)
      const out = new Uint8Array(size)
      out.set(b.subarray(x.start, x.start + x.hdr))
      if (x.large) setU64(out, 8, size)
      else if (!x.toEnd) setU32(out, 0, size)
      let o = x.hdr
      for (const k of kids) {
        out.set(k, o)
        o += k.length
      }
      return out
    }
    const out = b.slice(x.start, x.end)
    const p = x.hdr // payload: version/flags first for these FullBoxes
    if ((x.type === 'stco' || x.type === 'co64') && out.length >= p + 8) {
      const n = u32(out, p + 4)
      const w = x.type === 'stco' ? 4 : 8
      if (p + 8 + n * w > out.length) throw new Error('Corrupt MP4')
      for (let k = 0; k < n; k++) {
        const at = p + 8 + k * w
        if (w === 4) setU32(out, at, shift(u32(out, at)))
        else setU64(out, at, shift(u64(out, at)))
      }
    } else if (x.type === 'tfhd' && out.length >= p + 16 && out[p + 3] & 0x01) {
      setU64(out, p + 8, shift(u64(out, p + 8)))
    } else if (x.type === 'tfra' && out.length >= p + 16) {
      // entries: time + moof_offset (32- or 64-bit by version), then traf/trun/sample numbers.
      const v1 = out[p] === 1
      const sizes = out[p + 11]
      const tail = ((sizes >> 4) & 3) + ((sizes >> 2) & 3) + (sizes & 3) + 3
      const w = v1 ? 8 : 4
      const n = u32(out, p + 12)
      if (p + 16 + n * (2 * w + tail) > out.length) throw new Error('Corrupt MP4')
      for (let k = 0; k < n; k++) {
        const at = p + 16 + k * (2 * w + tail) + w
        if (v1) setU64(out, at, shift(u64(out, at)))
        else setU32(out, at, shift(u32(out, at)))
      }
    }
    return out
  }

  const parts = top.filter((x) => !gone.has(x.start)).map(emit)
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

/* ---- reporting ---------------------------------------------------------- */

type Field = 'location' | 'make' | 'model' | 'software' | 'date'
const C = '©' // ©
const FIELDS: Record<string, Field> = {
  [`${C}xyz`]: 'location',
  [`${C}mak`]: 'make',
  [`${C}mod`]: 'model',
  [`${C}swr`]: 'software',
  [`${C}too`]: 'software',
  [`${C}day`]: 'date',
  'com.apple.quicktime.location.ISO6709': 'location',
  'com.apple.quicktime.make': 'make',
  'com.apple.quicktime.model': 'model',
  'com.apple.quicktime.software': 'software',
  'com.apple.quicktime.creationdate': 'date',
  'com.android.manufacturer': 'make',
  'com.android.model': 'model',
  'com.android.version': 'software',
}

function text(b: Uint8Array, from: number, to: number) {
  return new TextDecoder().decode(b.subarray(from, Math.min(to, from + 200))).replace(/\0+$/, '').trim()
}

/** Value of an item that holds a `data` box (iTunes/Apple style), if any. */
function dataValue(b: Uint8Array, x: Box) {
  const d = boxes(b, x.start + x.hdr, x.end).find((k) => k.type === 'data')
  return d && d.end - d.start >= 16 ? text(b, d.start + 16, d.end) : undefined
}

/** Children of a meta box: ISO meta is a FullBox (4 header bytes), QuickTime meta is not. */
function metaChildren(b: Uint8Array, x: Box) {
  const p = x.start + x.hdr
  const plain = ['hdlr', 'keys', 'ilst'].includes(type4(b, p + 4))
  return boxes(b, plain ? p : p + 4, x.end)
}

/** What user metadata an MP4/MOV carries. Throws if the bytes are not ISO BMFF. */
export function mp4Metadata(b: Uint8Array): Mp4Metadata {
  const top = topBoxes(b)
  const m: Mp4Metadata = { xmp: false, userData: false }
  const set = (name: string, v: string | undefined) => {
    const f = FIELDS[name]
    if (f && v && !m[f]) m[f] = v
  }
  const readMeta = (x: Box) => {
    const kids = metaChildren(b, x)
    const keysBox = kids.find((k) => k.type === 'keys')
    const names: string[] = []
    if (keysBox) {
      let i = keysBox.start + keysBox.hdr + 8
      for (let n = u32(b, keysBox.start + keysBox.hdr + 4); n > 0 && i + 8 <= keysBox.end; n--) {
        const size = u32(b, i)
        if (size < 8) break
        names.push(text(b, i + 8, i + size))
        i += size
      }
    }
    for (const ilst of kids.filter((k) => k.type === 'ilst'))
      for (const item of boxes(b, ilst.start + ilst.hdr, ilst.end)) {
        const idx = u32(b, item.start + 4)
        set(keysBox ? names[idx - 1] ?? '' : item.type, dataValue(b, item))
      }
  }
  const readUdta = (x: Box) => {
    for (const k of boxes(b, x.start + x.hdr, x.end)) {
      if (k.type === 'meta') readMeta(k)
      else if (FIELDS[k.type]) {
        const p = k.start + k.hdr
        // QuickTime string atom: [u16 length][u16 language][text]; else an iTunes-style data box.
        const v = type4(b, p + 4) === 'data' ? dataValue(b, k) : text(b, p + 4, Math.min(k.end, p + 4 + ((b[p] << 8) | b[p + 1])))
        set(k.type, v)
      }
    }
  }
  const visit = (parent: string, list: Box[]) => {
    for (const x of list) {
      if (isUserData(parent, x)) {
        m.userData = true
        try {
          if (x.type === 'udta') readUdta(x)
          else readMeta(x)
        } catch {
          // unreadable details: the box is still removed
        }
      } else if (x.type === 'moov' || (parent === 'moov' && x.type === 'trak')) visit(x.type, boxes(b, x.start + x.hdr, x.end))
    }
  }
  for (const x of top) if (isXmp(b, x)) m.xmp = true
  visit('', top)
  return m
}
