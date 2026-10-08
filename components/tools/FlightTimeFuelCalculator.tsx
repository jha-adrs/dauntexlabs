'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice, Segmented } from '@/components/ui/kit'
import { flightTimeFuel } from '@/lib/aviation'

type Unit = 'gal' | 'L' | 'lb'
type Fuel = 'avgas' | 'jeta'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const hm = (min: number) => {
  const total = Math.round(min)
  const h = Math.floor(total / 60)
  return h > 0 ? `${h} h ${total % 60} min` : `${total} min`
}

export default function FlightTimeFuelCalculator() {
  const [dist, setDist] = useState('')
  const [gs, setGs] = useState('')
  const [burn, setBurn] = useState('')
  const [reserve, setReserve] = useState('45')
  const [fuel, setFuel] = useState<Fuel>('avgas')
  const [unit, setUnit] = useState<Unit>('gal')

  const r = useMemo(() => {
    if ([dist, gs, burn].some((s) => s.trim() === '')) return null
    return flightTimeFuel({
      distanceNm: num(dist),
      groundSpeedKt: num(gs),
      burnPerHour: num(burn),
      reserveMin: Number(reserve),
      fuel,
      unit,
    })
  }, [dist, gs, burn, reserve, fuel, unit])

  const q = (n: number) => `${n.toFixed(1)} ${unit}`

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <IO>
        <Panel title="Inputs">
          <Field label="Distance (nm)">
            <TextInput type="number" value={dist} onChange={setDist} placeholder="e.g. 150" />
          </Field>
          <Field label="Ground speed (kt)" hint="True airspeed corrected for wind">
            <TextInput type="number" value={gs} onChange={setGs} placeholder="e.g. 120" />
          </Field>
          <div className="field" role="group" aria-label="Fuel unit">
            <span className="field-label">Fuel unit</span>
            <Segmented
              value={unit}
              onChange={(v) => setUnit(v as Unit)}
              options={[
                { value: 'gal', label: 'US gal' },
                { value: 'L', label: 'Litres' },
                { value: 'lb', label: 'lb' },
              ]}
            />
          </div>
          <Field label={`Fuel burn (${unit} per hour)`}>
            <TextInput type="number" value={burn} onChange={setBurn} placeholder="e.g. 10" />
          </Field>
          <div className="field" role="group" aria-label="Reserve">
            <span className="field-label">Reserve</span>
            <Segmented
              value={reserve}
              onChange={setReserve}
              options={[
                { value: '30', label: '30 min' },
                { value: '45', label: '45 min' },
              ]}
            />
            <span className="field-hint">30 min is the common day VFR minimum, 45 min night VFR / IFR (check your rules)</span>
          </div>
          <div className="field" role="group" aria-label="Fuel type">
            <span className="field-label">Fuel type</span>
            <Segmented
              value={fuel}
              onChange={(v) => setFuel(v as Fuel)}
              options={[
                { value: 'avgas', label: 'Avgas' },
                { value: 'jeta', label: 'Jet A' },
              ]}
            />
            <span className="field-hint">Avgas ≈ 6 lb/gal, Jet A ≈ 6.7 lb/gal</span>
          </div>
        </Panel>
        <Panel title="Result">
          {!r && <Notice kind="info">Enter distance, ground speed and fuel burn to see time and fuel required.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>Flight time</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{hm(r.minutes)}</dd>
              <dt style={{ color: 'var(--mute)' }}>Trip fuel</dt>
              <dd style={{ margin: 0 }}>{q(r.tripFuel)}</dd>
              <dt style={{ color: 'var(--mute)' }}>Reserve fuel</dt>
              <dd style={{ margin: 0 }}>{q(r.reserveFuel)}</dd>
              <dt style={{ color: 'var(--mute)' }}>Total fuel required</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{q(r.totalFuel)}</dd>
              {unit !== 'lb' && (
                <>
                  <dt style={{ color: 'var(--mute)' }}>Total fuel weight</dt>
                  <dd style={{ margin: 0 }}>{Math.round(r.totalLb).toLocaleString('en-US')} lb</dd>
                </>
              )}
            </dl>
          )}
        </Panel>
      </IO>
    </>
  )
}
