// One entry point for the Metadata Remover: recognise the format from the bytes,
// describe what metadata is inside, and produce a lossless cleaned copy.

import { jpegMetadataSummary, stripJpegMetadata, type ExifSummary } from '@/lib/jpeg-meta'
import { pngMetadata, stripPngMetadata } from './png'
import { webpMetadata, stripWebpMetadata } from './webp'
import { isMp4, mp4Metadata, stripMp4Metadata } from './mp4'

export type MetaItem = { label: string; value?: string }
export type Inspection = { format: string; mime: string; items: MetaItem[]; clean: () => Uint8Array }

const KEPT_ORIENTATION: MetaItem = { label: 'Orientation', value: 'kept, so the photo stays upright' }

function exifItems(e: ExifSummary): MetaItem[] {
  const items: MetaItem[] = []
  if (e.gps) items.push({ label: 'GPS location', value: 'present' })
  if (e.make) items.push({ label: 'Camera make', value: e.make })
  if (e.model) items.push({ label: 'Camera model', value: e.model })
  if (e.dateTimeOriginal) items.push({ label: 'Date taken', value: e.dateTimeOriginal })
  if (e.dateTime) items.push({ label: 'Date modified', value: e.dateTime })
  if (e.software) items.push({ label: 'Software', value: e.software })
  if (!items.length) items.push({ label: 'EXIF data' })
  return items
}

const isJpeg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
const isPng = (b: Uint8Array) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
const isWebp = (b: Uint8Array) =>
  b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP'

/** Null when the format is not supported. Throws when a supported file is damaged. */
export function inspectMedia(b: Uint8Array): Inspection | null {
  if (isJpeg(b)) {
    const s = jpegMetadataSummary(b)
    const items: MetaItem[] = []
    if (s.exif) {
      const e = exifItems(s.exif).filter((i) => i.label !== 'EXIF data' || s.exif!.orientation === 1)
      items.push(...e)
      if (s.exif.orientation !== 1) items.push(KEPT_ORIENTATION)
    }
    if (s.xmp) items.push({ label: 'XMP metadata' })
    if (s.iptc) items.push({ label: 'IPTC / Photoshop data' })
    if (s.comment) items.push({ label: 'Comment' })
    if (s.other) items.push({ label: 'Other app or camera data' })
    return { format: 'JPEG', mime: 'image/jpeg', items, clean: () => stripJpegMetadata(b, { keepOrientation: true }) }
  }
  if (isPng(b)) {
    const s = pngMetadata(b)
    const items: MetaItem[] = s.text.map((k) => ({ label: 'Text', value: k }))
    if (s.exif) items.push(...exifItems(s.exif))
    if (s.xmp) items.push({ label: 'XMP metadata' })
    if (s.time) items.push({ label: 'Last-modified time' })
    return { format: 'PNG', mime: 'image/png', items, clean: () => stripPngMetadata(b) }
  }
  if (isWebp(b)) {
    const s = webpMetadata(b)
    const items: MetaItem[] = s.exif ? exifItems(s.exif) : []
    if (s.xmp) items.push({ label: 'XMP metadata' })
    return { format: 'WebP', mime: 'image/webp', items, clean: () => stripWebpMetadata(b) }
  }
  if (isMp4(b)) {
    const s = mp4Metadata(b)
    const items: MetaItem[] = []
    if (s.location) items.push({ label: 'GPS location', value: s.location })
    if (s.make) items.push({ label: 'Device make', value: s.make })
    if (s.model) items.push({ label: 'Device model', value: s.model })
    if (s.software) items.push({ label: 'Software', value: s.software })
    if (s.date) items.push({ label: 'Creation date', value: s.date })
    if (s.userData && !items.length) items.push({ label: 'User data (udta / meta)' })
    if (s.xmp) items.push({ label: 'XMP metadata' })
    return { format: 'MP4 / MOV', mime: 'video/mp4', items, clean: () => stripMp4Metadata(b) }
  }
  return null
}
