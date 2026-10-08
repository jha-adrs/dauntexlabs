import { describe, it, expect } from 'vitest'
import {
  densityAltitude,
  windCorrection,
  trueAirspeed,
  crosswind,
  isaTempC,
  cloudBase,
  pressureAltitude,
  flightTimeFuel,
  weightBalance,
} from '@/lib/aviation'

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

describe('cloudBase', () => {
  it('25 °C / 15 °C → 4,000 ft by both rules, RH ≈ 54 %', () => {
    const r = cloudBase({ tempC: 25, dewC: 15 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.baseFt).toBeCloseTo(4000, 6)
    expect(r.baseFt400).toBeCloseTo(4000, 6)
    expect(Math.abs(r.rhPct - 54)).toBeLessThanOrEqual(1)
  })

  it('saturated air → base 0 ft, RH 100 %', () => {
    const r = cloudBase({ tempC: 10, dewC: 10 })
    expect(r.ok && r.baseFt).toBe(0)
    expect(r.ok && r.rhPct).toBeCloseTo(100, 6)
  })

  it('rejects dewpoint above temperature, non-numbers and out-of-range values', () => {
    const r = cloudBase({ tempC: 10, dewC: 12 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/dew/i)
    expect(cloudBase({ tempC: NaN, dewC: 5 }).ok).toBe(false)
    expect(cloudBase({ tempC: 10, dewC: -300 }).ok).toBe(false)
  })
})

describe('pressureAltitude', () => {
  it('elev 0, 1003.25 hPa → 274 ft', () => {
    const r = pressureAltitude({ elevationFt: 0, altimeter: 1003.25, unit: 'hPa' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(Math.abs(r.pressureAltFt - 274)).toBeLessThanOrEqual(1)
  })

  it('elev 1000, 29.42 inHg → 1,467 ft; rule of thumb 1,500 ft', () => {
    const r = pressureAltitude({ elevationFt: 1000, altimeter: 29.42, unit: 'inHg' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(Math.abs(r.pressureAltFt - 1467)).toBeLessThanOrEqual(1)
    expect(r.ruleOfThumbFt).toBeCloseTo(1500, 6)
  })

  it('standard setting 1013.25 hPa → PA equals elevation', () => {
    const r = pressureAltitude({ elevationFt: 2500, altimeter: 1013.25, unit: 'hPa' })
    expect(r.ok && r.pressureAltFt).toBeCloseTo(2500, 6)
  })

  it('rejects non-numbers and implausible altimeter settings', () => {
    expect(pressureAltitude({ elevationFt: NaN, altimeter: 29.92, unit: 'inHg' }).ok).toBe(false)
    expect(pressureAltitude({ elevationFt: 0, altimeter: 0, unit: 'hPa' }).ok).toBe(false)
    expect(pressureAltitude({ elevationFt: 0, altimeter: 1013, unit: 'inHg' }).ok).toBe(false)
    expect(pressureAltitude({ elevationFt: 0, altimeter: 29.92, unit: 'hPa' }).ok).toBe(false)
  })
})

describe('flightTimeFuel', () => {
  it('150 nm @ 120 kt, 10 gal/h, 45 min reserve → 75 min, 12.5 + 7.5 = 20 gal, 120 lb avgas', () => {
    const r = flightTimeFuel({ distanceNm: 150, groundSpeedKt: 120, burnPerHour: 10, reserveMin: 45, fuel: 'avgas', unit: 'gal' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.minutes).toBeCloseTo(75, 6)
    expect(r.tripFuel).toBeCloseTo(12.5, 6)
    expect(r.reserveFuel).toBeCloseTo(7.5, 6)
    expect(r.totalFuel).toBeCloseTo(20, 6)
    expect(r.totalLb).toBeCloseTo(120, 6)
  })

  it('Jet A weighs 6.7 lb/gal', () => {
    const r = flightTimeFuel({ distanceNm: 150, groundSpeedKt: 120, burnPerHour: 10, reserveMin: 45, fuel: 'jeta', unit: 'gal' })
    expect(r.ok && r.totalLb).toBeCloseTo(134, 6)
  })

  it('litres convert at 3.78541 L per gal', () => {
    const r = flightTimeFuel({ distanceNm: 150, groundSpeedKt: 120, burnPerHour: 37.8541, reserveMin: 45, fuel: 'avgas', unit: 'L' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.totalFuel).toBeCloseTo(75.7082, 4)
    expect(r.totalLb).toBeCloseTo(120, 6)
  })

  it('pounds stay pounds', () => {
    const r = flightTimeFuel({ distanceNm: 150, groundSpeedKt: 120, burnPerHour: 60, reserveMin: 30, fuel: 'avgas', unit: 'lb' })
    expect(r.ok && r.totalFuel).toBeCloseTo(105, 6)
    expect(r.ok && r.totalLb).toBeCloseTo(105, 6)
  })

  it('rejects zero ground speed, negative values and non-numbers', () => {
    const r = flightTimeFuel({ distanceNm: 150, groundSpeedKt: 0, burnPerHour: 10, reserveMin: 45, fuel: 'avgas', unit: 'gal' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/ground speed/i)
    expect(flightTimeFuel({ distanceNm: -1, groundSpeedKt: 100, burnPerHour: 10, reserveMin: 45, fuel: 'avgas', unit: 'gal' }).ok).toBe(false)
    expect(flightTimeFuel({ distanceNm: 100, groundSpeedKt: 100, burnPerHour: -1, reserveMin: 45, fuel: 'avgas', unit: 'gal' }).ok).toBe(false)
    expect(flightTimeFuel({ distanceNm: 100, groundSpeedKt: 100, burnPerHour: 10, reserveMin: NaN, fuel: 'avgas', unit: 'gal' }).ok).toBe(false)
  })
})

describe('weightBalance', () => {
  const rows = [
    { item: 'Empty weight', weight: 1500, arm: 85 },
    { item: 'Front seats', weight: 340, arm: 87 },
    { item: 'Fuel', weight: 180, arm: 95 },
  ]

  it('totals weight and moment, CG 86.23, within limits', () => {
    const r = weightBalance(rows, { minCg: 82, maxCg: 93, maxWeight: 2300 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.totalWeight).toBe(2020)
    expect(r.totalMoment).toBeCloseTo(174180, 6)
    expect(Math.abs(r.cg - 86.23)).toBeLessThanOrEqual(0.01)
    expect(r.within).toBe(true)
    expect(r.reasons).toEqual([])
  })

  it('over max weight → not within, reason mentions weight', () => {
    const r = weightBalance(rows, { minCg: 82, maxCg: 93, maxWeight: 2000 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.within).toBe(false)
    expect(r.reasons.join(' ')).toMatch(/weight/i)
  })

  it('CG outside the envelope → not within, reason mentions CG', () => {
    const r = weightBalance(rows, { minCg: 87, maxCg: 93, maxWeight: 2300 })
    expect(r.ok && r.within).toBe(false)
    if (r.ok) expect(r.reasons.join(' ')).toMatch(/CG/)
  })

  it('rejects empty rows, zero total weight, negative weight and bad envelopes', () => {
    expect(weightBalance([], { minCg: 82, maxCg: 93, maxWeight: 2300 }).ok).toBe(false)
    expect(weightBalance([{ item: 'x', weight: 0, arm: 80 }], { minCg: 82, maxCg: 93, maxWeight: 2300 }).ok).toBe(false)
    expect(weightBalance([{ item: 'x', weight: -5, arm: 80 }], { minCg: 82, maxCg: 93, maxWeight: 2300 }).ok).toBe(false)
    expect(weightBalance([{ item: 'x', weight: NaN, arm: 80 }], { minCg: 82, maxCg: 93, maxWeight: 2300 }).ok).toBe(false)
    expect(weightBalance(rows, { minCg: 93, maxCg: 82, maxWeight: 2300 }).ok).toBe(false)
    expect(weightBalance(rows, { minCg: 82, maxCg: 93, maxWeight: 0 }).ok).toBe(false)
  })
})
