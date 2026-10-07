import { describe, it, expect } from 'vitest'
import { PDFDocument, PDFName } from 'pdf-lib'
import { readPdfMetadata, cleanPdf } from '@/lib/pdf-metadata'

// Real pdf-lib in Node (same approach as test/tools/MergePdf.test.tsx).

async function canaryPdf(): Promise<Uint8Array> {
  const d = await PDFDocument.create()
  d.addPage()
  d.setTitle('Secret plan')
  d.setAuthor('CANARY')
  d.setSubject('Subj')
  d.setKeywords(['k1', 'k2'])
  d.setCreator('Writer')
  d.setProducer('Prod')
  d.setCreationDate(new Date('2020-01-02T03:04:05Z'))
  d.setModificationDate(new Date('2021-01-02T03:04:05Z'))
  const xmp = d.context.stream('<x:xmpmeta><dc:creator>CANARY</dc:creator></x:xmpmeta>', {
    Type: 'Metadata',
    Subtype: 'XML',
  })
  d.catalog.set(PDFName.of('Metadata'), d.context.register(xmp))
  return d.save()
}

function latin1(b: Uint8Array) {
  return Buffer.from(b).toString('latin1')
}

describe('pdf-metadata', () => {
  it('reads the Info fields and notices XMP', async () => {
    const r = await readPdfMetadata(await canaryPdf())
    if (!r.ok) throw new Error(r.error)
    expect(r.meta.author).toBe('CANARY')
    expect(r.meta.title).toBe('Secret plan')
    expect(r.meta.keywords).toBe('k1 k2')
    expect(r.meta.creationDate).toMatch(/^2020-01-02/)
    expect(r.hasXmp).toBe(true)
  })

  it('remove all: Info fields gone, XMP gone, canary absent from bytes', async () => {
    const r = await cleanPdf(await canaryPdf(), { mode: 'remove' })
    if (!r.ok) throw new Error(r.error)
    const doc = await PDFDocument.load(r.bytes, { updateMetadata: false })
    expect(doc.getAuthor()).toBeUndefined()
    expect(doc.getTitle()).toBeUndefined()
    expect(doc.getProducer()).toBeUndefined()
    expect(doc.getCreationDate()).toBeUndefined()
    expect(doc.catalog.get(PDFName.of('Metadata'))).toBeUndefined()
    expect(latin1(r.bytes)).not.toContain('CANARY')
    expect(doc.getPageCount()).toBe(1)
  })

  it('edit: sets new values, clears empty ones, drops stale XMP', async () => {
    const r = await cleanPdf(await canaryPdf(), {
      mode: 'edit',
      fields: { title: 'Report', author: '', subject: '', keywords: '', creator: '', producer: '' },
    })
    if (!r.ok) throw new Error(r.error)
    const doc = await PDFDocument.load(r.bytes, { updateMetadata: false })
    expect(doc.getTitle()).toBe('Report')
    expect(doc.getAuthor()).toBeUndefined()
    expect(latin1(r.bytes)).not.toContain('CANARY')
  })

  it('encrypted PDF → clear error', async () => {
    const d = await PDFDocument.create()
    d.addPage()
    d.context.trailerInfo.Encrypt = d.context.obj({ Filter: 'Standard', V: 1, R: 2 })
    const r = await readPdfMetadata(await d.save())
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toMatch(/encrypted/i)
  })

  it('garbage → error, no throw', async () => {
    const r = await readPdfMetadata(new TextEncoder().encode('not a pdf'))
    expect(r.ok).toBe(false)
  })
})

// Every object the saved file still contains, decoded — compressed object streams
// would hide text from a plain byte search.
async function allObjectText(bytes: Uint8Array): Promise<string> {
  const { PDFRawStream, decodePDFRawStream } = await import('pdf-lib')
  const doc = await PDFDocument.load(bytes, { updateMetadata: false })
  return doc.context
    .enumerateIndirectObjects()
    .map(([, obj]) => {
      if (obj instanceof PDFRawStream) {
        try {
          return obj.dict.toString() + Buffer.from(decodePDFRawStream(obj).decode()).toString('latin1')
        } catch {
          return obj.dict.toString()
        }
      }
      return obj.toString()
    })
    .join('\n')
    // Decode <hex> strings too (pdf-lib writes Info values as UTF-16BE hex).
    .replace(/<([0-9A-Fa-f]{4,})>/g, (_, hex: string) => {
      const buf = Buffer.from(hex, 'hex')
      return buf[0] === 0xfe && buf[1] === 0xff ? buf.subarray(2).swap16().toString('utf16le') : buf.toString('latin1')
    })
}

describe('pdf-metadata: thorough removal', () => {
  it('drops orphaned Info dictionaries left by earlier incremental saves', async () => {
    const d = await PDFDocument.load(await canaryPdf(), { updateMetadata: false })
    const { PDFString } = await import('pdf-lib')
    d.context.register(d.context.obj({ Author: PDFString.of('OLDAUTHOR') })) // unreferenced, like an old revision
    const r = await cleanPdf(await d.save({ useObjectStreams: false }), { mode: 'remove' })
    if (!r.ok) throw new Error(r.error)
    const text = await allObjectText(r.bytes)
    expect(text).not.toContain('OLDAUTHOR')
    expect(text).not.toContain('CANARY')
  })

  it('removes page-level and image-level XMP too', async () => {
    const d = await PDFDocument.load(await canaryPdf(), { updateMetadata: false })
    const xmp = d.context.stream('<x:xmpmeta>PAGEXMP</x:xmpmeta>', { Type: 'Metadata', Subtype: 'XML' })
    d.getPage(0).node.set(PDFName.of('Metadata'), d.context.register(xmp))
    d.getPage(0).node.set(PDFName.of('PieceInfo'), d.context.obj({ App: { Private: 'PIECEINFO' } }))
    const r = await cleanPdf(await d.save(), { mode: 'remove' })
    if (!r.ok) throw new Error(r.error)
    const text = await allObjectText(r.bytes)
    expect(text).not.toContain('PAGEXMP')
    expect(text).not.toContain('PIECEINFO')
    expect((await PDFDocument.load(r.bytes)).getPageCount()).toBe(1)
  })

  it('edit mode also leaves no old values behind', async () => {
    const r = await cleanPdf(await canaryPdf(), {
      mode: 'edit',
      fields: { title: 'New', author: '', subject: '', keywords: '', creator: '', producer: '' },
    })
    if (!r.ok) throw new Error(r.error)
    const text = await allObjectText(r.bytes)
    expect(text).not.toContain('CANARY')
    expect(text).toContain('New')
  })
})
