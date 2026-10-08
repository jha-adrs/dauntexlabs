// SVG string → PNG/JPEG Blob in the browser (Image + Canvas). Browser-only; covered by e2e.

/** Rasterise `svg` at `px` wide (clamped 256–4096). JPEG has no alpha, so transparent areas become white. */
export async function svgToBlob(svg: string, px: number, mime: 'image/png' | 'image/jpeg'): Promise<Blob> {
  const width = Math.max(256, Math.min(4096, Math.round(px) || 1024))
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  const ratio = vb ? Number(vb[2]) / Number(vb[1]) : 1
  const height = Math.round(width * ratio)
  // explicit pixel size so every browser rasterises the SVG at full resolution
  const sized = svg.replace('<svg ', `<svg width="${width}" height="${height}" `)

  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Could not render the QR code image.'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image.'))), mime, 0.92),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
