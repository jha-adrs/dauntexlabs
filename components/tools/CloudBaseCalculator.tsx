'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice, Segmented } from '@/components/ui/kit'
import { cloudBase } from '@/lib/aviation'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const toC = (v: number, unit: string) => (unit === 'F' ? ((v - 32) * 5) / 9 : v)
const ft = (n: number) => `${Math.round(n).toLocaleString('en-US')} ft AGL`

export default function CloudBaseCalculator() {
  const [unit, setUnit] = useState('C')
  const [temp, setTemp] = useState('')
  const [dew, setDew] = useState('')

  const r = useMemo(() => {
    if (temp.trim() === '' || dew.trim() === '') return null
    return cloudBase({ tempC: toC(num(temp), unit), dewC: toC(num(dew), unit) })
  }, [temp, dew, unit])

  const u = unit === 'F' ? '°F' : '°C'

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <IO>
        <Panel title="Inputs">
          <div className="field" role="group" aria-label="Unit">
            <span className="field-label">Unit</span>
            <Segmented
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'C', label: '°C' },
                { value: 'F', label: '°F' },
              ]}
            />
          </div>
          <Field label={`Surface temperature (${u})`}>
            <TextInput type="number" value={temp} onChange={setTemp} placeholder={unit === 'F' ? 'e.g. 77' : 'e.g. 25'} />
          </Field>
          <Field label={`Dewpoint (${u})`} hint="From the METAR, e.g. 25/15">
            <TextInput type="number" value={dew} onChange={setDew} placeholder={unit === 'F' ? 'e.g. 59' : 'e.g. 15'} />
          </Field>
        </Panel>
        <Panel title="Result">
          {!r && <Notice kind="info">Enter temperature and dewpoint to estimate the cloud base.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>Cloud base (spread ÷ 2.5 °C × 1000)</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{ft(r.baseFt)}</dd>
              <dt style={{ color: 'var(--mute)' }}>Cloud base (400 ft per °C)</dt>
              <dd style={{ margin: 0 }}>{ft(r.baseFt400)}</dd>
              <dt style={{ color: 'var(--mute)' }}>Relative humidity</dt>
              <dd style={{ margin: 0 }}>{Math.round(r.rhPct)} %</dd>
            </dl>
          )}
          {r && r.ok && (
            <p style={{ color: 'var(--mute)', margin: '12px 0 0' }}>
              An estimate for convective (cumulus) cloud above the reporting station; actual bases vary.
            </p>
          )}
        </Panel>
      </IO>
    </>
  )
}
