'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice } from '@/components/ui/kit'
import { crosswind } from '@/lib/aviation'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))

export default function CrosswindComponent() {
  const [runway, setRunway] = useState('')
  const [windDir, setWindDir] = useState('')
  const [windSpd, setWindSpd] = useState('')

  const r = useMemo(() => {
    if ([runway, windDir, windSpd].some((s) => s.trim() === '')) return null
    return crosswind({ runwayDeg: num(runway), windFromDeg: num(windDir), windKt: num(windSpd) })
  }, [runway, windDir, windSpd])

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <IO>
        <Panel title="Inputs">
          <Field label="Runway heading (°)" hint="Runway 27 ≈ 270°. Use the same reference (magnetic or true) as the wind.">
            <TextInput type="number" value={runway} onChange={setRunway} placeholder="e.g. 270" />
          </Field>
          <Field label="Wind direction, from (°)">
            <TextInput type="number" value={windDir} onChange={setWindDir} placeholder="e.g. 300" />
          </Field>
          <Field label="Wind speed (kt)" hint="Use the gust value to check the worst case">
            <TextInput type="number" value={windSpd} onChange={setWindSpd} placeholder="e.g. 20" />
          </Field>
        </Panel>
        <Panel title="Result">
          {!r && <Notice kind="info">Enter runway heading and wind to see the components.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>{r.headwindKt < 0 ? 'Tailwind' : 'Headwind'}</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: r.headwindKt < 0 ? 'var(--warn)' : 'var(--fg)' }}>
                {Math.abs(r.headwindKt).toFixed(1)} kt
              </dd>
              <dt style={{ color: 'var(--mute)' }}>Crosswind</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>
                {r.crosswindKt.toFixed(1)} kt{r.side === 'none' ? '' : ' from the ' + r.side}
              </dd>
            </dl>
          )}
        </Panel>
      </IO>
    </>
  )
}
