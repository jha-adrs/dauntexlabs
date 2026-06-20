'use client'

import { useMemo, useState } from 'react'
import { Segmented, Toolbar, IO, Panel, Field, TextInput, Notice, CopyButton } from '@/components/ui/kit'

type Mode = 'pace' | 'time' | 'distance'

/** Parse "mm:ss" or "hh:mm:ss" strings into total seconds. Returns NaN on invalid. */
function parseTimeStr(s: string): number {
  const trimmed = s.trim()
  if (!trimmed) return NaN
  const parts = trimmed.split(':').map((p) => parseFloat(p))
  if (parts.some(isNaN)) return NaN
  if (parts.length === 2) {
    // mm:ss
    const [mm, ss] = parts
    if (ss < 0 || ss >= 60) return NaN
    return mm * 60 + ss
  }
  if (parts.length === 3) {
    // hh:mm:ss
    const [hh, mm, ss] = parts
    if (mm < 0 || mm >= 60 || ss < 0 || ss >= 60) return NaN
    return hh * 3600 + mm * 60 + ss
  }
  return NaN
}

/** Parse separate hh, mm, ss fields into total seconds. */
function parseHMS(hh: string, mm: string, ss: string): number {
  const h = parseFloat(hh || '0')
  const m = parseFloat(mm || '0')
  const s = parseFloat(ss || '0')
  if (isNaN(h) || isNaN(m) || isNaN(s)) return NaN
  if (m < 0 || m >= 60 || s < 0 || s >= 60) return NaN
  return h * 3600 + m * 60 + s
}

/** Format total seconds into "h:mm:ss" or "mm:ss". */
function fmtTime(totalSec: number): string {
  const rounded = Math.round(totalSec)
  const h = Math.floor(rounded / 3600)
  const m = Math.floor((rounded % 3600) / 60)
  const s = rounded % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format pace (seconds per km) into "mm:ss /km" and "mm:ss /mi". */
function fmtPace(secPerKm: number): { perKm: string; perMi: string } {
  const secPerMi = secPerKm * 1.60934
  return { perKm: fmtTime(secPerKm), perMi: fmtTime(secPerMi) }
}

interface PaceResult {
  perKm: string
  perMi: string
  totalTime?: string
  distance?: string
  label: string
}

export default function PaceCalculator() {
  const [mode, setMode] = useState<Mode>('pace')

  // Shared fields
  const [distance, setDistance] = useState('')   // km
  const [timeHH, setTimeHH] = useState('')
  const [timeMM, setTimeMM] = useState('')
  const [timeSS, setTimeSS] = useState('')
  const [paceInput, setPaceInput] = useState('') // "mm:ss" per km

  const error = useMemo(() => {
    if (mode === 'pace') {
      const d = parseFloat(distance)
      if (distance && (isNaN(d) || d <= 0)) return 'Distance must be a positive number.'
      const totalSec = parseHMS(timeHH, timeMM, timeSS)
      if ((timeHH || timeMM || timeSS) && (isNaN(totalSec) || totalSec <= 0))
        return 'Time fields are invalid. Minutes and seconds must be 0–59.'
    }
    if (mode === 'time') {
      const d = parseFloat(distance)
      if (distance && (isNaN(d) || d <= 0)) return 'Distance must be a positive number.'
      const pSec = parseTimeStr(paceInput)
      if (paceInput && (isNaN(pSec) || pSec <= 0)) return 'Pace must be in mm:ss format (e.g. 5:30).'
    }
    if (mode === 'distance') {
      const totalSec = parseHMS(timeHH, timeMM, timeSS)
      if ((timeHH || timeMM || timeSS) && (isNaN(totalSec) || totalSec <= 0))
        return 'Time fields are invalid. Minutes and seconds must be 0–59.'
      const pSec = parseTimeStr(paceInput)
      if (paceInput && (isNaN(pSec) || pSec <= 0)) return 'Pace must be in mm:ss format (e.g. 5:30).'
    }
    return ''
  }, [mode, distance, timeHH, timeMM, timeSS, paceInput])

  const result = useMemo<PaceResult | null>(() => {
    if (error) return null
    if (mode === 'pace') {
      const d = parseFloat(distance)
      const totalSec = parseHMS(timeHH, timeMM, timeSS)
      if (!d || isNaN(totalSec) || totalSec <= 0 || d <= 0) return null
      const secPerKm = totalSec / d
      const { perKm, perMi } = fmtPace(secPerKm)
      return { perKm, perMi, label: 'pace' }
    }
    if (mode === 'time') {
      const d = parseFloat(distance)
      const pSec = parseTimeStr(paceInput)
      if (!d || isNaN(pSec) || pSec <= 0 || d <= 0) return null
      const totalSec = d * pSec
      const { perKm, perMi } = fmtPace(pSec)
      return { perKm, perMi, totalTime: fmtTime(totalSec), label: 'time' }
    }
    if (mode === 'distance') {
      const totalSec = parseHMS(timeHH, timeMM, timeSS)
      const pSec = parseTimeStr(paceInput)
      if (isNaN(totalSec) || totalSec <= 0 || isNaN(pSec) || pSec <= 0) return null
      const dist = totalSec / pSec
      const { perKm, perMi } = fmtPace(pSec)
      return { perKm, perMi, distance: dist.toFixed(2), label: 'distance' }
    }
    return null
  }, [mode, distance, timeHH, timeMM, timeSS, paceInput, error])

  const resultText = result
    ? mode === 'pace'
      ? `Pace: ${result.perKm} /km | ${result.perMi} /mi`
      : mode === 'time'
      ? `Total time: ${result.totalTime} | Pace: ${result.perKm} /km | ${result.perMi} /mi`
      : `Distance: ${result.distance} km | Pace: ${result.perKm} /km`
    : ''

  function resetFields() {
    setDistance('')
    setTimeHH('')
    setTimeMM('')
    setTimeSS('')
    setPaceInput('')
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => { setMode(v as Mode); resetFields() }}
          options={[
            { value: 'pace', label: 'Pace' },
            { value: 'time', label: 'Time' },
            { value: 'distance', label: 'Distance' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Distance input — shown for pace + time modes */}
            {(mode === 'pace' || mode === 'time') && (
              <Field label="Distance (km)">
                <TextInput
                  type="number"
                  value={distance}
                  onChange={setDistance}
                  placeholder="e.g. 10"
                />
              </Field>
            )}

            {/* Time inputs — shown for pace + distance modes */}
            {(mode === 'pace' || mode === 'distance') && (
              <div>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--mute)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.35rem',
                  }}
                >
                  Time (hh : mm : ss)
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <TextInput type="number" value={timeHH} onChange={setTimeHH} placeholder="hh" />
                  <span style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>:</span>
                  <TextInput type="number" value={timeMM} onChange={setTimeMM} placeholder="mm" />
                  <span style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>:</span>
                  <TextInput type="number" value={timeSS} onChange={setTimeSS} placeholder="ss" />
                </div>
              </div>
            )}

            {/* Pace input — shown for time + distance modes */}
            {(mode === 'time' || mode === 'distance') && (
              <Field label="Pace per km (mm:ss)" hint='e.g. "5:30" for 5 min 30 sec per km'>
                <TextInput
                  value={paceInput}
                  onChange={setPaceInput}
                  placeholder="5:30"
                />
              </Field>
            )}

            {error && <Notice kind="error">{error}</Notice>}

            <Notice kind="info">
              For informational use only. Pace conversions use 1 mi = 1.60934 km.
            </Notice>
          </div>
        </Panel>

        <Panel
          title="result"
          actions={result ? <CopyButton text={resultText} /> : undefined}
        >
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mode === 'pace' && (
                <>
                  <ResultRow label="Pace / km" value={result.perKm} unit="/km" highlight />
                  <ResultRow label="Pace / mi" value={result.perMi} unit="/mi" />
                </>
              )}
              {mode === 'time' && (
                <>
                  <ResultRow label="Total time" value={result.totalTime!} unit="" highlight />
                  <ResultRow label="Pace / km" value={result.perKm} unit="/km" />
                  <ResultRow label="Pace / mi" value={result.perMi} unit="/mi" />
                </>
              )}
              {mode === 'distance' && (
                <>
                  <ResultRow label="Distance" value={result.distance!} unit="km" highlight />
                  <ResultRow label="Pace / km" value={result.perKm} unit="/km" />
                  <ResultRow label="Pace / mi" value={result.perMi} unit="/mi" />
                </>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {mode === 'pace' && 'Enter distance and time to calculate pace.'}
              {mode === 'time' && 'Enter distance and pace to calculate total time.'}
              {mode === 'distance' && 'Enter time and pace to calculate distance.'}
            </p>
          )}
        </Panel>
      </IO>
    </>
  )
}

function ResultRow({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string
  value: string
  unit: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'var(--ink-850)',
        border: `1px solid ${highlight ? 'var(--acid)' : 'var(--line)'}`,
        borderRadius: '4px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: highlight ? 'var(--acid)' : 'var(--mute)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: highlight ? 'var(--acid)' : 'var(--bone)',
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: '0.7rem', color: 'var(--mute)', fontWeight: 400, marginLeft: '0.3rem' }}>
            {unit}
          </span>
        )}
      </span>
    </div>
  )
}
