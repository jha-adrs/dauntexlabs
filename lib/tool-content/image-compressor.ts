import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This image compressor reduces image size by re-encoding a picture at the quality you choose. Use it to compress a JPEG before emailing it, shrink a photo for a web page or form upload, or compress a PNG to WebP for a much smaller file. It shows the original and new file size and the percentage saved, plus a preview of the result.',
    "Compression uses your browser's built-in canvas encoder, so the image is processed on your device. Because the picture is redrawn and re-encoded, metadata such as EXIF camera details and GPS location is dropped from the output. The pixel dimensions stay the same; to make an image smaller in pixels, use the image resizer.",
  ],
  steps: [
    'Drop an image onto the box, or click it to choose one. One image is handled at a time.',
    'Choose the Output format: JPG, WebP or PNG (lossless).',
    'For JPG or WebP, set the Quality slider; it starts at 70%.',
    'Press Compress and check the size saving and preview.',
    'Press Download to save the file, named after the original with -compressed added.',
  ],
  faq: [
    {
      q: 'Which quality setting should I use?',
      a: 'For photos, 60 to 80% usually gives a large saving with little visible change. Lower values shrink the file further but can add blockiness and smearing around edges. Try a setting, look at the preview and adjust.',
    },
    {
      q: 'Can I compress a PNG to WebP?',
      a: 'Yes. Load the PNG, choose WebP as the output format and set the quality. WebP keeps transparency and is usually much smaller than PNG. If you choose JPG instead, transparent areas are filled with white because JPG has no transparency.',
    },
    {
      q: 'Why did my file not get smaller?',
      a: 'PNG (lossless) has no quality slider, so a PNG saved as PNG may come out about the same size or even larger. Re-saving an already heavily compressed JPEG at a higher quality can also grow it. The saving shows as 0% when the output is not smaller.',
    },
    {
      q: 'Can I compress several images at once?',
      a: 'No. The tool works on one image per run. Download the result, then drop the next image.',
    },
    {
      q: 'Is the location data removed from my photo?',
      a: 'Yes. Canvas re-encoding does not carry over EXIF metadata, so GPS coordinates, camera model and capture time are not written into the compressed file.',
    },
  ],
}

export default content
