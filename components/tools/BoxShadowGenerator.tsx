'use client'

import { useMemo, useState } from 'react'
import { Field, Toggle, Panel, TextArea, CopyButton } from '@/components/ui/kit'

function Slider({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <Field label={`${label}: ${value}px`}>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: 'var(--acid)', width: '100%' }}
      />
    </Field>
  )
}

export default function BoxShadowGenerator() {
  const [offsetX, setOffsetX] = useState(6)
  const [offsetY, setOffsetY] = useState(6)
  const [blur, setBlur] = useState(18)
  const [spread, setSpread] = useState(0)
  const [color, setColor] = useState('#c6f24e')
  const [inset, setInset] = useState(false)

  const css = useMemo(() => {
    const parts = [
      inset ? 'inset' : '',
      `${offsetX}px`,
      `${offsetY}px`,
      `${blur}px`,
      `${spread}px`,
      color,
    ]
      .filter(Boolean)
      .join(' ')
    return `box-shadow: ${parts};`
  }, [offsetX, offsetY, blur, spread, color, inset])

  // raw value for the live preview's inline style (CSS prop, no "box-shadow:" prefix)
  const previewShadow = useMemo(
    () =>
      [inset ? 'inset' : '', `${offsetX}px`, `${offsetY}px`, `${blur}px`, `${spread}px`, color]
        .filter(Boolean)
        .join(' '),
    [offsetX, offsetY, blur, spread, color, inset],
  )

  return (
    <>
      <div className="tool-io">
        <Panel title="controls">
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <Slider label="offset-x" value={offsetX} onChange={setOffsetX} min={-100} max={100} />
            <Slider label="offset-y" value={offsetY} onChange={setOffsetY} min={-100} max={100} />
            <Slider label="blur" value={blur} onChange={setBlur} min={0} max={200} />
            <Slider label="spread" value={spread} onChange={setSpread} min={-100} max={100} />
            <Field label="color">
              <input
                type="color"
                aria-label="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  accentColor: 'var(--acid)',
                  width: '100%',
                  height: 36,
                  background: 'var(--ink-850)',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
            </Field>
            <Toggle checked={inset} onChange={setInset} label="inset" />
          </div>
        </Panel>

        <Panel title="preview">
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 240,
              padding: '2.5rem',
              background: 'var(--ink-850)',
              border: '1px solid var(--line)',
              borderRadius: 6,
            }}
          >
            <div
              aria-label="shadow preview"
              style={{
                width: 140,
                height: 140,
                borderRadius: 8,
                background: 'var(--ink-800)',
                border: '1px solid var(--line)',
                boxShadow: previewShadow,
              }}
            />
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Panel title="CSS" actions={<CopyButton text={css} />}>
          <TextArea value={css} readOnly rows={2} placeholder="box-shadow CSS…" />
        </Panel>
      </div>
    </>
  )
}
