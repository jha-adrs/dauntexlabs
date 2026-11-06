import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This image resizer changes image dimensions to an exact width and height in pixels. Use it to resize an image for a profile picture, a form that demands specific pixel sizes, a blog header or a thumbnail. Enter the size you need, or use a quick scale button, and download the resized copy.',
    "Resizing is done with your browser's canvas using high-quality smoothing, so the image is processed on your device. Because the picture is redrawn and re-encoded, metadata such as EXIF camera details and GPS location is dropped from the output.",
  ],
  steps: [
    'Drop an image onto the box, or click it to choose one. One image is resized per run, and its original size is shown.',
    'Type the new Width (px) or Height (px). With Lock aspect ratio on, the other side is filled in for you.',
    'Or press a Quick scale button: 25%, 50%, 75% or 200%; reset returns to the original size.',
    'Press Resize and check the new dimensions, file size and format.',
    'Press Download to save it; the filename gets the new size added, for example photo-800x600.jpg.',
  ],
  faq: [
    {
      q: 'How do I resize an image to exact pixels?',
      a: 'Load the image and type the width and height you need. If both sides are fixed and the shape differs from the original, switch off Lock aspect ratio first; the picture is then stretched to fit rather than cropped.',
    },
    {
      q: 'What format is the resized image saved in?',
      a: 'JPEG, PNG and WebP images keep their format. Other formats your browser can open, such as GIF or BMP, are saved as PNG. JPEG and WebP are encoded at a fixed 92% quality; there is no quality control, so use the image compressor if you also need a smaller file.',
    },
    {
      q: 'Can I make an image larger?',
      a: 'Yes, for example with the 200% button or by typing bigger numbers. Enlarging cannot add detail, so the result will look softer. Very large targets may fail if the browser cannot allocate a canvas that big.',
    },
    {
      q: 'Can I resize several images at once?',
      a: 'No. The tool handles one image per run. Download the result, then drop the next image.',
    },
    {
      q: 'What happens to transparency?',
      a: 'PNG and WebP keep transparent areas. JPEG has no transparency, so a JPEG source stays opaque.',
    },
  ],
}

export default content
