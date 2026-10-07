'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice } from '@/components/ui/kit'
import { densityAltitude } from '@/lib/aviation'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const fmt1 = (n: number) => n.toFixed(1)

export default function DensityAltitudeCalculator() {
  const [pa, setPa] = useState('')
  const [oat, setOat] = useState('')
  const [dew, setDew] = useState('')

  const r = useMemo(() => {
    if (pa.trim() === '' || oat.trim() === '') return null
    return densityAltitude({
      pressureAltFt: num(pa),
      oatC: num(oat),
      dewpointC: dew.trim() === '' ? undefined : num(dew),
    })
  }, [pa, oat, dew])

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <IO>
        <Panel title="Inputs">
          <Field label="Pressure altitude (ft)" hint="Set 29.92 inHg / 1013 hPa and read the altimeter">
            <TextInput type="number" value={pa} onChange={setPa} placeholder="e.g. 5000" />
          </Field>
          <Field label="Outside air temperature (°C)">
            <TextInput type="number" value={oat} onChange={setOat} placeholder="e.g. 30" />
          </Field>
          <Field label="Dewpoint (°C)" hint="Leave empty for dry air">
            <TextInput type="number" value={dew} onChange={setDew} placeholder="Optional, e.g. 20" />
          </Field>
        </Panel>
        <Panel title="Result">
          {!r && <Notice kind="info">Enter pressure altitude and temperature to see density altitude.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>Density altitude</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>
                {Math.round(r.densityAltFt).toLocaleString('en-US')} ft
              </dd>
              <dt style={{ color: 'var(--mute)' }}>ISA temperature</dt>
              <dd style={{ margin: 0 }}>{fmt1(r.isaTempC)} °C</dd>
              <dt style={{ color: 'var(--mute)' }}>Deviation from ISA</dt>
              <dd style={{ margin: 0 }}>
                {r.isaDevC >= 0 ? '+' : '−'}
                {fmt1(Math.abs(r.isaDevC))} °C
              </dd>
            </dl>
          )}
        </Panel>
      </IO>
    </>
  )
}
