// METAR / SPECI and TAF decoder. Pure, synchronous, no network.
// Every input group becomes a Row (raw group kept); groups we do not understand are
// shown as "Not decoded" rather than dropped.

export type Row = { group: string; label: string; meaning: string }
export type FlightCat = 'VFR' | 'MVFR' | 'IFR' | 'LIFR'
export type TafPeriod = { kind: 'BASE' | 'FM' | 'TEMPO' | 'BECMG' | 'PROB'; from: string; to: string; prob?: number; rows: Row[] }

type MetarResult =
  | { ok: true; station: string; rows: Row[]; category: FlightCat | null; remarks: string }
  | { ok: false; error: string }
type TafResult =
  | { ok: true; station: string; issued: string; valid: string; periods: TafPeriod[] }
  | { ok: false; error: string }

/** FAA flight category from ceiling (ft AGL) and visibility (statute miles); null = unlimited / unknown. */
export function flightCategory(ceilingFt: number | null, visSm: number | null): FlightCat {
  const c = ceilingFt ?? Infinity
  const v = visSm ?? Infinity
  if (c < 500 || v < 1) return 'LIFR'
  if (c < 1000 || v < 3) return 'IFR'
  if (c <= 3000 || v <= 5) return 'MVFR'
  return 'VFR'
}

/* ---- formatting helpers ---------------------------------------------------- */

const M_PER_SM = 1609.344
const HPA_PER_INHG = 33.8639
const fmtInt = (n: number) => n.toLocaleString('en-US')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function ordinal(d: number): string {
  const t = d % 100
  if (t >= 11 && t <= 13) return `${d}th`
  return d + (['th', 'st', 'nd', 'rd'][d % 10] ?? 'th')
}
const dayTime = (dd: string, hh: string, mm = '00') => `${ordinal(Number(dd))} ${hh}:${mm}`
const temp = (s: string) => {
  const n = Number(s.replace(/^M/, ''))
  return `${s.startsWith('M') && n !== 0 ? '−' : ''}${n} °C`
}

function tokenize(text: string): string[] {
  return text
    .toUpperCase()
    .split(/\s+/)
    .map((t) => t.replace(/=+$/, ''))
    .filter(Boolean)
}

/* ---- weather (WMO 4678) ---------------------------------------------------- */

const DESC: Record<string, string> = {
  MI: 'shallow', BC: 'patches of', PR: 'partial', DR: 'low drifting', BL: 'blowing', FZ: 'freezing',
}
const PHEN: Record<string, string> = {
  DZ: 'drizzle', RA: 'rain', SN: 'snow', SG: 'snow grains', IC: 'ice crystals', PL: 'ice pellets',
  GR: 'hail', GS: 'small hail', UP: 'unknown precipitation', BR: 'mist', FG: 'fog', FU: 'smoke',
  VA: 'volcanic ash', DU: 'widespread dust', SA: 'sand', HZ: 'haze', PY: 'spray', PO: 'dust or sand whirls',
  SQ: 'squalls', FC: 'funnel cloud', SS: 'sandstorm', DS: 'duststorm',
}
const WX_RE = new RegExp(
  `^(RE)?(-|\\+|VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?((?:${Object.keys(PHEN).join('|')})*)$`,
)

function decodeWeather(g: string): { label: string; meaning: string } | null {
  const m = WX_RE.exec(g)
  if (!m) return null
  const [, re, int, desc, phenStr] = m
  if (!desc && !phenStr) return null
  const names = (phenStr.match(/../g) ?? []).map((p) => PHEN[p])
  const list = names.join(' and ')
  let s: string
  if (int === '+' && phenStr === 'FC' && !desc) s = 'tornado or waterspout'
  else if (desc === 'TS') s = 'thunderstorm' + (list ? ` with ${list}` : '')
  else if (desc === 'SH') s = list ? `showers of ${list}` : 'showers'
  else if (desc) s = DESC[desc] + (list ? ` ${list}` : '')
  else s = list
  if (int === '-') s = `light ${s}`
  else if (int === '+' && !s.startsWith('tornado')) s = `heavy ${s}`
  else if (int === 'VC') s = `${s} in the vicinity`
  return re ? { label: 'Recent weather', meaning: `Recent ${s}` } : { label: 'Weather', meaning: cap(s) }
}

/* ---- single-group decoder shared by METAR and TAF -------------------------- */

type Decoded = { row: Row; n: number; visSm?: number; ceilFt?: number; sky?: boolean }

const CLOUD: Record<string, string> = { FEW: 'Few', SCT: 'Scattered', BKN: 'Broken', OVC: 'Overcast' }
const CLOUD_TYPE: Record<string, string> = { CB: 'cumulonimbus', TCU: 'towering cumulus' }
const SKY: Record<string, string> = {
  NSC: 'No significant cloud',
  NCD: 'No cloud detected',
  SKC: 'Sky clear',
  CLR: 'Clear below 12,000 ft (automated station)',
}
const FIXED: Record<string, [string, string]> = {
  AUTO: ['Report modifier', 'Automated report, no human observer'],
  COR: ['Report modifier', 'Corrected report'],
  AMD: ['Report modifier', 'Amended forecast'],
  NIL: ['Report modifier', 'Missing report'],
  NSW: ['Weather', 'No significant weather'],
  NOSIG: ['Trend', 'No significant change expected'],
}
const SPEED_UNIT: Record<string, string> = { KT: 'kt', MPS: 'm/s', KMH: 'km/h' }

function smText(prefix: string, label: string, value: number): string {
  const unit = value > 1 ? 'statute miles' : 'statute mile'
  const pre = prefix === 'P' ? 'More than ' : prefix === 'M' ? 'Less than ' : ''
  return `${pre}${label} ${unit}`
}

function decodeOne(tokens: string[], i: number): Decoded {
  const g = tokens[i]
  const one = (label: string, meaning: string, extra: Partial<Decoded> = {}): Decoded => ({
    row: { group: g, label, meaning },
    n: 1,
    ...extra,
  })
  let m: RegExpExecArray | null

  if (FIXED[g]) return one(...FIXED[g])
  if (SKY[g]) return one('Cloud', SKY[g], { sky: true })
  if (g === 'CAVOK')
    return one(
      'Visibility and cloud',
      'Ceiling and visibility OK — visibility 10 km or more, no cloud below 5,000 ft, no cumulonimbus, no significant weather',
      { visSm: 10000 / M_PER_SM, sky: true },
    )

  if ((m = /^(\d{2})(\d{2})(\d{2})Z$/.exec(g))) return one('Observation time', `${ordinal(Number(m[1]))}, ${m[2]}:${m[3]} UTC`)

  if ((m = /^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS|KMH)$/.exec(g))) {
    const [, dir, spd, gust, u] = m
    const unit = SPEED_UNIT[u]
    if (Number(spd) === 0 && !gust) return one('Wind', 'Calm')
    const head = dir === 'VRB' ? `Variable at ${Number(spd)} ${unit}` : `From ${dir}° at ${Number(spd)} ${unit}`
    return one('Wind', head + (gust ? `, gusting ${Number(gust)} ${unit}` : ''))
  }
  if ((m = /^(\d{3})V(\d{3})$/.exec(g))) return one('Wind variability', `Direction varies between ${m[1]}° and ${m[2]}°`)

  if ((m = /^WS(\d{3})\/(\d{3})(\d{2,3})KT$/.exec(g)))
    return one('Wind shear', `Low-level wind shear at ${fmtInt(Number(m[1]) * 100)} ft: from ${m[2]}° at ${Number(m[3])} kt`)

  // visibility, statute miles: "1 1/2SM" spans two tokens
  if (/^\d$/.test(g) && (m = /^(\d)\/(\d)SM$/.exec(tokens[i + 1] ?? ''))) {
    const v = Number(g) + Number(m[1]) / Number(m[2])
    return { row: { group: `${g} ${tokens[i + 1]}`, label: 'Visibility', meaning: smText('', `${g} ${m[1]}/${m[2]}`, v) }, n: 2, visSm: v }
  }
  if ((m = /^([PM])?(?:(\d+)\/(\d+)|(\d+))SM$/.exec(g))) {
    const v = m[4] !== undefined ? Number(m[4]) : Number(m[2]) / Number(m[3])
    const label = m[4] !== undefined ? m[4].replace(/^0+(?=\d)/, '') : `${m[2]}/${m[3]}`
    return one('Visibility', smText(m[1] ?? '', label, v), { visSm: v })
  }
  if ((m = /^(\d{4})(NDV|N|NE|E|SE|S|SW|W|NW)?$/.exec(g))) {
    const metres = Number(m[1])
    const dir = m[2] && m[2] !== 'NDV' ? ` towards ${m[2]}` : ''
    const meaning = metres === 9999 ? '10 km or more' : `${fmtInt(metres)} m${dir}`
    return one('Visibility', meaning, { visSm: (metres === 9999 ? 10000 : metres) / M_PER_SM })
  }

  if ((m = /^R(\d{2}[LCR]?)\/([PM])?(\d{4})(?:V([PM])?(\d{4}))?(FT)?\/?([UDN])?$/.exec(g))) {
    const [, rwy, p1, v1, p2, v2, ft, trend] = m
    const unit = ft ? 'ft' : 'm'
    const val = (p: string | undefined, v: string) =>
      `${p === 'P' ? 'more than ' : p === 'M' ? 'less than ' : ''}${fmtInt(Number(v))} ${unit}`
    let s = `Runway ${rwy}: ${val(p1, v1)}`
    if (v2) s = `Runway ${rwy}: varying ${val(p1, v1)} to ${val(p2, v2)}`
    if (trend) s += { U: ', rising', D: ', falling', N: ', no change' }[trend]
    return one('Runway visual range', s)
  }

  if ((m = /^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU|\/\/\/)?$/.exec(g))) {
    const [, cov, h, type] = m
    const ft = h === '///' ? null : Number(h) * 100
    let s = `${CLOUD[cov]} at ${ft === null ? 'unknown height' : `${fmtInt(ft)} ft`}`
    if (type && CLOUD_TYPE[type]) s += ` (${CLOUD_TYPE[type]})`
    const ceil = (cov === 'BKN' || cov === 'OVC') && ft !== null ? ft : undefined
    return one('Cloud', s, { ceilFt: ceil, sky: true })
  }
  if ((m = /^VV(\d{3}|\/\/\/)$/.exec(g))) {
    if (m[1] === '///') return one('Vertical visibility', 'Sky obscured, vertical visibility not reported', { sky: true })
    const ft = Number(m[1]) * 100
    return one('Vertical visibility', `Vertical visibility ${fmtInt(ft)} ft`, { ceilFt: ft, sky: true })
  }

  const wx = decodeWeather(g)
  if (wx) return one(wx.label, wx.meaning)

  if ((m = /^(M?\d{2})\/(M?\d{2})?$/.exec(g)))
    return one('Temperature / dew point', `Temperature ${temp(m[1])}` + (m[2] ? `, dew point ${temp(m[2])}` : ''))
  if ((m = /^(TX|TN)(M?\d{2})\/(\d{2})(\d{2})Z$/.exec(g)))
    return one(
      m[1] === 'TX' ? 'Maximum temperature' : 'Minimum temperature',
      `${m[1] === 'TX' ? 'Maximum' : 'Minimum'} ${temp(m[2])} at ${dayTime(m[3], m[4])} UTC`,
    )

  if ((m = /^A(\d{4})$/.exec(g))) {
    const inHg = Number(m[1]) / 100
    return one('Altimeter', `${inHg.toFixed(2)} inHg (${(inHg * HPA_PER_INHG).toFixed(1)} hPa)`)
  }
  if ((m = /^Q(\d{4})$/.exec(g))) {
    const hpa = Number(m[1])
    return one('Altimeter', `${hpa} hPa (${(hpa / HPA_PER_INHG).toFixed(2)} inHg)`)
  }

  return one('Not decoded', g)
}

/* ---- METAR ----------------------------------------------------------------- */

const STATION_RE = /^[A-Z][A-Z0-9]{3}$/

export function decodeMetar(text: string): MetarResult {
  const t = tokenize(text)
  if (t.length === 0) return { ok: false, error: 'Paste a METAR to decode.' }
  const rows: Row[] = []
  let i = 0
  if (t[0] === 'METAR' || t[0] === 'SPECI') {
    rows.push({ group: t[0], label: 'Report type', meaning: t[0] === 'METAR' ? 'Routine weather report' : 'Special weather report' })
    i++
  }
  if (t[i] === 'COR') {
    rows.push({ group: 'COR', label: 'Correction', meaning: 'Corrected report' })
    i++
  }
  const station = t[i]
  if (!station || !STATION_RE.test(station))
    return { ok: false, error: 'Could not find a four-character station identifier (e.g. KJFK) at the start of the report.' }
  rows.push({ group: station, label: 'Station', meaning: station })
  i++

  let remarks = ''
  let trend = false
  let visSm: number | null = null
  let ceilFt: number | null = null
  let sawVis = false
  let sawSky = false

  while (i < t.length) {
    const g = t[i]
    if (g === 'RMK') {
      remarks = t.slice(i + 1).join(' ')
      rows.push({ group: t.slice(i).join(' '), label: 'Remarks', meaning: remarks || '(empty)' })
      break
    }
    if (g === 'TEMPO' || g === 'BECMG') {
      trend = true
      rows.push({ group: g, label: 'Trend', meaning: g === 'TEMPO' ? 'Temporary changes expected:' : 'Becoming:' })
      i++
      continue
    }
    let m: RegExpExecArray | null
    if (trend && (m = /^(FM|TL|AT)(\d{2})(\d{2})$/.exec(g))) {
      const word = { FM: 'From', TL: 'Until', AT: 'At' }[m[1] as 'FM' | 'TL' | 'AT']
      rows.push({ group: g, label: 'Trend time', meaning: `${word} ${m[2]}:${m[3]} UTC` })
      i++
      continue
    }
    const d = decodeOne(t, i)
    rows.push(d.row)
    i += d.n
    if (!trend) {
      if (d.visSm !== undefined) {
        sawVis = true
        // The first visibility group is the prevailing one; later ones are directional minimums.
        if (visSm === null) visSm = d.visSm
      }
      if (d.sky) sawSky = true
      if (d.ceilFt !== undefined) ceilFt = ceilFt === null ? d.ceilFt : Math.min(ceilFt, d.ceilFt)
    }
  }

  const category = sawVis || sawSky ? flightCategory(ceilFt, visSm) : null
  return { ok: true, station, rows, category, remarks }
}

/* ---- TAF ------------------------------------------------------------------- */

export function decodeTaf(text: string): TafResult {
  const t = tokenize(text)
  let i = 0
  if (t[i] === 'TAF') i++
  const head: Row[] = []
  while (t[i] === 'AMD' || t[i] === 'COR') {
    head.push(decodeOne(t, i).row)
    i++
  }
  const station = t[i]
  if (!station || !STATION_RE.test(station))
    return { ok: false, error: 'Could not find a four-character station identifier (e.g. KJFK) after “TAF”.' }
  i++

  let issued = ''
  let m: RegExpExecArray | null
  if ((m = /^(\d{2})(\d{2})(\d{2})Z$/.exec(t[i] ?? ''))) {
    issued = `${ordinal(Number(m[1]))}, ${m[2]}:${m[3]} UTC`
    i++
  }
  let vFrom = ''
  let vTo = ''
  if ((m = /^(\d{2})(\d{2})\/(\d{2})(\d{2})$/.exec(t[i] ?? ''))) {
    vFrom = dayTime(m[1], m[2])
    vTo = dayTime(m[3], m[4])
    i++
  }
  const valid = vFrom ? `${vFrom} to ${vTo} UTC` : ''

  const periods: TafPeriod[] = [{ kind: 'BASE', from: vFrom, to: vTo, rows: head }]
  const range = (g: string | undefined) => /^(\d{2})(\d{2})\/(\d{2})(\d{2})$/.exec(g ?? '')

  while (i < t.length) {
    const g = t[i]
    if ((m = /^FM(\d{2})(\d{2})(\d{2})$/.exec(g))) {
      periods.push({ kind: 'FM', from: dayTime(m[1], m[2], m[3]), to: vTo, rows: [] })
      i++
      continue
    }
    const prob = /^PROB(\d{2})$/.exec(g)
    if (g === 'TEMPO' || g === 'BECMG' || prob) {
      let j = i + 1
      if (prob && t[j] === 'TEMPO') j++
      const r = range(t[j])
      if (r) {
        const p: TafPeriod = {
          kind: prob ? 'PROB' : (g as 'TEMPO' | 'BECMG'),
          from: dayTime(r[1], r[2]),
          to: dayTime(r[3], r[4]),
          rows: [],
        }
        if (prob) p.prob = Number(prob[1])
        periods.push(p)
        i = j + 1
        continue
      }
    }
    const cur = periods[periods.length - 1]
    if (g === 'RMK') {
      cur.rows.push({ group: t.slice(i).join(' '), label: 'Remarks', meaning: t.slice(i + 1).join(' ') || '(empty)' })
      break
    }
    const d = decodeOne(t, i)
    cur.rows.push(d.row)
    i += d.n
  }

  // a base or FM period lasts until the next FM group (or the end of validity)
  const fms = periods.filter((p) => p.kind === 'BASE' || p.kind === 'FM')
  for (let k = 0; k < fms.length - 1; k++) fms[k].to = fms[k + 1].from

  return { ok: true, station, issued, valid, periods }
}
