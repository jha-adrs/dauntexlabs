'use client'

// Exam / form photo fitter: one FitSection per upload in a preset. Size pages
// add free pixel and KB inputs that override the preset upload.

import { useMemo, useState } from 'react'
import { Field, TextInput, Notice } from '@/components/ui/kit'
import { getPreset, uploadFileName, uploadLabel, type Upload } from '@/lib/photo-presets'
import FitSection from './FitSection'

const DEFAULT_PRESET = 'resize-image-to-50kb'

/** Parse the size-page inputs; null when invalid. Width and height are both set or both blank. */
function parseOverrides(w: string, h: string, min: string, max: string): Pick<Upload, 'px' | 'kb'> | null {
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
  const mn = num(min)
  const mx = num(max)
  if (!Number.isFinite(mn) || !Number.isFinite(mx) || mn < 0 || mn >= mx) return null
  const bw = w.trim() === ''
  const bh = h.trim() === ''
  if (bw && bh) return { kb: [mn, mx] }
  if (bw !== bh) return null
  const pw = num(w)
  const ph = num(h)
  const ok = (n: number) => Number.isInteger(n) && n >= 20 && n <= 4000
  if (!ok(pw) || !ok(ph)) return null
  return { kb: [mn, mx], px: [pw, ph] }
}

export default function PhotoFitter({ preset = DEFAULT_PRESET }: { preset?: string }) {
  const p = getPreset(preset) ?? getPreset(DEFAULT_PRESET)!
  const isSize = p.kind === 'size'
  const base = p.uploads[0]
  const [w, setW] = useState('')
  const [h, setH] = useState('')
  const [min, setMin] = useState(String(base.kb[0]))
  const [max, setMax] = useState(String(base.kb[1]))

  const overrides = useMemo(() => (isSize ? parseOverrides(w, h, min, max) : null), [isSize, w, h, min, max])
  const invalid = isSize && !overrides

  const uploads = useMemo<Upload[]>(
    () =>
      isSize && overrides
        ? p.uploads.map((u) => ({ ...u, kb: overrides.kb, px: overrides.px ?? u.px }))
        : p.uploads,
    [isSize, overrides, p],
  )

  return (
    <>
      {isSize && (
        <>
          <div className="toolbar">
            <Field label="Width (px)">
              <TextInput type="number" value={w} onChange={setW} placeholder="keep" />
            </Field>
            <Field label="Height (px)">
              <TextInput type="number" value={h} onChange={setH} placeholder="keep" />
            </Field>
            <Field label="Min KB">
              <TextInput type="number" value={min} onChange={setMin} />
            </Field>
            <Field label="Max KB">
              <TextInput type="number" value={max} onChange={setMax} />
            </Field>
          </div>
          {invalid && (
            <Notice kind="error">Check the sizes: minimum KB must be below maximum KB, and pixels 20–4000.</Notice>
          )}
        </>
      )}
      {uploads.map((u, i) => (
        <FitSection
          key={`${p.slug}-${i}`}
          upload={u}
          fileName={uploadFileName(p, i)}
          label={uploadLabel(u)}
          disabled={invalid}
        />
      ))}
    </>
  )
}
