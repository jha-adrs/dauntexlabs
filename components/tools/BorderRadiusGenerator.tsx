'use client'

import { useMemo, useState } from 'react'
import { Field, Toggle, Panel, TextArea, CopyButton } from '@/components/ui/kit'

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <Field label={`${label}: ${value}px`}>
      <input
        type="range"
        aria-label={label}
        min={0}
        max={200}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: 'var(--acid)', width: '100%' }}
      />
    </Field>
  )
}

export default function BorderRadiusGenerator() {
  const [tl, setTl] = useState(10)
  const [tr, setTr] = useState(10)
  const [br, setBr] = useState(10)
  const [bl, setBl] = useState(10)
  const [linked, setLinked] = useState(true)

  // When linked, every corner tracks the same value.
  function setAll(v: number) {
    setTl(v)
    setTr(v)
    setBr(v)
    setBl(v)
  }

  const setCorner =
    (setter: (v: number) => void) =>
    (v: number) => {
      if (linked) setAll(v)
      else setter(v)
    }

  const css = useMemo(() => {
    // border-radius shorthand order: top-left top-right bottom-right bottom-left
    if (linked || (tl === tr && tr === br && br === bl)) {
      return `border-radius: ${tl}px;`
    }
    return `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`
  }, [tl, tr, br, bl, linked])

  const previewRadius = useMemo(() => {
    if (linked || (tl === tr && tr === br && br === bl)) return `${tl}px`
    return `${tl}px ${tr}px ${br}px ${bl}px`
  }, [tl, tr, br, bl, linked])

  return (
    <>
      <div className="tool-io">
        <Panel title="controls">
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <Toggle checked={linked} onChange={setLinked} label="link all corners" />
            <Slider label="top-left" value={tl} onChange={setCorner(setTl)} />
            <Slider label="top-right" value={tr} onChange={setCorner(setTr)} />
            <Slider label="bottom-right" value={br} onChange={setCorner(setBr)} />
            <Slider label="bottom-left" value={bl} onChange={setCorner(setBl)} />
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
              aria-label="radius preview"
              style={{
                width: 160,
                height: 160,
                background: 'var(--ink-800)',
                border: '2px solid var(--acid)',
                borderRadius: previewRadius,
              }}
            />
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Panel title="CSS" actions={<CopyButton text={css} />}>
          <TextArea value={css} readOnly rows={2} placeholder="border-radius CSS…" />
        </Panel>
      </div>
    </>
  )
}
