'use client'

import { useMemo, useState } from 'react'
import { Segmented, Select, Toolbar, IO, Panel, Field, TextInput, Notice, CopyButton } from '@/components/ui/kit'

type Sex = 'male' | 'female'

interface CalorieResult {
  bmr: number
  tdee: number
  cut: number
  bulk: number
}

const ACTIVITY_OPTIONS = [
  { value: '1.2', label: 'Sedentary (little or no exercise)' },
  { value: '1.375', label: 'Lightly active (1–3 days/week)' },
  { value: '1.55', label: 'Moderately active (3–5 days/week)' },
  { value: '1.725', label: 'Active (6–7 days/week)' },
  { value: '1.9', label: 'Very active (hard daily exercise)' },
]

function calcCalories(sex: Sex, age: number, weight: number, height: number, activity: number): CalorieResult {
  // Mifflin-St Jeor BMR
  const bmr =
    sex === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161

  const tdee = bmr * activity
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    cut: Math.round(tdee - 500),
    bulk: Math.round(tdee + 500),
  }
}

export default function CalorieCalculator() {
  const [sex, setSex] = useState<Sex>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState('1.2')

  const error = useMemo(() => {
    if (age) {
      const a = parseFloat(age)
      if (isNaN(a) || a < 1 || a > 120) return 'Age must be between 1 and 120.'
    }
    if (weight) {
      const w = parseFloat(weight)
      if (isNaN(w) || w <= 0) return 'Weight must be a positive number.'
    }
    if (height) {
      const h = parseFloat(height)
      if (isNaN(h) || h <= 0) return 'Height must be a positive number.'
    }
    return ''
  }, [age, weight, height])

  const result = useMemo<CalorieResult | null>(() => {
    if (error) return null
    const a = parseFloat(age)
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const act = parseFloat(activity)
    if (!a || !w || !h || !act) return null
    return calcCalories(sex, a, w, h, act)
  }, [sex, age, weight, height, activity, error])

  const resultText = result
    ? `BMR: ${result.bmr} kcal/day | TDEE: ${result.tdee} kcal/day | Cut: ${result.cut} kcal/day | Bulk: ${result.bulk} kcal/day`
    : ''

  return (
    <>
      <Toolbar>
        <Segmented
          value={sex}
          onChange={(v) => setSex(v as Sex)}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field label="Age (years)">
              <TextInput
                type="number"
                value={age}
                onChange={setAge}
                placeholder="e.g. 30"
              />
            </Field>

            <Field label="Weight (kg)">
              <TextInput
                type="number"
                value={weight}
                onChange={setWeight}
                placeholder="e.g. 80"
              />
            </Field>

            <Field label="Height (cm)">
              <TextInput
                type="number"
                value={height}
                onChange={setHeight}
                placeholder="e.g. 180"
              />
            </Field>

            <Field label="Activity level">
              <Select
                value={activity}
                onChange={setActivity}
                options={ACTIVITY_OPTIONS}
              />
            </Field>

            {error && <Notice kind="error">{error}</Notice>}

            <Notice kind="info">
              Estimates based on the Mifflin-St Jeor equation. For informational use only — not medical advice.
            </Notice>
          </div>
        </Panel>

        <Panel
          title="result"
          actions={result ? <CopyButton text={resultText} /> : undefined}
        >
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'BMR', value: result.bmr, desc: 'Basal metabolic rate (at rest)', highlight: false },
                { label: 'TDEE', value: result.tdee, desc: 'Total daily energy expenditure', highlight: true },
                { label: 'Cut (−500)', value: result.cut, desc: 'Goal: lose ~0.5 kg/week', highlight: false },
                { label: 'Bulk (+500)', value: result.bulk, desc: 'Goal: gain ~0.5 kg/week', highlight: false },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--ink-850)',
                    border: `1px solid ${row.highlight ? 'var(--acid)' : 'var(--line)'}`,
                    borderRadius: '4px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: row.highlight ? 'var(--acid)' : 'var(--mute)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {row.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--mute-2)' }}>
                      {row.desc}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: row.highlight ? 'var(--acid)' : 'var(--bone)',
                    }}
                  >
                    {row.value.toLocaleString()} <span style={{ fontSize: '0.65rem', color: 'var(--mute)', fontWeight: 400 }}>kcal/day</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Fill in all fields to calculate your daily calorie needs.
            </p>
          )}
        </Panel>
      </IO>
    </>
  )
}
