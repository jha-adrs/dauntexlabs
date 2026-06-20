'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, CopyButton, Panel, Notice } from '@/components/ui/kit'

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, '').trim()
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16)
    const g = parseInt(h[1] + h[1], 16)
    const b = parseInt(h[2] + h[2], 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  return null
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
    case gn: h = ((bn - rn) / d + 2) / 6; break
    case bn: h = ((rn - gn) / d + 4) / 6; break
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function toFullHex(hex: string): string {
  const h = hex.replace(/^#/, '').trim()
  if (h.length === 3) return '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return '#' + h
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#ff0000')
  const [pickerVal, setPickerVal] = useState('#ff0000')

  function handleTextChange(v: string) {
    setHex(v)
    const parsed = parseHex(v)
    if (parsed) {
      const full = toFullHex(v)
      setPickerVal(full)
    }
  }

  function handlePickerChange(v: string) {
    setPickerVal(v)
    setHex(v)
  }

  const result = useMemo(() => {
    if (!hex.trim()) return null
    try {
      const parsed = parseHex(hex)
      if (!parsed) return null
      const { r, g, b } = parsed
      const { h, s, l } = rgbToHsl(r, g, b)
      const fullHex = toFullHex(hex).toLowerCase()
      return {
        hex: fullHex,
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${h}, ${s}%, ${l}%)`,
      }
    } catch {
      return null
    }
  }, [hex])

  const isInvalid = hex.trim().length > 0 && result === null

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 520 }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <Field label="HEX color">
            <TextInput
              value={hex}
              onChange={handleTextChange}
              placeholder="#rrggbb or #rgb"
            />
          </Field>
          <div style={{ paddingBottom: '0.15rem' }}>
            <input
              type="color"
              value={pickerVal}
              onChange={(e) => handlePickerChange(e.target.value)}
              aria-label="Color picker"
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                border: '1px solid var(--line)',
                background: 'transparent',
                cursor: 'pointer',
                accentColor: 'var(--acid)',
                padding: 2,
              }}
            />
          </div>
        </div>

        {isInvalid && (
          <Notice kind="error">
            Invalid hex color. Use #rgb or #rrggbb format (e.g. #f00 or #ff0000).
          </Notice>
        )}

        {result && (
          <>
            <div
              style={{
                width: '100%',
                height: 80,
                borderRadius: 8,
                background: result.hex,
                border: '1px solid var(--line)',
              }}
              aria-label={`Color swatch: ${result.hex}`}
            />

            <Panel title="converted values">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'HEX', value: result.hex },
                  { label: 'RGB', value: result.rgb },
                  { label: 'HSL', value: result.hsl },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--ink-850)',
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--mute)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        minWidth: 36,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.95rem',
                        color: 'var(--bone)',
                        flex: 1,
                      }}
                    >
                      {value}
                    </span>
                    <CopyButton text={value} />
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
    </>
  )
}
