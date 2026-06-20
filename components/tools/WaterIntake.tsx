'use client'

import { useMemo, useState } from 'react'
import { Segmented, Toolbar, IO, Panel, Field, TextInput, Notice, CopyButton } from '@/components/ui/kit'

type WeightUnit = 'kg' | 'lb'

const ML_PER_CUP = 236.6

interface WaterResult {
  ml: number
  liters: string
  cups: string
}

function calcWater(weightKg: number, activityMin: number): WaterResult {
  const base = 35 * weightKg
  const activityBonus = Math.floor(activityMin / 30) * 350
  const ml = base + activityBonus
  return {
    ml: Math.round(ml),
    liters: (ml / 1000).toFixed(2),
    cups: (ml / ML_PER_CUP).toFixed(1),
  }
}

export default function WaterIntake() {
  const [unit, setUnit] = useState<WeightUnit>('kg')
  const [weight, setWeight] = useState('')
  const [activityMin, setActivityMin] = useState('')

  const error = useMemo(() => {
    if (weight) {
      const w = parseFloat(weight)
      if (isNaN(w) || w <= 0) return 'Weight must be a positive number.'
    }
    if (activityMin) {
      const a = parseFloat(activityMin)
      if (isNaN(a) || a < 0) return 'Activity minutes must be 0 or more.'
    }
    return ''
  }, [weight, activityMin])

  const weightKg = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || w <= 0) return null
    return unit === 'lb' ? w * 0.453592 : w
  }, [weight, unit])

  const result = useMemo<WaterResult | null>(() => {
    if (error || weightKg === null) return null
    const mins = parseFloat(activityMin || '0')
    const activity = isNaN(mins) || mins < 0 ? 0 : mins
    return calcWater(weightKg, activity)
  }, [weightKg, activityMin, error])

  const resultText = result
    ? `${result.ml} ml | ${result.liters} L | ${result.cups} cups`
    : ''

  return (
    <>
      <Toolbar>
        <Segmented
          value={unit}
          onChange={(v) => {
            setUnit(v as WeightUnit)
            setWeight('')
          }}
          options={[
            { value: 'kg', label: 'Kilograms (kg)' },
            { value: 'lb', label: 'Pounds (lb)' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field label={`Weight (${unit})`}>
              <TextInput
                type="number"
                value={weight}
                onChange={setWeight}
                placeholder={unit === 'kg' ? 'e.g. 70' : 'e.g. 154'}
              />
            </Field>

            <Field label="Activity (minutes/day)" hint="Optional — vigorous exercise (running, cycling, etc.)">
              <TextInput
                type="number"
                value={activityMin}
                onChange={setActivityMin}
                placeholder="e.g. 30"
              />
            </Field>

            {error && <Notice kind="error">{error}</Notice>}

            <Notice kind="info">
              Estimate: 35 ml/kg base + 350 ml per 30 min of activity. For informational use only — not medical advice.
            </Notice>
          </div>
        </Panel>

        <Panel
          title="result"
          actions={result ? <CopyButton text={resultText} /> : undefined}
        >
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '1.5rem',
                  background: 'var(--ink-850)',
                  border: '1px solid var(--acid)',
                  borderRadius: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: 'var(--acid)',
                    lineHeight: 1,
                  }}
                >
                  {result.ml.toLocaleString()}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ml / day
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Liters', value: result.liters, unit: 'L' },
                  { label: 'US Cups', value: result.cups, unit: 'cups' },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'var(--ink-850)',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--bone)',
                      }}
                    >
                      {row.value}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {row.unit}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--mute-2)', marginTop: '0.1rem' }}>
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Enter your weight to calculate daily water intake.
            </p>
          )}
        </Panel>
      </IO>
    </>
  )
}
