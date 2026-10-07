'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice } from '@/components/ui/kit'
import { windCorrection } from '@/lib/aviation'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const hdg = (d: number) => String(Math.round(d) % 360).padStart(3, '0') + '°'

export default function WindCorrectionAngle() {
  const [tas, setTas] = useState('')
  const [course, setCourse] = useState('')
  const [windDir, setWindDir] = useState('')
  const [windSpd, setWindSpd] = useState('')

  const r = useMemo(() => {
    if ([tas, course, windDir, windSpd].some((s) => s.trim() === '')) return null
    return windCorrection({ tasKt: num(tas), courseDeg: num(course), windFromDeg: num(windDir), windKt: num(windSpd) })
  }, [tas, course, windDir, windSpd])

  const wca = r && r.ok ? Math.abs(r.wcaDeg).toFixed(1) : ''

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <IO>
        <Panel title="Inputs">
          <Field label="True airspeed (kt)">
            <TextInput type="number" value={tas} onChange={setTas} placeholder="e.g. 120" />
          </Field>
          <Field label="True course (°)">
            <TextInput type="number" value={course} onChange={setCourse} placeholder="e.g. 090" />
          </Field>
          <Field label="Wind direction, from (° true)">
            <TextInput type="number" value={windDir} onChange={setWindDir} placeholder="e.g. 360" />
          </Field>
          <Field label="Wind speed (kt)">
            <TextInput type="number" value={windSpd} onChange={setWindSpd} placeholder="e.g. 20" />
          </Field>
        </Panel>
        <Panel title="Result">
          {!r && <Notice kind="info">Enter airspeed, course and wind to see your heading and ground speed.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>Wind correction angle</dt>
              <dd style={{ margin: 0 }}>
                {r.wcaDeg === 0 ? '0.0°' : r.wcaDeg < 0 ? wca + '° left' : wca + '° right'}
              </dd>
              <dt style={{ color: 'var(--mute)' }}>True heading</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{hdg(r.headingDeg)}</dd>
              <dt style={{ color: 'var(--mute)' }}>Ground speed</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{Math.round(r.groundSpeedKt)} kt</dd>
            </dl>
          )}
        </Panel>
      </IO>
    </>
  )
}
