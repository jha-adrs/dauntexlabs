'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice } from '@/components/ui/kit'
import { trueAirspeed } from '@/lib/aviation'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))

export default function TrueAirspeedCalculator() {
  const [cas, setCas] = useState('')
  const [pa, setPa] = useState('')
  const [oat, setOat] = useState('')

  const r = useMemo(() => {
    if ([cas, pa, oat].some((s) => s.trim() === '')) return null
    return trueAirspeed({ casKt: num(cas), pressureAltFt: num(pa), oatC: num(oat) })
  }, [cas, pa, oat])

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <IO>
        <Panel title="Inputs">
          <Field label="Calibrated airspeed (kt)">
            <TextInput type="number" value={cas} onChange={setCas} placeholder="e.g. 150" />
          </Field>
          <Field label="Pressure altitude (ft)">
            <TextInput type="number" value={pa} onChange={setPa} placeholder="e.g. 8000" />
          </Field>
          <Field label="Outside air temperature (°C)">
            <TextInput type="number" value={oat} onChange={setOat} placeholder="e.g. 0" />
          </Field>
        </Panel>
        <Panel title="Result">
          {!r && <Notice kind="info">Enter airspeed, pressure altitude and temperature to see true airspeed.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>True airspeed</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{Math.round(r.tasKt)} kt</dd>
              <dt style={{ color: 'var(--mute)' }}>Mach number</dt>
              <dd style={{ margin: 0 }}>{r.mach.toFixed(3)}</dd>
            </dl>
          )}
        </Panel>
      </IO>
    </>
  )
}
