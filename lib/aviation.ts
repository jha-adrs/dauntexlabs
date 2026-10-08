/**
 * Aviation planning maths — pure functions, no I/O.
 *
 * Formula sources:
 *  - International Standard Atmosphere, troposphere (ICAO Doc 7488 / US Standard Atmosphere 1976):
 *    T0 = 288.15 K (15 °C), lapse 0.0019812 K/ft (≈ 1.98 °C per 1000 ft), P0 = 1013.25 hPa,
 *    P/P0 = (1 − 6.8755856e-6·h)^5.2558797 with h in feet. Valid up to the tropopause (36,089 ft).
 *  - Density altitude: NWS formula (weather.gov density-altitude calculator notes) —
 *    σ = (P/P0)·(T0/T), DA = 145442.16·(1 − σ^0.234969) ft, with virtual temperature
 *    Tv = T / (1 − (e/P)(1 − 0.622)) when a dewpoint is given, e = 6.1078·10^(7.5·Td/(237.3+Td)) hPa.
 *  - True airspeed: subsonic compressible flow (e.g. Wikipedia "Calibrated airspeed" / "Mach number"):
 *    qc = P0[(1 + 0.2(CAS/a0)²)^3.5 − 1], M = √(5[(qc/P + 1)^(2/7) − 1]), TAS = M·a0·√(T/T0),
 *    a0 = 661.4786 kt.
 *  - Wind triangle (FAA Pilot's Handbook of Aeronautical Knowledge, ch. 16 / E6B):
 *    crosswind = W·sin(windFrom − course), WCA = asin(crosswind / TAS),
 *    GS = TAS·cos(WCA) − W·cos(windFrom − course).
 *  - Cloud base (FAA AC 00-6B / common pilot rule): base ≈ (temp − dewpoint) ÷ 2.5 °C × 1000 ft,
 *    i.e. 400 ft per °C of spread. Relative humidity via the Magnus formula (Alduchov & Eskridge 1996:
 *    a = 17.625, b = 243.04 °C).
 *  - Pressure altitude (NWS pressure-altitude formula): PA = elev + (1 − (P/1013.25)^0.190284) × 145366.45 ft,
 *    1 inHg = 33.8639 hPa. Rule of thumb: elev + (29.92 − altimeter inHg) × 1000.
 *  - Fuel weights (typical, temperature dependent): avgas 6 lb/US gal, Jet A 6.7 lb/US gal; 1 US gal = 3.78541 L.
 *  - Weight & balance (FAA Weight & Balance Handbook, FAA-H-8083-1): moment = weight × arm, CG = Σmoment ÷ Σweight.
 */

export type Fail = { ok: false; error: string }

const T0_K = 288.15
const P0_HPA = 1013.25
const A0_KT = 661.4786
// Displayed ISA temperature uses the conventional pilot rounding of 1.98 °C per 1000 ft.
const LAPSE_C_PER_FT = 0.00198
const MIN_ALT_FT = -2000
const MAX_ALT_FT = 36000

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
/** Snap float noise (and −0) to 0. */
const clean = (x: number) => (Math.abs(x) < 1e-9 ? 0 : x)
const norm360 = (d: number) => clean(((d % 360) + 360) % 360)

const finite = (...xs: number[]) => xs.every((x) => Number.isFinite(x))

function checkAlt(h: number): string | null {
  if (h < MIN_ALT_FT || h > MAX_ALT_FT)
    return `Pressure altitude must be between ${MIN_ALT_FT.toLocaleString('en-US')} and ${MAX_ALT_FT.toLocaleString('en-US')} ft.`
  return null
}
function checkTemp(t: number, what: string): string | null {
  if (t < -90 || t > 60) return `${what} must be between −90 and 60 °C.`
  return null
}
function checkDeg(d: number, what: string): string | null {
  if (d < 0 || d > 360) return `${what} must be between 0 and 360°.`
  return null
}

/** ISA temperature (°C) at a pressure altitude (ft). */
export function isaTempC(pressureAltFt: number): number {
  return 15 - LAPSE_C_PER_FT * pressureAltFt
}

/** ISA pressure ratio P/P0 at a pressure altitude (ft). */
function pressureRatio(pressureAltFt: number): number {
  return Math.pow(1 - 6.8755856e-6 * pressureAltFt, 5.2558797)
}

export function densityAltitude(i: {
  pressureAltFt: number
  oatC: number
  dewpointC?: number
}): { ok: true; densityAltFt: number; isaTempC: number; isaDevC: number } | Fail {
  const { pressureAltFt: h, oatC, dewpointC } = i
  if (!finite(h, oatC) || (dewpointC !== undefined && !finite(dewpointC)))
    return { ok: false, error: 'Enter numbers for every field.' }
  const e = checkAlt(h) ?? checkTemp(oatC, 'Temperature')
  if (e) return { ok: false, error: e }
  if (dewpointC !== undefined) {
    const d = checkTemp(dewpointC, 'Dewpoint')
    if (d) return { ok: false, error: d }
    if (dewpointC > oatC) return { ok: false, error: 'Dewpoint cannot be higher than the temperature.' }
  }
  const pr = pressureRatio(h)
  let tK = oatC + 273.15
  if (dewpointC !== undefined) {
    const vapour = 6.1078 * Math.pow(10, (7.5 * dewpointC) / (237.3 + dewpointC))
    tK = tK / (1 - (vapour / (P0_HPA * pr)) * (1 - 0.622))
  }
  const sigma = (pr * T0_K) / tK
  const da = 145442.16 * (1 - Math.pow(sigma, 0.234969))
  const isa = isaTempC(h)
  if (!finite(da)) return { ok: false, error: 'Could not compute density altitude for these values.' }
  return { ok: true, densityAltFt: clean(da), isaTempC: isa, isaDevC: oatC - isa }
}

export function windCorrection(i: {
  tasKt: number
  courseDeg: number
  windFromDeg: number
  windKt: number
}): { ok: true; wcaDeg: number; headingDeg: number; groundSpeedKt: number } | Fail {
  const { tasKt, courseDeg, windFromDeg, windKt } = i
  if (!finite(tasKt, courseDeg, windFromDeg, windKt))
    return { ok: false, error: 'Enter numbers for every field.' }
  if (tasKt <= 0) return { ok: false, error: 'True airspeed must be greater than 0 kt.' }
  if (windKt < 0) return { ok: false, error: 'Wind speed cannot be negative.' }
  const e = checkDeg(courseDeg, 'Course') ?? checkDeg(windFromDeg, 'Wind direction')
  if (e) return { ok: false, error: e }
  const rel = rad(windFromDeg - courseDeg)
  const xw = windKt * Math.sin(rel)
  if (Math.abs(xw) >= tasKt)
    return {
      ok: false,
      error: 'The crosswind component is at least your true airspeed — the course cannot be held.',
    }
  const wca = Math.asin(xw / tasKt)
  const gs = tasKt * Math.cos(wca) - windKt * Math.cos(rel)
  if (gs <= 0)
    return { ok: false, error: 'The headwind is at least your true airspeed — no progress along the course.' }
  const wcaDeg = clean(deg(wca))
  return { ok: true, wcaDeg, headingDeg: norm360(courseDeg + wcaDeg), groundSpeedKt: clean(gs) }
}

export function trueAirspeed(i: {
  casKt: number
  pressureAltFt: number
  oatC: number
}): { ok: true; tasKt: number; mach: number } | Fail {
  const { casKt, pressureAltFt: h, oatC } = i
  if (!finite(casKt, h, oatC)) return { ok: false, error: 'Enter numbers for every field.' }
  if (casKt <= 0) return { ok: false, error: 'Calibrated airspeed must be greater than 0 kt.' }
  if (casKt >= A0_KT) return { ok: false, error: 'This calculator handles subsonic speeds only.' }
  const e = checkAlt(h) ?? checkTemp(oatC, 'Temperature')
  if (e) return { ok: false, error: e }
  const qc = P0_HPA * (Math.pow(1 + 0.2 * (casKt / A0_KT) ** 2, 3.5) - 1)
  const p = P0_HPA * pressureRatio(h)
  const mach = Math.sqrt(5 * (Math.pow(qc / p + 1, 2 / 7) - 1))
  if (!finite(mach) || mach >= 1) return { ok: false, error: 'This calculator handles subsonic speeds only (Mach < 1).' }
  const tas = mach * A0_KT * Math.sqrt((oatC + 273.15) / T0_K)
  return { ok: true, tasKt: tas, mach }
}

export function crosswind(i: {
  runwayDeg: number
  windFromDeg: number
  windKt: number
}): { ok: true; headwindKt: number; crosswindKt: number; side: 'left' | 'right' | 'none' } | Fail {
  const { runwayDeg, windFromDeg, windKt } = i
  if (!finite(runwayDeg, windFromDeg, windKt)) return { ok: false, error: 'Enter numbers for every field.' }
  if (windKt < 0) return { ok: false, error: 'Wind speed cannot be negative.' }
  const e = checkDeg(runwayDeg, 'Runway heading') ?? checkDeg(windFromDeg, 'Wind direction')
  if (e) return { ok: false, error: e }
  const rel = rad(windFromDeg - runwayDeg)
  const head = clean(windKt * Math.cos(rel))
  const cross = clean(windKt * Math.sin(rel))
  return {
    ok: true,
    headwindKt: head,
    crosswindKt: Math.abs(cross),
    side: cross > 0 ? 'right' : cross < 0 ? 'left' : 'none',
  }
}

export function cloudBase(i: {
  tempC: number
  dewC: number
}): { ok: true; baseFt: number; baseFt400: number; rhPct: number } | Fail {
  const { tempC, dewC } = i
  if (!finite(tempC, dewC)) return { ok: false, error: 'Enter numbers for every field.' }
  const e = checkTemp(tempC, 'Temperature') ?? checkTemp(dewC, 'Dewpoint')
  if (e) return { ok: false, error: e }
  if (dewC > tempC) return { ok: false, error: 'Dewpoint cannot be higher than the temperature.' }
  const spread = tempC - dewC
  const g = (t: number) => (17.625 * t) / (243.04 + t)
  const rh = 100 * Math.exp(g(dewC) - g(tempC))
  return { ok: true, baseFt: clean((spread / 2.5) * 1000), baseFt400: clean(spread * 400), rhPct: Math.min(100, rh) }
}

const HPA_PER_INHG = 33.8639

export function pressureAltitude(i: {
  elevationFt: number
  altimeter: number
  unit: 'inHg' | 'hPa'
}): { ok: true; pressureAltFt: number; ruleOfThumbFt: number } | Fail {
  const { elevationFt, altimeter, unit } = i
  if (!finite(elevationFt, altimeter)) return { ok: false, error: 'Enter numbers for every field.' }
  if (elevationFt < MIN_ALT_FT || elevationFt > MAX_ALT_FT)
    return {
      ok: false,
      error: `Field elevation must be between ${MIN_ALT_FT.toLocaleString('en-US')} and ${MAX_ALT_FT.toLocaleString('en-US')} ft.`,
    }
  const hPa = unit === 'inHg' ? altimeter * HPA_PER_INHG : altimeter
  if (unit === 'inHg' && (altimeter < 25 || altimeter > 32))
    return { ok: false, error: 'Altimeter setting must be between 25.00 and 32.00 inHg.' }
  if (unit === 'hPa' && (altimeter < 850 || altimeter > 1085))
    return { ok: false, error: 'Altimeter setting must be between 850 and 1085 hPa.' }
  const pa = elevationFt + (1 - Math.pow(hPa / P0_HPA, 0.190284)) * 145366.45
  const inHg = hPa / HPA_PER_INHG
  return { ok: true, pressureAltFt: clean(pa), ruleOfThumbFt: clean(elevationFt + (29.92 - inHg) * 1000) }
}

const LB_PER_GAL = { avgas: 6, jeta: 6.7 } as const
const L_PER_GAL = 3.78541

export function flightTimeFuel(i: {
  distanceNm: number
  groundSpeedKt: number
  burnPerHour: number
  reserveMin: number
  fuel: 'avgas' | 'jeta'
  unit: 'gal' | 'L' | 'lb'
}): { ok: true; minutes: number; tripFuel: number; reserveFuel: number; totalFuel: number; totalLb: number } | Fail {
  const { distanceNm, groundSpeedKt, burnPerHour, reserveMin, fuel, unit } = i
  if (!finite(distanceNm, groundSpeedKt, burnPerHour, reserveMin))
    return { ok: false, error: 'Enter numbers for every field.' }
  if (groundSpeedKt <= 0) return { ok: false, error: 'Ground speed must be greater than 0 kt.' }
  if (distanceNm < 0) return { ok: false, error: 'Distance cannot be negative.' }
  if (burnPerHour < 0) return { ok: false, error: 'Fuel burn cannot be negative.' }
  if (reserveMin < 0) return { ok: false, error: 'Reserve time cannot be negative.' }
  const minutes = (distanceNm / groundSpeedKt) * 60
  const tripFuel = (burnPerHour * minutes) / 60
  const reserveFuel = (burnPerHour * reserveMin) / 60
  const totalFuel = tripFuel + reserveFuel
  const totalLb =
    unit === 'lb' ? totalFuel : unit === 'gal' ? totalFuel * LB_PER_GAL[fuel] : (totalFuel / L_PER_GAL) * LB_PER_GAL[fuel]
  return { ok: true, minutes, tripFuel, reserveFuel, totalFuel, totalLb }
}

export type WbRow = { item: string; weight: number; arm: number }

export function weightBalance(
  rows: WbRow[],
  env: { minCg: number; maxCg: number; maxWeight: number },
): { ok: true; totalWeight: number; totalMoment: number; cg: number; within: boolean; reasons: string[] } | Fail {
  if (rows.length === 0) return { ok: false, error: 'Add at least one item.' }
  for (const r of rows) {
    const name = r.item.trim() || 'Each item'
    if (!finite(r.weight, r.arm)) return { ok: false, error: `${name}: enter a number for weight and arm.` }
    if (r.weight < 0) return { ok: false, error: `${name}: weight cannot be negative.` }
  }
  const { minCg, maxCg, maxWeight } = env
  if (!finite(minCg, maxCg, maxWeight)) return { ok: false, error: 'Enter numbers for the envelope limits.' }
  if (minCg > maxCg) return { ok: false, error: 'Forward CG limit must not be greater than the aft limit.' }
  if (maxWeight <= 0) return { ok: false, error: 'Maximum weight must be greater than 0.' }
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0)
  if (totalWeight <= 0) return { ok: false, error: 'Total weight must be greater than 0.' }
  const totalMoment = rows.reduce((s, r) => s + r.weight * r.arm, 0)
  const cg = totalMoment / totalWeight
  const reasons: string[] = []
  if (totalWeight > maxWeight) reasons.push(`Total weight is over the maximum by ${+(totalWeight - maxWeight).toFixed(2)}.`)
  if (cg < minCg) reasons.push(`CG is forward of the limit by ${+(minCg - cg).toFixed(2)}.`)
  if (cg > maxCg) reasons.push(`CG is aft of the limit by ${+(cg - maxCg).toFixed(2)}.`)
  return { ok: true, totalWeight, totalMoment, cg, within: reasons.length === 0, reasons }
}
