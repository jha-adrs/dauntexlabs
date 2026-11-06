'use client'

// Registry entry point for the /photo/ presets: pick an exam or size, then the
// same PhotoFitter that powers /photo/<slug>/ runs below.

import { useState } from 'react'
import Link from 'next/link'
import { Field, Select } from '@/components/ui/kit'
import PhotoFitter from '@/components/photo/PhotoFitter'
import { PHOTO_PRESETS } from '@/lib/photo-presets'

const OPTIONS = [...PHOTO_PRESETS.filter((p) => p.kind === 'exam'), ...PHOTO_PRESETS.filter((p) => p.kind === 'size')].map(
  (p) => ({ value: p.slug, label: p.title }),
)

export default function ExamPhotoResizer() {
  const [slug, setSlug] = useState('ibps-photo-signature-size')
  return (
    <>
      <div className="toolbar">
        <Field label="Exam or form">
          <Select value={slug} onChange={setSlug} options={OPTIONS} />
        </Field>
      </div>
      <p style={{ color: 'var(--mute)', margin: '8px 0 0' }}>
        <Link href={`/photo/${slug}/`}>Open the full page for this size</Link>
        {' · '}
        <Link href="/photo/">All exam photo sizes</Link>
      </p>
      {/* key remounts the fitter, which revokes the previous preset's object URLs */}
      <PhotoFitter key={slug} preset={slug} />
    </>
  )
}
