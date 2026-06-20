'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Panel, Notice } from '@/components/ui/kit'

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

function toSRGB(c: number): number {
  const n = c / 255
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * toSRGB(r) + 0.7152 * toSRGB(g) + 0.0722 * toSRGB(b)
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function toFullHex(hex: string): string {
  const h = hex.replace(/^#/, '').trim()
  if (h.length === 3) return '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return '#' + h
}

function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.6rem',
        borderRadius: 4,
        background: pass ? 'rgba(198,242,78,0.12)' : 'rgba(220,60,60,0.12)',
        border: `1px solid ${pass ? 'var(--acid)' : '#e05555'}`,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
      }}
    >
      <span style={{ color: pass ? 'var(--acid)' : '#e07070' }}>
        {pass ? '✓' : '✗'}
      </span>
      <span style={{ color: 'var(--bone)' }}>{label}</span>
      <span
        style={{
          color: pass ? 'var(--acid)' : '#e07070',
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.05em',
        }}
      >
        {pass ? 'PASS' : 'FAIL'}
      </span>
    </div>
  )
}

export default function ContrastChecker() {
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [fgPicker, setFgPicker] = useState('#000000')
  const [bgPicker, setBgPicker] = useState('#ffffff')

  function handleFgText(v: string) {
    setFg(v)
    if (parseHex(v)) setFgPicker(toFullHex(v))
  }
  function handleBgText(v: string) {
    setBg(v)
    if (parseHex(v)) setBgPicker(toFullHex(v))
  }
  function handleFgPicker(v: string) {
    setFgPicker(v); setFg(v)
  }
  function handleBgPicker(v: string) {
    setBgPicker(v); setBg(v)
  }

  const result = useMemo(() => {
    const fgParsed = parseHex(fg)
    const bgParsed = parseHex(bg)
    if (!fgParsed || !bgParsed) return null
    const lFg = relativeLuminance(fgParsed.r, fgParsed.g, fgParsed.b)
    const lBg = relativeLuminance(bgParsed.r, bgParsed.g, bgParsed.b)
    const ratio = contrastRatio(lFg, lBg)
    return {
      ratio,
      ratioStr: ratio.toFixed(2) + ':1',
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    }
  }, [fg, bg])

  const fgInvalid = fg.trim().length > 0 && !parseHex(fg)
  const bgInvalid = bg.trim().length > 0 && !parseHex(bg)

  const fgFull = parseHex(fg) ? toFullHex(fg) : '#000000'
  const bgFull = parseHex(bg) ? toFullHex(bg) : '#ffffff'

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Foreground */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <Field label="Foreground color">
              <TextInput value={fg} onChange={handleFgText} placeholder="#000000" />
            </Field>
            <input
              type="color"
              value={fgPicker}
              onChange={(e) => handleFgPicker(e.target.value)}
              aria-label="Foreground color picker"
              style={{
                width: 44, height: 44, borderRadius: 6,
                border: '1px solid var(--line)', background: 'transparent',
                cursor: 'pointer', accentColor: 'var(--acid)', padding: 2, marginBottom: '0.15rem',
              }}
            />
          </div>

          {/* Background */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <Field label="Background color">
              <TextInput value={bg} onChange={handleBgText} placeholder="#ffffff" />
            </Field>
            <input
              type="color"
              value={bgPicker}
              onChange={(e) => handleBgPicker(e.target.value)}
              aria-label="Background color picker"
              style={{
                width: 44, height: 44, borderRadius: 6,
                border: '1px solid var(--line)', background: 'transparent',
                cursor: 'pointer', accentColor: 'var(--acid)', padding: 2, marginBottom: '0.15rem',
              }}
            />
          </div>
        </div>

        {(fgInvalid || bgInvalid) && (
          <Notice kind="error">
            {fgInvalid && bgInvalid
              ? 'Both colors are invalid. Use #rgb or #rrggbb format.'
              : fgInvalid
              ? 'Foreground color is invalid. Use #rgb or #rrggbb format.'
              : 'Background color is invalid. Use #rgb or #rrggbb format.'}
          </Notice>
        )}

        {/* Preview */}
        <div
          style={{
            background: bgFull,
            borderRadius: 8,
            border: '1px solid var(--line)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <span style={{ color: fgFull, fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>
            Normal text preview (16px)
          </span>
          <span style={{ color: fgFull, fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            Large text preview (18px bold / 24px)
          </span>
        </div>

        {result && (
          <Panel title="WCAG contrast results">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.2rem',
                  color: 'var(--acid)',
                  letterSpacing: '-0.02em',
                }}
                aria-label={`Contrast ratio: ${result.ratioStr}`}
              >
                {result.ratioStr}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Badge pass={result.aaNormal} label="AA Normal" />
                <Badge pass={result.aaLarge} label="AA Large" />
                <Badge pass={result.aaaNormal} label="AAA Normal" />
                <Badge pass={result.aaaLarge} label="AAA Large" />
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--mute)', lineHeight: 1.6 }}>
                AA Normal ≥ 4.5:1 · AA Large ≥ 3:1 · AAA Normal ≥ 7:1 · AAA Large ≥ 4.5:1
              </div>
            </div>
          </Panel>
        )}
      </div>
    </>
  )
}
