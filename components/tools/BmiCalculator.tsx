'use client'

import { useMemo, useState } from 'react'
import { Segmented, Toolbar, IO, Panel, Field, TextInput, Notice, CopyButton } from '@/components/ui/kit'

type Units = 'metric' | 'imperial'

interface BmiResult {
  bmi: number
  category: string
  categoryColor: string
}

function calcBmi(units: Units, weightStr: string, heightStr: string, heightInStr: string): BmiResult | null {
  const weight = parseFloat(weightStr)
  const height = parseFloat(heightStr)

  if (units === 'metric') {
    if (!weight || !height || weight <= 0 || height <= 0) return null
    const heightM = height / 100
    const bmi = weight / (heightM * heightM)
    return { bmi, ...getCategory(bmi) }
  } else {
    const heightIn = parseFloat(heightStr) * 12 + parseFloat(heightInStr || '0')
    if (!weight || !heightIn || weight <= 0 || heightIn <= 0) return null
    const bmi = (703 * weight) / (heightIn * heightIn)
    return { bmi, ...getCategory(bmi) }
  }
}

function getCategory(bmi: number): { category: string; categoryColor: string } {
  if (bmi < 18.5) return { category: 'Underweight', categoryColor: '#60a5fa' }
  if (bmi < 25) return { category: 'Normal', categoryColor: 'var(--acid)' }
  if (bmi < 30) return { category: 'Overweight', categoryColor: '#fb923c' }
  return { category: 'Obese', categoryColor: '#f87171' }
}

export default function BmiCalculator() {
  const [units, setUnits] = useState<Units>('metric')
  const [weight, setWeight] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')

  const error = useMemo(() => {
    if (units === 'metric') {
      const w = parseFloat(weight)
      const h = parseFloat(heightCm)
      if (weight && (isNaN(w) || w <= 0)) return 'Weight must be a positive number.'
      if (heightCm && (isNaN(h) || h <= 0)) return 'Height must be a positive number.'
    } else {
      const w = parseFloat(weight)
      const ft = parseFloat(heightFt)
      const inch = parseFloat(heightIn || '0')
      if (weight && (isNaN(w) || w <= 0)) return 'Weight must be a positive number.'
      if (heightFt && (isNaN(ft) || ft < 0)) return 'Feet must be a non-negative number.'
      if (heightIn && (isNaN(inch) || inch < 0 || inch >= 12)) return 'Inches must be between 0 and 11.'
    }
    return ''
  }, [units, weight, heightCm, heightFt, heightIn])

  const result = useMemo<BmiResult | null>(() => {
    if (error) return null
    if (units === 'metric') {
      return calcBmi('metric', weight, heightCm, '')
    } else {
      return calcBmi('imperial', weight, heightFt, heightIn)
    }
  }, [units, weight, heightCm, heightFt, heightIn, error])

  const resultText = result ? `BMI: ${result.bmi.toFixed(1)} — ${result.category}` : ''

  return (
    <>
      <Toolbar>
        <Segmented
          value={units}
          onChange={(v) => {
            setUnits(v as Units)
            setWeight('')
            setHeightCm('')
            setHeightFt('')
            setHeightIn('')
          }}
          options={[
            { value: 'metric', label: 'Metric (kg / cm)' },
            { value: 'imperial', label: 'Imperial (lb / ft)' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field label={units === 'metric' ? 'Weight (kg)' : 'Weight (lb)'}>
              <TextInput
                type="number"
                value={weight}
                onChange={setWeight}
                placeholder={units === 'metric' ? 'e.g. 70' : 'e.g. 154'}
              />
            </Field>

            {units === 'metric' ? (
              <Field label="Height (cm)">
                <TextInput
                  type="number"
                  value={heightCm}
                  onChange={setHeightCm}
                  placeholder="e.g. 175"
                />
              </Field>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Field label="Feet">
                  <TextInput
                    type="number"
                    value={heightFt}
                    onChange={setHeightFt}
                    placeholder="5"
                  />
                </Field>
                <Field label="Inches">
                  <TextInput
                    type="number"
                    value={heightIn}
                    onChange={setHeightIn}
                    placeholder="9"
                  />
                </Field>
              </div>
            )}

            {error && <Notice kind="error">{error}</Notice>}

            <Notice kind="info">
              For informational purposes only. Not a substitute for medical advice.
            </Notice>
          </div>
        </Panel>

        <Panel
          title="result"
          actions={result ? <CopyButton text={resultText} /> : undefined}
        >
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1.5rem',
                  background: 'var(--ink-850)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: result.categoryColor,
                    lineHeight: 1,
                  }}
                >
                  {result.bmi.toFixed(1)}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--mute)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  BMI
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: result.categoryColor,
                    fontWeight: 600,
                  }}
                >
                  {result.category}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '2px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                }}
              >
                {[
                  { label: 'Under­weight', range: '< 18.5', color: '#60a5fa' },
                  { label: 'Normal', range: '18.5–24.9', color: 'var(--acid)' },
                  { label: 'Over­weight', range: '25–29.9', color: '#fb923c' },
                  { label: 'Obese', range: '≥ 30', color: '#f87171' },
                ].map((cat) => (
                  <div
                    key={cat.label}
                    style={{
                      padding: '0.5rem',
                      background: 'var(--ink-850)',
                      border: `1px solid ${cat.color === result.categoryColor ? cat.color : 'var(--line)'}`,
                      borderRadius: '3px',
                      textAlign: 'center',
                      color: cat.color === result.categoryColor ? cat.color : 'var(--mute)',
                    }}
                  >
                    <div style={{ marginBottom: '0.2rem' }}>{cat.label}</div>
                    <div style={{ color: 'var(--mute-2)', fontSize: '0.65rem' }}>{cat.range}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Enter your weight and height to calculate BMI.
            </p>
          )}
        </Panel>
      </IO>
    </>
  )
}
