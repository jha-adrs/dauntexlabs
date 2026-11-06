'use client'

import dynamic from 'next/dynamic'

// Lazy-load the fitter only on /photo/ pages so it stays out of shared chunks.
const PhotoFitter = dynamic(() => import('./PhotoFitter'), {
  ssr: false,
  loading: () => <div className="tool-loading">initialising photo tool…</div>,
})

export default function PhotoFitterMount({ preset }: { preset: string }) {
  return <PhotoFitter preset={preset} />
}
