// Read / clear / edit PDF document metadata (Info dictionary + catalog XMP stream).
// pdf-lib is imported lazily inside each function so it only downloads when used.

export type TextField = 'title' | 'author' | 'subject' | 'keywords' | 'creator' | 'producer'
export const TEXT_FIELDS: TextField[] = ['title', 'author', 'subject', 'keywords', 'creator', 'producer']

export type PdfMeta = Record<TextField, string> & { creationDate: string; modDate: string }

export type ReadResult = { ok: true; meta: PdfMeta; hasXmp: boolean } | { ok: false; error: string }
export type CleanResult = { ok: true; bytes: Uint8Array } | { ok: false; error: string }
export type CleanOp = { mode: 'remove' } | { mode: 'edit'; fields: Record<TextField, string> }

const INFO_KEY: Record<TextField, string> = {
  title: 'Title', author: 'Author', subject: 'Subject',
  keywords: 'Keywords', creator: 'Creator', producer: 'Producer',
}

function loadError(e: unknown): string {
  const msg = e instanceof Error ? e.message : ''
  return /encrypt/i.test(msg)
    ? 'This PDF is encrypted or password-protected, so its metadata cannot be changed here. Remove the protection first, then try again.'
    : 'Could not read this file. It may not be a PDF, or it may be damaged.'
}

async function load(bytes: Uint8Array | ArrayBuffer) {
  const { PDFDocument } = await import('pdf-lib')
  // updateMetadata:false — otherwise pdf-lib stamps its own Producer/Creator/dates on load.
  return PDFDocument.load(bytes, { updateMetadata: false })
}

export async function readPdfMetadata(bytes: Uint8Array | ArrayBuffer): Promise<ReadResult> {
  try {
    const doc = await load(bytes)
    const { PDFName } = await import('pdf-lib')
    return {
      ok: true,
      meta: {
        title: doc.getTitle() ?? '',
        author: doc.getAuthor() ?? '',
        subject: doc.getSubject() ?? '',
        keywords: doc.getKeywords() ?? '',
        creator: doc.getCreator() ?? '',
        producer: doc.getProducer() ?? '',
        creationDate: doc.getCreationDate()?.toISOString() ?? '',
        modDate: doc.getModificationDate()?.toISOString() ?? '',
      },
      hasXmp: doc.catalog.get(PDFName.of('Metadata')) !== undefined,
    }
  } catch (e) {
    return { ok: false, error: loadError(e) }
  }
}

export async function cleanPdf(bytes: Uint8Array | ArrayBuffer, op: CleanOp): Promise<CleanResult> {
  let doc
  try {
    doc = await load(bytes)
  } catch (e) {
    return { ok: false, error: loadError(e) }
  }
  try {
    const { PDFName, PDFRef, PDFDict } = await import('pdf-lib')
    const ctx = doc.context

    // XMP is dropped in both modes: it duplicates the Info fields and would otherwise
    // keep the old author/title after an edit.
    const xmp = doc.catalog.get(PDFName.of('Metadata'))
    if (xmp instanceof PDFRef) ctx.delete(xmp)
    doc.catalog.delete(PDFName.of('Metadata'))

    if (op.mode === 'remove') {
      const info = ctx.trailerInfo.Info
      if (info instanceof PDFRef) ctx.delete(info)
      ctx.trailerInfo.Info = undefined
    } else {
      const f = op.fields
      if (f.title) doc.setTitle(f.title)
      if (f.author) doc.setAuthor(f.author)
      if (f.subject) doc.setSubject(f.subject)
      if (f.keywords) doc.setKeywords([f.keywords])
      if (f.creator) doc.setCreator(f.creator)
      if (f.producer) doc.setProducer(f.producer)
      const info = ctx.trailerInfo.Info ? ctx.lookup(ctx.trailerInfo.Info) : undefined
      if (info instanceof PDFDict) {
        for (const k of Object.keys(INFO_KEY) as TextField[]) {
          if (!f[k]) info.delete(PDFName.of(INFO_KEY[k]))
        }
      }
    }
    return { ok: true, bytes: await doc.save() }
  } catch {
    return { ok: false, error: 'Could not save the cleaned PDF. The file may be damaged.' }
  }
}
