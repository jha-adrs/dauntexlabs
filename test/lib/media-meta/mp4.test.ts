import { describe, it, expect } from 'vitest'
import { mp4Metadata, stripMp4Metadata } from '@/lib/media-meta/mp4'

// Synthetic ISO BMFF files built byte by byte. Chunk offsets (stco/co64) point at
// 4-byte markers inside mdat, so a correct strip must still land on the same markers.

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))
const u16 = (v: number) => [v >> 8, v & 0xff]
const u32 = (v: number) => [v >>> 24, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
const u64 = (v: number) => [...u32(Math.floor(v / 2 ** 32)), ...u32(v >>> 0)]
const box = (type: string, ...payload: number[][]) => [...u32(8 + payload.flat().length), ...ascii(type), ...payload.flat()]
const bigBox = (type: string, ...payload: number[][]) => [...u32(1), ...ascii(type), ...u64(16 + payload.flat().length), ...payload.flat()]
const full = (type: string, ...payload: number[][]) => box(type, [0, 0, 0, 0], ...payload)

/** QuickTime-style user-data string atom: [len][lang][text]. */
const qtString = (type: number[], s: string) => [...u32(12 + s.length), ...type, ...u16(s.length), ...u16(0x15c7), ...ascii(s)]
const C = 0xa9 // ©

const UDTA = box(
  'udta',
  qtString([C, ...ascii('xyz')], '+12.9716+077.5946/'),
  qtString([C, ...ascii('mak')], 'CANARY-MAKE'),
  qtString([C, ...ascii('mod')], 'CANARY-MODEL'),
  qtString([C, ...ascii('swr')], 'CANARY-SOFT'),
  qtString([C, ...ascii('day')], '2026-01-02T03:04:05+0530'),
)

/** Apple moov/meta: hdlr + keys + ilst (no FullBox header in QuickTime). */
const key = (name: string) => [...u32(8 + name.length), ...ascii('mdta'), ...ascii(name)]
const dataBox = (s: string) => box('data', u32(1), u32(0), ascii(s))
const META = box(
  'meta',
  full('hdlr', u32(0), ascii('mdta'), new Array(12).fill(0), [0]),
  full('keys', u32(2), key('com.apple.quicktime.location.ISO6709'), key('com.apple.quicktime.model')),
  box('ilst', [...u32(8 + 8 + 4 + 4 + 18), ...u32(1), ...dataBox('+37.3317-122.0302/')], [...u32(8 + 8 + 4 + 4 + 9), ...u32(2), ...dataBox('iPhone 99')]),
)

const XMP_UUID = [0xbe, 0x7a, 0xcf, 0xcb, 0x97, 0xa9, 0x42, 0xe8, 0x9c, 0x71, 0x99, 0x94, 0x91, 0xe3, 0xaf, 0xac]
const XMP = box('uuid', XMP_UUID, ascii('<x:xmpmeta>XMP-SECRET</x:xmpmeta>'))
const OTHER_UUID = box('uuid', new Array(16).fill(7), ascii('KEEP-ME'))

const FTYP = box('ftyp', ascii('isom'), u32(512), ascii('isommp41'))
const MVHD = full('mvhd', new Array(96).fill(1))
const MARKERS = ['CHK1', 'CHK2', 'CHK3', 'CHK4']
const mdatPayload = MARKERS.flatMap((m) => [...ascii(m), 0, 0, 0, 0])

type Opts = { moovFirst: boolean; co64?: boolean; bigMoov?: boolean; mdatToEnd?: boolean; xmpBefore?: boolean }

function trak(chunkTable: number[], withUdta: boolean, co64: boolean) {
  const table = co64
    ? full('co64', u32(chunkTable.length), ...chunkTable.map(u64))
    : full('stco', u32(chunkTable.length), ...chunkTable.map(u32))
  return box(
    'trak',
    full('tkhd', new Array(80).fill(2)),
    ...(withUdta ? [box('udta', qtString([C, ...ascii('nam')], 'TRACK-SECRET'))] : []),
    box('mdia', full('mdhd', new Array(20).fill(3)), box('minf', box('stbl', full('stsd', u32(0)), table))),
  )
}

/** Builds a file twice: first to measure where mdat lands, then with real offsets. */
function build(o: Opts, withMeta = true) {
  const make = (offsets: number[]) => {
    const t1 = trak(offsets.slice(0, 2), withMeta, false)
    const t2 = trak(offsets.slice(2), false, !!o.co64)
    const kids = [MVHD, ...(withMeta ? [UDTA, META] : []), t1, t2]
    const moov = o.bigMoov ? bigBox('moov', ...kids) : box('moov', ...kids)
    const mdat = o.mdatToEnd ? [...u32(0), ...ascii('mdat'), ...mdatPayload] : box('mdat', mdatPayload)
    const xmp = withMeta ? XMP : []
    const parts = o.moovFirst
      ? [FTYP, moov, ...(o.xmpBefore ? [xmp, OTHER_UUID] : []), mdat, ...(o.xmpBefore ? [] : [xmp, OTHER_UUID])]
      : [FTYP, ...(o.xmpBefore ? [xmp, OTHER_UUID] : []), mdat, moov, ...(o.xmpBefore ? [] : [xmp, OTHER_UUID])]
    return parts.flat()
  }
  const probe = make([0, 0, 0, 0])
  const mdatAt = Buffer.from(probe).indexOf(Buffer.from('CHK1')) // payload start
  return Uint8Array.from(make(MARKERS.map((_, i) => mdatAt + i * 8)))
}

const has = (buf: Uint8Array, s: string) => Buffer.from(buf).includes(Buffer.from(s, 'latin1'))

/** Reads every chunk offset of every stco/co64 in the file (deep scan by type). */
function chunkOffsets(b: Uint8Array): number[] {
  const out: number[] = []
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
  for (const t of ['stco', 'co64']) {
    let i = Buffer.from(b).indexOf(t)
    while (i > 0) {
      const n = dv.getUint32(i + 8)
      for (let k = 0; k < n; k++)
        out.push(t === 'stco' ? dv.getUint32(i + 12 + k * 4) : dv.getUint32(i + 12 + k * 8) * 2 ** 32 + dv.getUint32(i + 16 + k * 8))
      i = Buffer.from(b).indexOf(t, i + 4)
    }
  }
  return out
}
const markersAt = (b: Uint8Array) => chunkOffsets(b).map((off) => Buffer.from(b.subarray(off, off + 4)).toString('latin1'))

/** Asserts every box size in the tree (top level + known containers) adds up exactly. */
function assertSizes(b: Uint8Array, start = 0, end = b.length) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
  let i = start
  while (i < end) {
    let size = dv.getUint32(i)
    let hdr = 8
    if (size === 1) {
      size = dv.getUint32(i + 8) * 2 ** 32 + dv.getUint32(i + 12)
      hdr = 16
    } else if (size === 0) size = end - i
    const type = Buffer.from(b.subarray(i + 4, i + 8)).toString('latin1')
    expect(size, `${type} size`).toBeGreaterThanOrEqual(hdr)
    expect(i + size, `${type} fits parent`).toBeLessThanOrEqual(end)
    if (['moov', 'trak', 'mdia', 'minf', 'stbl'].includes(type)) assertSizes(b, i + hdr, i + size)
    i += size
  }
  expect(i).toBe(end)
}

const SECRETS = ['CANARY', 'TRACK-SECRET', 'XMP-SECRET', '12.9716', '37.3317', 'iPhone 99', 'location.ISO6709', 'udta']

describe('stripMp4Metadata', () => {
  it('moov before mdat: removes udta/meta/XMP and shifts every stco + co64 offset', () => {
    const input = build({ moovFirst: true, co64: true })
    expect(markersAt(input)).toEqual(MARKERS)
    const out = stripMp4Metadata(input)
    for (const s of SECRETS) expect(has(out, s), s).toBe(false)
    expect(has(out, 'KEEP-ME')).toBe(true)
    assertSizes(out)
    expect(markersAt(out)).toEqual(MARKERS)
    expect(chunkOffsets(out)).not.toEqual(chunkOffsets(input)) // they really moved
  })

  it('moov after mdat: offsets are left untouched', () => {
    const input = build({ moovFirst: false, co64: true })
    const out = stripMp4Metadata(input)
    for (const s of SECRETS) expect(has(out, s), s).toBe(false)
    assertSizes(out)
    expect(chunkOffsets(out)).toEqual(chunkOffsets(input))
    expect(markersAt(out)).toEqual(MARKERS)
  })

  it('an XMP uuid box before mdat also shifts offsets, even when moov is last', () => {
    const input = build({ moovFirst: false, xmpBefore: true })
    const out = stripMp4Metadata(input)
    expect(has(out, 'XMP-SECRET')).toBe(false)
    assertSizes(out)
    expect(markersAt(out)).toEqual(MARKERS)
  })

  it('handles a 64-bit moov size and an mdat that runs to end of file', () => {
    // A size-0 mdat must be the last box, so the XMP box goes in front of it.
    const input = build({ moovFirst: true, bigMoov: true, mdatToEnd: true, co64: true, xmpBefore: true })
    const out = stripMp4Metadata(input)
    for (const s of SECRETS) expect(has(out, s), s).toBe(false)
    assertSizes(out)
    expect(markersAt(out)).toEqual(MARKERS)
    expect(out[0 + FTYP.length + 3]).toBe(1) // still a 64-bit size field
  })

  it('returns an identical copy when there is no metadata', () => {
    const clean = build({ moovFirst: true }, false)
    expect(Array.from(stripMp4Metadata(clean))).toEqual(Array.from(clean))
  })

  it('shifts an absolute tfhd base_data_offset in a fragmented file', () => {
    const tfhd = (base: number) => box('tfhd', [0, 0, 0, 1], u32(1), u64(base))
    const make = (base: number) => [
      ...FTYP,
      ...box('moov', MVHD, UDTA),
      ...box('moof', full('mfhd', u32(1)), box('traf', tfhd(base))),
      ...box('mdat', ascii('FRAG')),
    ]
    const probe = make(0)
    const input = Uint8Array.from(make(Buffer.from(probe).indexOf('FRAG')))
    const out = stripMp4Metadata(input)
    const at = Buffer.from(out).indexOf('tfhd') + 4 + 4 + 4
    const base = new DataView(out.buffer).getUint32(at + 4)
    expect(Buffer.from(out.subarray(base, base + 4)).toString('latin1')).toBe('FRAG')
  })

  it('shifts tfra moof offsets (v0 and v1) in the mfra random-access index', () => {
    // tfra: track_ID, sizes byte (all 1-byte numbers), entry count, entries.
    const tfra = (v: 0 | 1, moofAt: number) =>
      box('tfra', [v, 0, 0, 0], u32(1), u32(0), u32(1), v ? [...u64(0), ...u64(moofAt)] : [...u32(0), ...u32(moofAt)], [1, 1, 1])
    const make = (moofAt: number) => {
      const body = [...FTYP, ...box('moov', MVHD, UDTA)]
      const moof = box('moof', full('mfhd', u32(1)))
      const rest = [...moof, ...box('mdat', ascii('FRAG'))]
      const mfra = box('mfra', tfra(0, moofAt), tfra(1, moofAt), full('mfro', u32(0)))
      return [...body, ...rest, ...mfra]
    }
    const probe = make(0)
    const input = Uint8Array.from(make(Buffer.from(probe).indexOf('moof') - 4))
    const out = stripMp4Metadata(input)
    const moofAt = Buffer.from(out).indexOf('moof') - 4
    const dv = new DataView(out.buffer)
    const t0 = Buffer.from(out).indexOf('tfra') + 4
    const t1 = Buffer.from(out).indexOf('tfra', t0) + 4
    expect(dv.getUint32(t0 + 16 + 4)).toBe(moofAt) // v0: time u32, then moof_offset u32
    expect(dv.getUint32(t1 + 16 + 8 + 4)).toBe(moofAt) // v1: time u64, then moof_offset u64 (low word)
  })

  it('rejects input that is not an ISO BMFF file or has a broken box size', () => {
    expect(() => stripMp4Metadata(Uint8Array.from(ascii('hello world, not a video')))).toThrow(/MP4/)
    const bad = Uint8Array.from([...FTYP, ...u32(9999), ...ascii('moov'), 1, 2, 3])
    expect(() => stripMp4Metadata(bad)).toThrow()
  })
})

describe('mp4Metadata', () => {
  it('reports location, make/model, software, date and XMP from udta, meta keys and uuid', () => {
    const m = mp4Metadata(build({ moovFirst: true }))
    expect(m).toEqual({
      location: '+12.9716+077.5946/',
      make: 'CANARY-MAKE',
      model: 'CANARY-MODEL',
      software: 'CANARY-SOFT',
      date: '2026-01-02T03:04:05+0530',
      xmp: true,
      userData: true,
    })
  })

  it('reads Apple keys/ilst values when udta has none', () => {
    const input = Uint8Array.from([...FTYP, ...box('moov', MVHD, META), ...box('mdat', [1])])
    expect(mp4Metadata(input)).toEqual({ location: '+37.3317-122.0302/', model: 'iPhone 99', xmp: false, userData: true })
  })

  it('reports nothing for a clean file', () => {
    expect(mp4Metadata(build({ moovFirst: true }, false))).toEqual({ xmp: false, userData: false })
  })
})
