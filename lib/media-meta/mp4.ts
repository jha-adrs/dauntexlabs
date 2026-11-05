// Lossless MP4 / MOV (ISO BMFF) metadata removal. Removes the boxes where phones,
// cameras and dashcams put GPS, device and software details: `udta` (top level, in
// `moov` and in each `trak`), `meta` (in `moov` and each `trak`), vendor `uuid` boxes
// at the top level and anywhere inside `moov` (XMP, C2PA, Canon CMT, Sony PROF/USMT…;
// only spherical-video metadata is kept) and a top-level dashcam `gps ` box.
// Audio/video samples are copied byte-for-byte; every ancestor box size is
// recomputed, and absolute media offsets (stco, co64, tfhd base_data_offset, tfra
// moof_offset) are moved back by the number of bytes removed in front of them.
// Timed metadata / telemetry tracks are reported but kept. HEIF/AVIF/CR3 still images
// share the container but are not handled. Pure byte logic, no DOM, no network.

export type Mp4Metadata = {
  location?: string
  make?: string
  model?: string
  software?: string
  date?: string
  xmp: boolean
  /** A udta/meta box was found (and is removed). */
  userData: boolean
  /** Other vendor uuid boxes were found (and are removed). */
  vendor: boolean
  /** A top-level dashcam GPS log box was found (and is removed). */
  gpsLog: boolean
  /** A timed metadata / telemetry / text track exists. It is kept, not removed. */
  telemetry: boolean
}

type Box = { type: string; start: number; hdr: number; end: number; large: boolean; toEnd: boolean }
type Kind = 'udta' | 'meta' | 'xmp' | 'uuid' | 'gps'

const MAX_DEPTH = 16
const XMP_UUID = [0xbe, 0x7a, 0xcf, 0xcb, 0x97, 0xa9, 0x42, 0xe8, 0x9c, 0x71, 0x99, 0x94, 0x91, 0xe3, 0xaf, 0xac]
const SPHERICAL_UUID = [0xff, 0xcc, 0x82, 0x63, 0xf8, 0x55, 0x4a, 0x93, 0x88, 0x14, 0x58, 0x7a, 0x02, 0x52, 0x1f, 0xdd]
const TOP_TYPES = new Set(['ftyp', 'moov', 'mdat', 'free', 'skip', 'wide', 'pnot', 'uuid', 'styp', 'sidx'])
/** Still-image brands (HEIF, HEIC, AVIF, Canon CR3) that use the same container. */
const STILL_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'avif', 'avis', 'crx '])
/** The part of moov we search for user data (and that leads to stco/co64). */
const MOOV_TREE = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl'])
/** Boxes rebuilt on output: the moov tree plus fragment headers and the random-access index. */
const CONTAINERS = new Set([...MOOV_TREE, 'moof', 'traf', 'mfra'])
const TELEMETRY_ENTRIES = new Set(['gpmd', 'djmd', 'mebx', 'tx3g', 'camm'])

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

const kids = (b: Uint8Array, x: Box, depth: number) => {
  if (depth > MAX_DEPTH) throw new Error('Corrupt MP4: boxes nested too deeply')
  return boxes(b, x.start + x.hdr, x.end)
}

/**
 * True when the bytes are an ISO BMFF video (MP4, MOV, M4V, 3GP) this tool handles:
 * false for HEIF/HEIC/AVIF/CR3 brands and for files with a top-level `meta` box,
 * whose metadata lives in items this tool does not rewrite.
 */
export function isMp4(b: Uint8Array): boolean {
  if (b.length < 8 || !TOP_TYPES.has(type4(b, 4))) return false
  if (type4(b, 4) === 'ftyp') {
    const end = Math.min(b.length, u32(b, 0))
    for (let i = 8; i + 4 <= end; i += i === 8 ? 8 : 4) if (STILL_BRANDS.has(type4(b, i))) return false
  }
  try {
    return !boxes(b, 0, b.length).some((x) => x.type === 'meta')
  } catch {
    return true // damaged: let the stripper report it
  }
}

function topBoxes(b: Uint8Array) {
  if (!isMp4(b)) throw new Error('Not an MP4/MOV file')
  return boxes(b, 0, b.length)
}

const uuidIs = (b: Uint8Array, x: Box, id: number[]) =>
  x.end - x.start >= x.hdr + 16 && id.every((v, k) => b[x.start + x.hdr + k] === v)

/** Every box this tool removes, with why, in file order. */
function findRemovals(b: Uint8Array, top: Box[]): { box: Box; kind: Kind }[] {
  const out: { box: Box; kind: Kind }[] = []
  const visit = (parent: string, list: Box[], depth: number) => {
    for (const x of list) {
      if (x.type === 'uuid') {
        if (uuidIs(b, x, XMP_UUID)) out.push({ box: x, kind: 'xmp' })
        else if (!uuidIs(b, x, SPHERICAL_UUID)) out.push({ box: x, kind: 'uuid' })
      } else if (x.type === 'udta' && (parent === '' || parent === 'moov' || parent === 'trak')) out.push({ box: x, kind: 'udta' })
      else if (x.type === 'meta' && (parent === 'moov' || parent === 'trak')) out.push({ box: x, kind: 'meta' })
      else if (x.type === 'gps ' && parent === '') out.push({ box: x, kind: 'gps' })
      else if (parent === '' ? x.type === 'moov' : MOOV_TREE.has(x.type)) visit(x.type, kids(b, x, depth + 1), depth + 1)
    }
  }
  visit('', top, 0)
  return out.sort((p, q) => p.box.start - q.box.start)
}

/** Copy of the MP4/MOV without user metadata. Throws if the bytes are not a supported video. */
export function stripMp4Metadata(b: Uint8Array): Uint8Array {
  const top = topBoxes(b)
  const removed = findRemovals(b, top).map((r) => r.box)
  if (!removed.length) return b.slice()
  const gone = new Set(removed.map((x) => x.start))
  const shift = (off: number) => {
    let s = 0
    for (const r of removed) if (r.end <= off) s += r.end - r.start
    return off - s
  }

  const emit = (x: Box, depth: number): Uint8Array => {
    if (CONTAINERS.has(x.type)) {
      const parts = kids(b, x, depth + 1)
        .filter((k) => !gone.has(k.start))
        .map((k) => emit(k, depth + 1))
      const size = x.hdr + parts.reduce((n, k) => n + k.length, 0)
      const out = new Uint8Array(size)
      out.set(b.subarray(x.start, x.start + x.hdr))
      if (x.large) setU64(out, 8, size)
      else if (!x.toEnd) setU32(out, 0, size)
      let o = x.hdr
      for (const k of parts) {
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

  const parts = top.filter((x) => !gone.has(x.start)).map((x) => emit(x, 0))
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

/** True when a trak is a timed metadata / telemetry / text track. */
function isTelemetryTrack(b: Uint8Array, trak: Box, depth: number): boolean {
  const mdia = kids(b, trak, depth + 1).find((k) => k.type === 'mdia')
  if (!mdia) return false
  const mk = kids(b, mdia, depth + 2)
  const hdlr = mk.find((k) => k.type === 'hdlr')
  if (hdlr && hdlr.end - hdlr.start >= hdlr.hdr + 12 && type4(b, hdlr.start + hdlr.hdr + 8) === 'meta') return true
  const minf = mk.find((k) => k.type === 'minf')
  const stbl = minf && kids(b, minf, depth + 3).find((k) => k.type === 'stbl')
  const stsd = stbl && kids(b, stbl, depth + 4).find((k) => k.type === 'stsd')
  if (!stsd) return false
  return boxes(b, stsd.start + stsd.hdr + 8, stsd.end).some((e) => TELEMETRY_ENTRIES.has(e.type))
}

/** What user metadata an MP4/MOV carries. Throws if the bytes are not a supported video. */
export function mp4Metadata(b: Uint8Array): Mp4Metadata {
  const top = topBoxes(b)
  const m: Mp4Metadata = { xmp: false, userData: false, vendor: false, gpsLog: false, telemetry: false }
  const set = (name: string, v: string | undefined) => {
    const f = FIELDS[name]
    if (f && v && !m[f]) m[f] = v
  }
  const readMeta = (x: Box) => {
    const parts = metaChildren(b, x)
    const keysBox = parts.find((k) => k.type === 'keys')
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
    for (const ilst of parts.filter((k) => k.type === 'ilst'))
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
  for (const { box, kind } of findRemovals(b, top)) {
    if (kind === 'xmp') m.xmp = true
    else if (kind === 'uuid') m.vendor = true
    else if (kind === 'gps') m.gpsLog = true
    else {
      m.userData = true
      try {
        if (kind === 'udta') readUdta(box)
        else readMeta(box)
      } catch {
        // unreadable details: the box is still removed
      }
    }
  }
  for (const moov of top.filter((x) => x.type === 'moov'))
    for (const trak of kids(b, moov, 1).filter((k) => k.type === 'trak'))
      if (isTelemetryTrack(b, trak, 1)) m.telemetry = true
  return m
}
