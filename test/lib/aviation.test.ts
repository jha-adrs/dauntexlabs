import { describe, it, expect } from 'vitest'
import { densityAltitude, windCorrection, trueAirspeed, crosswind, isaTempC } from '@/lib/aviation'

// Reference values: ISA troposphere (ICAO Doc 7488 / US Standard Atmosphere 1976) —
// T0 = 15 °C, lapse 1.98 °C per 1000 ft, P/P0 = (1 − 6.8756e-6·h)^5.2559.
// Density altitude per the NWS formula (weather.gov "Density Altitude" calculator notes).
// TAS via compressible-flow CAS → Mach → TAS (e.g. Wikipedia "Calibrated airspeed").

describe('isaTempC', () => {
  it('is 15 °C at sea level and 5.1 °C at 5000 ft', () => {
    expect(isaTempC(0)).toBeCloseTo(15, 6)
    expect(isaTempC(5000)).toBeCloseTo(5.1, 6)
  })
})

describe('densityAltitude', () => {
  it('PA 5000 ft, OAT 30 °C → ≈ 7,801 ft (rule of thumb ≈ 7,988, within ±250)', () => {
    const r = densityAltitude({ pressureAltFt: 5000, oatC: 30 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.densityAltFt).toBeCloseTo(7800.7, 0)
    expect(Math.abs(r.densityAltFt - (5000 + 120 * (30 - 5.1)))).toBeLessThan(250)
    expect(r.isaTempC).toBeCloseTo(5.1, 6)
    expect(r.isaDevC).toBeCloseTo(24.9, 6)
  })

  it('ISA sea level → 0 ft', () => {
    const r = densityAltitude({ pressureAltFt: 0, oatC: 15 })
    expect(r.ok && Math.abs(r.densityAltFt)).toBeLessThan(0.5)
  })

  it('humidity (dewpoint) raises density altitude', () => {
    const dry = densityAltitude({ pressureAltFt: 5000, oatC: 30 })
    const wet = densityAltitude({ pressureAltFt: 5000, oatC: 30, dewpointC: 20 })
    expect(wet.ok && dry.ok).toBe(true)
    if (!wet.ok || !dry.ok) return
    expect(wet.densityAltFt).toBeCloseTo(8141.1, 0)
    expect(wet.densityAltFt).toBeGreaterThan(dry.densityAltFt)
  })

  it('negative pressure altitude (Dead Sea) is allowed and finite', () => {
    const r = densityAltitude({ pressureAltFt: -1400, oatC: 40 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(Number.isFinite(r.densityAltFt)).toBe(true)
  })

  it('rejects dewpoint above temperature and non-numbers', () => {
    expect(densityAltitude({ pressureAltFt: 0, oatC: 10, dewpointC: 12 }).ok).toBe(false)
    expect(densityAltitude({ pressureAltFt: NaN, oatC: 10 }).ok).toBe(false)
    expect(densityAltitude({ pressureAltFt: 0, oatC: -300 }).ok).toBe(false)
  })
})

describe('windCorrection', () => {
  it('TAS 120, course 090, wind 360/20 → WCA −9.6°, heading 080, GS 118', () => {
    const r = windCorrection({ tasKt: 120, courseDeg: 90, windFromDeg: 360, windKt: 20 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.wcaDeg).toBeCloseTo(-9.594, 2)
    expect(r.headingDeg).toBeCloseTo(80.406, 2)
    expect(r.groundSpeedKt).toBeCloseTo(118.32, 1)
  })

  it('calm wind → WCA 0, GS = TAS', () => {
    const r = windCorrection({ tasKt: 100, courseDeg: 45, windFromDeg: 200, windKt: 0 })
    expect(r.ok && r.wcaDeg).toBe(0)
    expect(r.ok && r.groundSpeedKt).toBe(100)
    expect(r.ok && r.headingDeg).toBe(45)
  })

  it('heading wraps into 0–360', () => {
    const r = windCorrection({ tasKt: 100, courseDeg: 5, windFromDeg: 270, windKt: 30 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.headingDeg).toBeGreaterThan(300)
  })

  it('crosswind component ≥ TAS → explicit error', () => {
    expect(windCorrection({ tasKt: 50, courseDeg: 90, windFromDeg: 0, windKt: 60 }).ok).toBe(false)
    expect(windCorrection({ tasKt: 50, courseDeg: 90, windFromDeg: 0, windKt: 50 }).ok).toBe(false)
  })

  it('headwind ≥ TAS (no ground progress) → explicit error', () => {
    expect(windCorrection({ tasKt: 50, courseDeg: 90, windFromDeg: 90, windKt: 60 }).ok).toBe(false)
  })

  it('rejects zero TAS and negative wind', () => {
    expect(windCorrection({ tasKt: 0, courseDeg: 90, windFromDeg: 0, windKt: 10 }).ok).toBe(false)
    expect(windCorrection({ tasKt: 100, courseDeg: 90, windFromDeg: 0, windKt: -1 }).ok).toBe(false)
  })
})

describe('trueAirspeed', () => {
  it('CAS 150 kt, PA 8000 ft, OAT 0 °C → TAS ≈ 169 kt (plan: ≈ 170 ± 2)', () => {
    const r = trueAirspeed({ casKt: 150, pressureAltFt: 8000, oatC: 0 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tasKt).toBeCloseTo(169.08, 1)
    expect(Math.abs(r.tasKt - 170)).toBeLessThanOrEqual(2)
    expect(r.mach).toBeCloseTo(0.2625, 3)
  })

  it('ISA sea level → TAS = CAS', () => {
    const r = trueAirspeed({ casKt: 100, pressureAltFt: 0, oatC: 15 })
    expect(r.ok && r.tasKt).toBeCloseTo(100, 6)
  })

  it('negative altitude is finite', () => {
    const r = trueAirspeed({ casKt: 100, pressureAltFt: -1000, oatC: 30 })
    expect(r.ok && Number.isFinite(r.tasKt)).toBe(true)
  })

  it('rejects supersonic / non-positive CAS and out-of-range altitude', () => {
    expect(trueAirspeed({ casKt: 0, pressureAltFt: 0, oatC: 15 }).ok).toBe(false)
    expect(trueAirspeed({ casKt: 700, pressureAltFt: 0, oatC: 15 }).ok).toBe(false)
    expect(trueAirspeed({ casKt: 500, pressureAltFt: 35000, oatC: -55 }).ok).toBe(false)
    expect(trueAirspeed({ casKt: 100, pressureAltFt: 50000, oatC: -55 }).ok).toBe(false)
  })
})

describe('crosswind', () => {
  it('runway 270, wind 300/20 → headwind 17.3, crosswind 10.0 from the right', () => {
    const r = crosswind({ runwayDeg: 270, windFromDeg: 300, windKt: 20 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.headwindKt).toBeCloseTo(17.32, 2)
    expect(r.crosswindKt).toBeCloseTo(10, 6)
    expect(r.side).toBe('right')
  })

  it('wind from the left', () => {
    const r = crosswind({ runwayDeg: 90, windFromDeg: 45, windKt: 10 })
    expect(r.ok && r.side).toBe('left')
  })

  it('tailwind is negative headwind; straight down the runway is side none', () => {
    const r = crosswind({ runwayDeg: 90, windFromDeg: 270, windKt: 10 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.headwindKt).toBeCloseTo(-10, 6)
    expect(r.side).toBe('none')
    expect(r.crosswindKt).toBe(0)
  })

  it('calm wind → zeros', () => {
    const r = crosswind({ runwayDeg: 90, windFromDeg: 0, windKt: 0 })
    expect(r.ok && r.headwindKt).toBe(0)
    expect(r.ok && r.side).toBe('none')
  })

  it('rejects invalid input', () => {
    expect(crosswind({ runwayDeg: 400, windFromDeg: 0, windKt: 10 }).ok).toBe(false)
    expect(crosswind({ runwayDeg: 90, windFromDeg: 0, windKt: -5 }).ok).toBe(false)
  })
})
