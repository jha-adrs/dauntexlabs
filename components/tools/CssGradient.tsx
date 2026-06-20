'use client'

import { useMemo, useState } from 'react'
import { Segmented, Field, TextInput, Toolbar, Panel, CopyButton } from '@/components/ui/kit'

export default function CssGradient() {
  const [type, setType] = useState('linear')
  const [angle, setAngle] = useState(90)
  const [color1, setColor1] = useState('#c6f24e')
  const [pos1, setPos1] = useState('0%')
  const [color2, setColor2] = useState('#1a1a2e')
  const [pos2, setPos2] = useState('100%')

  const gradient = useMemo(() => {
    const stop1 = `${color1} ${pos1}`.trim()
    const stop2 = `${color2} ${pos2}`.trim()
    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${stop1}, ${stop2})`
    }
    return `radial-gradient(circle, ${stop1}, ${stop2})`
  }, [type, angle, color1, pos1, color2, pos2])

  const css = `background: ${gradient};`

  return (
    <>
      <Toolbar>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'linear', label: 'Linear' },
            { value: 'radial', label: 'Radial' },
          ]}
        />
      </Toolbar>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600 }}>
        {type === 'linear' && (
          <Field label={`Angle: ${angle}°`}>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              aria-label="Gradient angle"
              style={{
                width: '100%',
                accentColor: 'var(--acid)',
                cursor: 'pointer',
              }}
            />
          </Field>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Stop 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 200 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Stop 1
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                aria-label="Stop 1 color"
                style={{
                  width: 40, height: 40, borderRadius: 6,
                  border: '1px solid var(--line)', background: 'transparent',
                  cursor: 'pointer', accentColor: 'var(--acid)', padding: 2,
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--bone)' }}>
                {color1}
              </span>
            </div>
            <Field label="Position">
              <TextInput value={pos1} onChange={setPos1} placeholder="0%" />
            </Field>
          </div>

          {/* Stop 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 200 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Stop 2
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                aria-label="Stop 2 color"
                style={{
                  width: 40, height: 40, borderRadius: 6,
                  border: '1px solid var(--line)', background: 'transparent',
                  cursor: 'pointer', accentColor: 'var(--acid)', padding: 2,
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--bone)' }}>
                {color2}
              </span>
            </div>
            <Field label="Position">
              <TextInput value={pos2} onChange={setPos2} placeholder="100%" />
            </Field>
          </div>
        </div>

        {/* Live preview */}
        <div
          style={{
            width: '100%',
            height: 120,
            borderRadius: 8,
            background: gradient,
            border: '1px solid var(--line)',
          }}
          aria-label="Gradient preview"
        />

        {/* CSS output */}
        <Panel
          title="CSS output"
          actions={<CopyButton text={css} />}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              color: 'var(--bone)',
              padding: '0.75rem',
              background: 'var(--ink-850)',
              borderRadius: 6,
              wordBreak: 'break-all',
              lineHeight: 1.6,
            }}
          >
            {css}
          </div>
        </Panel>
      </div>
    </>
  )
}
