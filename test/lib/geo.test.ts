import { describe, it, expect } from 'vitest'
import { parseGeo, toGeoJSON, toGPX, toKML, toCSV, stats, haversineKm, type GeoData } from '@/lib/geo'

const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="51.5" lon="-0.1"><name>Start &amp; finish</name><ele>12</ele></wpt>
  <trk>
    <name>Morning ride</name>
    <trkseg>
      <trkpt lat="0" lon="0"><ele>100</ele><time>2026-01-01T10:00:00Z</time></trkpt>
      <trkpt lat="0" lon="0.01"><ele>150</ele><time>2026-01-01T10:05:00Z</time></trkpt>
      <trkpt lat="0" lon="0.02"><ele>120</ele><time>2026-01-01T10:10:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`

function must<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error('expected ok: ' + JSON.stringify(r))
  return r as Extract<T, { ok: true }>
}

describe('haversineKm', () => {
  it('one degree of longitude on the equator ≈ 111.19 km', () => {
    // R = 6371.0088 km (IUGG mean Earth radius) → 2πR/360 = 111.195 km
    expect(haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111.19, 1)
  })
})

describe('parseGeo — GPX', () => {
  it('reads tracks, segments, elevation, time and waypoints', () => {
    const r = must(parseGeo(GPX, 'auto'))
    expect(r.kind).toBe('gpx')
    expect(r.tracks).toHaveLength(1)
    expect(r.tracks[0].name).toBe('Morning ride')
    expect(r.tracks[0].segments[0]).toHaveLength(3)
    expect(r.tracks[0].segments[0][1]).toEqual({ lat: 0, lon: 0.01, ele: 150, time: '2026-01-01T10:05:00Z' })
    expect(r.waypoints).toEqual([{ name: 'Start & finish', lat: 51.5, lon: -0.1, ele: 12 }])
  })

  it('treats a route (rte) as a single-segment track', () => {
    const r = must(parseGeo('<gpx><rte><name>R</name><rtept lat="1" lon="2"/><rtept lat="1.5" lon="2.5"/></rte></gpx>', 'gpx'))
    expect(r.tracks[0].name).toBe('R')
    expect(r.tracks[0].segments[0]).toEqual([{ lat: 1, lon: 2 }, { lat: 1.5, lon: 2.5 }])
  })

  it('malformed XML → ok:false', () => {
    const r = parseGeo('<gpx><trk><trkseg><trkpt lat="1" lon="2"></trkseg></gpx>', 'auto')
    expect(r.ok).toBe(false)
  })

  it('valid XML with no points → ok:false', () => {
    expect(parseGeo('<gpx></gpx>', 'gpx').ok).toBe(false)
  })
})

describe('parseGeo — KML', () => {
  it('reads LineString coordinates without altitude, and Points', () => {
    const kml = `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
      <Placemark><name>Walk</name><LineString><coordinates>
        -0.1,51.5 -0.11,51.51
        -0.12,51.52
      </coordinates></LineString></Placemark>
      <Placemark><name>Cafe</name><Point><coordinates>-0.2,51.6,30</coordinates></Point></Placemark>
    </Document></kml>`
    const r = must(parseGeo(kml, 'auto'))
    expect(r.kind).toBe('kml')
    expect(r.tracks[0].name).toBe('Walk')
    expect(r.tracks[0].segments[0]).toEqual([
      { lat: 51.5, lon: -0.1 },
      { lat: 51.51, lon: -0.11 },
      { lat: 51.52, lon: -0.12 },
    ])
    expect(r.waypoints).toEqual([{ name: 'Cafe', lat: 51.6, lon: -0.2, ele: 30 }])
  })

  it('reads altitude when present', () => {
    const r = must(parseGeo('<kml><Placemark><LineString><coordinates>1,2,3 4,5,6</coordinates></LineString></Placemark></kml>', 'kml'))
    expect(r.tracks[0].segments[0]).toEqual([{ lat: 2, lon: 1, ele: 3 }, { lat: 5, lon: 4, ele: 6 }])
  })

  it('reads gx:Track with when/coord pairs', () => {
    const kml = `<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"><Placemark><gx:Track>
      <when>2026-01-01T10:00:00Z</when><when>2026-01-01T10:01:00Z</when>
      <gx:coord>1 2 3</gx:coord><gx:coord>1.001 2 4</gx:coord>
    </gx:Track></Placemark></kml>`
    const r = must(parseGeo(kml, 'auto'))
    expect(r.tracks[0].segments[0]).toEqual([
      { lat: 2, lon: 1, ele: 3, time: '2026-01-01T10:00:00Z' },
      { lat: 2, lon: 1.001, ele: 4, time: '2026-01-01T10:01:00Z' },
    ])
  })
})

describe('parseGeo — GeoJSON', () => {
  it('reads LineString and MultiLineString features', () => {
    const gj = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { name: 'A' }, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1, 10]] } },
        {
          type: 'Feature',
          properties: { name: 'B' },
          geometry: { type: 'MultiLineString', coordinates: [[[0, 0], [0, 1]], [[2, 2], [3, 3]]] },
        },
        { type: 'Feature', properties: { name: 'P' }, geometry: { type: 'Point', coordinates: [5, 6] } },
      ],
    })
    const r = must(parseGeo(gj, 'auto'))
    expect(r.kind).toBe('geojson')
    expect(r.tracks.map((t) => t.name)).toEqual(['A', 'B'])
    expect(r.tracks[0].segments[0]).toEqual([{ lat: 0, lon: 0 }, { lat: 1, lon: 1, ele: 10 }])
    expect(r.tracks[1].segments).toHaveLength(2)
    expect(r.waypoints).toEqual([{ name: 'P', lat: 6, lon: 5 }])
  })

  it('accepts a bare geometry', () => {
    const r = must(parseGeo('{"type":"LineString","coordinates":[[0,0],[0,1]]}', 'geojson'))
    expect(r.tracks[0].segments[0]).toHaveLength(2)
  })

  it('invalid JSON → ok:false', () => {
    expect(parseGeo('{"type":', 'auto').ok).toBe(false)
  })

  it('unrecognised text → ok:false', () => {
    expect(parseGeo('hello world', 'auto').ok).toBe(false)
  })
})

describe('round trips', () => {
  it('GPX → GeoJSON → GPX preserves points (incl. ele + time) and waypoints', () => {
    const a = must(parseGeo(GPX, 'auto'))
    const b = must(parseGeo(toGeoJSON(a), 'auto'))
    const c = must(parseGeo(toGPX(b), 'auto'))
    expect(c.kind).toBe('gpx')
    expect(c.tracks).toEqual(a.tracks)
    expect(c.waypoints).toEqual(a.waypoints)
  })

  it('GPX → KML → GPX preserves positions and elevation', () => {
    const a = must(parseGeo(GPX, 'auto'))
    const k = must(parseGeo(toKML(a), 'auto'))
    expect(k.kind).toBe('kml')
    const strip = (d: GeoData) => d.tracks.map((t) => t.segments.map((s) => s.map(({ lat, lon, ele }) => ({ lat, lon, ele }))))
    expect(strip(k)).toEqual(strip(a))
    expect(k.tracks[0].name).toBe('Morning ride')
    expect(k.waypoints[0].name).toBe('Start & finish')
  })

  it('escapes XML special characters in names', () => {
    const out = toGPX({ tracks: [{ name: 'a<b>&"c"', segments: [[{ lat: 1, lon: 2 }]] }], waypoints: [] })
    expect(out).toContain('a&lt;b&gt;&amp;')
    expect(must(parseGeo(out, 'auto')).tracks[0].name).toBe('a<b>&"c"')
  })
})

describe('toCSV', () => {
  it('writes track,segment,index,lat,lon,ele,time rows (1-based, quoted when needed)', () => {
    const csv = toCSV({
      tracks: [{ name: 'Ride, one', segments: [[{ lat: 1, lon: 2, ele: 3, time: 'T' }, { lat: 4, lon: 5 }]] }],
      waypoints: [],
    })
    expect(csv.split('\n')).toEqual([
      'track,segment,index,lat,lon,ele,time',
      '"Ride, one",1,1,1,2,3,T',
      '"Ride, one",1,2,4,5,,',
    ])
  })
})

describe('stats', () => {
  it('elevation 100 → 150 → 120 gives gain 50, loss 30', () => {
    const r = must(parseGeo(GPX, 'auto'))
    const s = stats(r.tracks[0])
    expect(s.elevationGainM).toBe(50)
    expect(s.elevationLossM).toBe(30)
    expect(s.points).toBe(3)
    // 0.02° of longitude on the equator
    expect(s.distanceKm).toBeCloseTo(2.2239, 3)
    expect(s.durationS).toBe(600)
    expect(s.movingS).toBe(600)
    expect(s.bounds).toEqual({ minLat: 0, minLon: 0, maxLat: 0, maxLon: 0.02 })
  })

  it('ignores elevation wobble under the 2 m threshold', () => {
    const seg = [100, 101, 100, 101.5, 100, 101].map((ele, i) => ({ lat: 0, lon: i * 0.001, ele }))
    const s = stats({ name: '', segments: [seg] })
    expect(s.elevationGainM).toBe(0)
    expect(s.elevationLossM).toBe(0)
  })

  it('does not measure distance across segment gaps', () => {
    const s = stats({ name: '', segments: [[{ lat: 0, lon: 0 }], [{ lat: 0, lon: 1 }]] })
    expect(s.distanceKm).toBe(0)
  })

  it('excludes stopped intervals from moving time and omits durations without times', () => {
    const s = stats({
      name: '',
      segments: [[
        { lat: 0, lon: 0, time: '2026-01-01T10:00:00Z' },
        { lat: 0, lon: 0, time: '2026-01-01T10:10:00Z' }, // stopped 10 min
        { lat: 0, lon: 0.01, time: '2026-01-01T10:15:00Z' },
      ]],
    })
    expect(s.durationS).toBe(900)
    expect(s.movingS).toBe(300)
    expect(stats({ name: '', segments: [[{ lat: 0, lon: 0 }, { lat: 0, lon: 1 }]] }).durationS).toBeUndefined()
  })

  it('empty track has null bounds', () => {
    expect(stats({ name: '', segments: [] }).bounds).toBeNull()
  })
})
