'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice, Segmented } from '@/components/ui/kit'
import { pressureAltitude } from '@/lib/aviation'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const ft = (n: number) => `${Math.round(n).toLocaleString('en-US')} ft`

export default function PressureAltitudeCalculator() {
  const [unit, setUnit] = useState<'inHg' | 'hPa'>('inHg')
  const [elev, setElev] = useState('')
  const [alt, setAlt] = useState('')

  const r = useMemo(() => {
    if (elev.trim() === '' || alt.trim() === '') return null
    return pressureAltitude({ elevationFt: num(elev), altimeter: num(alt), unit })
  }, [elev, alt, unit])

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <IO>
        <Panel title="Inputs">
          <Field label="Field elevation (ft)">
            <TextInput type="number" value={elev} onChange={setElev} placeholder="e.g. 1000" />
          </Field>
          <div className="field" role="group" aria-label="Altimeter unit">
            <span className="field-label">Altimeter unit</span>
            <Segmented
              value={unit}
              onChange={(v) => setUnit(v as 'inHg' | 'hPa')}
              options={[
                { value: 'inHg', label: 'inHg' },
                { value: 'hPa', label: 'hPa' },
              ]}
            />
          </div>
          <Field label={`Altimeter setting (${unit})`} hint="QNH from the METAR or ATIS">
            <TextInput type="number" value={alt} onChange={setAlt} placeholder={unit === 'hPa' ? 'e.g. 1013' : 'e.g. 29.92'} />
          </Field>
        </Panel>
        <Panel title="Result">
          {!r && <Notice kind="info">Enter field elevation and the altimeter setting to see pressure altitude.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>Pressure altitude</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{ft(r.pressureAltFt)}</dd>
              <dt style={{ color: 'var(--mute)' }}>Rule of thumb (1000 ft per inHg)</dt>
              <dd style={{ margin: 0 }}>{ft(r.ruleOfThumbFt)}</dd>
            </dl>
          )}
          <p style={{ color: 'var(--mute)', margin: '12px 0 0' }}>
            Next step: add temperature in the <a href="/tools/density-altitude-calculator/">density altitude calculator</a>.
          </p>
        </Panel>
      </IO>
    </>
  )
}
