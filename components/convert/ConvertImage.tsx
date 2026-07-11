'use client'

import dynamic from 'next/dynamic'

// Lazy-load the full ImageConverter only on image /convert pages, preset to the
// target format. Keeps it out of the unit/base page chunks.
const ImageConverter = dynamic(() => import('@/components/tools/ImageConverter'), {
  ssr: false,
  loading: () => <div className="tool-loading">initialising converter…</div>,
})

export default function ConvertImage({ mime }: { mime: string }) {
  return <ImageConverter presetFormat={mime} />
}
