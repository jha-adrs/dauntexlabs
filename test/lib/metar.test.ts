import { describe, it, expect } from 'vitest'
import { decodeMetar, decodeTaf, flightCategory, type Row } from '@/lib/metar'

const ok = <T extends { ok: boolean }>(r: T) => {
  if (!r.ok) throw new Error('expected ok: ' + JSON.stringify(r))
  return r as Extract<T, { ok: true }>
}
const meaningOf = (rows: Row[], group: string) => rows.find((r) => r.group === group)?.meaning
const groups = (rows: Row[]) => rows.map((r) => r.group).join(' ')

describe('decodeMetar', () => {
  it('decodes a US METAR (KJFK)', () => {
    const r = ok(decodeMetar('KJFK 121651Z 31015G25KT 10SM FEW050 SCT250 22/12 A3002 RMK AO2 SLP165'))
    expect(r.station).toBe('KJFK')
    expect(meaningOf(r.rows, '121651Z')).toBe('12th, 16:51 UTC')
    expect(meaningOf(r.rows, '31015G25KT')).toBe('From 310° at 15 kt, gusting 25 kt')
    expect(meaningOf(r.rows, '10SM')).toBe('10 statute miles')
    expect(meaningOf(r.rows, 'FEW050')).toBe('Few at 5,000 ft')
    expect(meaningOf(r.rows, 'SCT250')).toBe('Scattered at 25,000 ft')
    expect(meaningOf(r.rows, '22/12')).toBe('Temperature 22 °C, dew point 12 °C')
    expect(meaningOf(r.rows, 'A3002')).toBe('30.02 inHg (1016.6 hPa)')
    expect(r.category).toBe('VFR')
    expect(r.remarks).toBe('AO2 SLP165')
    expect(groups(r.rows)).toBe('KJFK 121651Z 31015G25KT 10SM FEW050 SCT250 22/12 A3002 RMK AO2 SLP165')
  })

  it('decodes an ICAO METAR with RVR, fog and vertical visibility (VIDP)', () => {
    const r = ok(decodeMetar('METAR VIDP 080530Z 00000KT 0800 R28/1200U FG VV002 12/12 Q1015 NOSIG'))
    expect(r.station).toBe('VIDP')
    expect(meaningOf(r.rows, '00000KT')).toBe('Calm')
    expect(meaningOf(r.rows, '0800')).toBe('800 m')
    expect(meaningOf(r.rows, 'R28/1200U')).toBe('Runway 28: 1,200 m, rising')
    expect(meaningOf(r.rows, 'FG')).toBe('Fog')
    expect(meaningOf(r.rows, 'VV002')).toBe('Vertical visibility 200 ft')
    expect(meaningOf(r.rows, 'Q1015')).toBe('1015 hPa (29.97 inHg)')
    expect(meaningOf(r.rows, 'NOSIG')).toBe('No significant change expected')
    expect(r.category).toBe('LIFR')
  })

  it('decodes variable wind direction and CAVOK (EGLL)', () => {
    const r = ok(decodeMetar('EGLL 081150Z 24008KT 200V280 CAVOK 18/09 Q1021'))
    expect(meaningOf(r.rows, '200V280')).toMatch(/200°.*280°/)
    expect(meaningOf(r.rows, 'CAVOK')).toMatch(/Ceiling and visibility OK/)
    expect(r.category).toBe('VFR')
  })

  it('decodes weather and CB cloud; ceiling 800 ft gives IFR', () => {
    const r = ok(decodeMetar('KXYZ 081200Z 18010KT 3SM -TSRA BR BKN008CB OVC015 20/18 A2990'))
    expect(meaningOf(r.rows, '-TSRA')).toBe('Light thunderstorm with rain')
    expect(meaningOf(r.rows, 'BR')).toBe('Mist')
    expect(meaningOf(r.rows, 'BKN008CB')).toBe('Broken at 800 ft (cumulonimbus)')
    expect(r.category).toBe('IFR')
  })

  it('shows unknown groups raw as "Not decoded" and drops nothing', () => {
    const input = 'KXYZ 081200Z 18010KT 9999 WS R27 //// ZZZZ SCT030 15/10 Q1012'
    const r = ok(decodeMetar(input))
    for (const g of ['WS', 'R27', '////', 'ZZZZ']) {
      const row = r.rows.find((x) => x.group === g)
      expect(row?.label, g).toBe('Not decoded')
      expect(row?.meaning).toBe(g)
    }
    expect(groups(r.rows)).toBe(input)
  })

  it('handles AUTO/COR, SPECI, "=" terminator and multi-line paste', () => {
    const r = ok(decodeMetar('SPECI KBOS 081254Z AUTO COR\n  VRB03KT 1 1/2SM\nM1/4SM SKC M05/M07 A2992='))
    expect(r.station).toBe('KBOS')
    expect(meaningOf(r.rows, 'SPECI')).toMatch(/Special/)
    expect(meaningOf(r.rows, 'AUTO')).toMatch(/Automated/)
    expect(meaningOf(r.rows, 'COR')).toMatch(/Corrected/)
    expect(meaningOf(r.rows, 'VRB03KT')).toBe('Variable at 3 kt')
    expect(meaningOf(r.rows, '1 1/2SM')).toBe('1 1/2 statute miles')
    expect(meaningOf(r.rows, 'M1/4SM')).toBe('Less than 1/4 statute mile')
    expect(meaningOf(r.rows, 'SKC')).toBe('Sky clear')
    expect(meaningOf(r.rows, 'M05/M07')).toBe('Temperature −5 °C, dew point −7 °C')
    expect(meaningOf(r.rows, 'A2992')).toMatch(/^29\.92 inHg/)
  })

  it('handles MPS wind, 9999, NSC/NCD/CLR, recent weather and TEMPO/BECMG trends', () => {
    const r = ok(decodeMetar('UUEE 081200Z 27005MPS 9999 NSC 05/01 Q1010 RERA TEMPO 3000 -SHRA BKN012 BECMG FM1400 NCD'))
    expect(meaningOf(r.rows, '27005MPS')).toBe('From 270° at 5 m/s')
    expect(meaningOf(r.rows, '9999')).toBe('10 km or more')
    expect(meaningOf(r.rows, 'NSC')).toBe('No significant cloud')
    expect(meaningOf(r.rows, 'NCD')).toBe('No cloud detected')
    expect(meaningOf(r.rows, 'RERA')).toBe('Recent rain')
    expect(r.rows.find((x) => x.group === 'TEMPO')?.label).toMatch(/Trend/)
    expect(r.rows.find((x) => x.group === 'BECMG')?.label).toMatch(/Trend/)
    expect(meaningOf(r.rows, '-SHRA')).toBe('Light showers of rain')
    // trend groups do not change the observed category
    expect(r.category).toBe('VFR')
    expect(meaningOf(ok(decodeMetar('KXYZ 081200Z 10SM CLR 10/05 A3000')).rows, 'CLR')).toMatch(/Clear/)
  })

  it('errors on empty input or a missing station', () => {
    expect(decodeMetar('   ').ok).toBe(false)
    expect(decodeMetar('121651Z 31015KT').ok).toBe(false)
  })
})

describe('flightCategory', () => {
  it('follows the FAA ceiling / visibility thresholds', () => {
    expect(flightCategory(400, null)).toBe('LIFR')
    expect(flightCategory(900, null)).toBe('IFR')
    expect(flightCategory(2500, null)).toBe('MVFR')
    expect(flightCategory(null, 4)).toBe('MVFR')
    expect(flightCategory(null, null)).toBe('VFR')
    expect(flightCategory(5000, 0.5)).toBe('LIFR')
  })
})

describe('decodeTaf', () => {
  const TAF =
    'TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250 FM081800 30012G20KT P6SM SCT050 TEMPO 0820/0824 3SM -SHRA BKN030 PROB30 0902/0906 1SM BR OVC004'

  it('splits the forecast into periods', () => {
    const r = ok(decodeTaf(TAF))
    expect(r.station).toBe('KJFK')
    expect(r.issued).toBe('8th, 11:30 UTC')
    expect(r.valid).toBe('8th 12:00 to 9th 18:00 UTC')
    expect(r.periods.map((p) => p.kind)).toEqual(['BASE', 'FM', 'TEMPO', 'PROB'])
    const [base, fm, tempo, prob] = r.periods
    expect(base.from).toBe('8th 12:00')
    expect(fm.from).toBe('8th 18:00')
    expect(fm.to).toBe('9th 18:00')
    expect(tempo.from).toBe('8th 20:00')
    expect(tempo.to).toBe('8th 24:00')
    expect(prob.prob).toBe(30)
    expect(prob.from).toBe('9th 02:00')
    expect(prob.to).toBe('9th 06:00')
    expect(meaningOf(base.rows, 'P6SM')).toBe('More than 6 statute miles')
    expect(meaningOf(fm.rows, '30012G20KT')).toBe('From 300° at 12 kt, gusting 20 kt')
    expect(meaningOf(prob.rows, 'OVC004')).toBe('Overcast at 400 ft')
  })

  it('keeps unknown groups and handles BECMG / multi-line / "="', () => {
    const r = ok(decodeTaf('TAF AMD EGLL 081100Z 0812/0918 24010KT 9999 SCT030\n BECMG 0815/0817 ZZZZ 4000 RA='))
    expect(r.periods.map((p) => p.kind)).toEqual(['BASE', 'BECMG'])
    expect(r.periods[1].rows.find((x) => x.group === 'ZZZZ')?.label).toBe('Not decoded')
  })

  it('errors on empty input', () => {
    expect(decodeTaf('').ok).toBe(false)
    expect(decodeTaf('TAF').ok).toBe(false)
  })
})
