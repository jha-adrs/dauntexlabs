/**
 * GPX / KML / GeoJSON parsing, conversion and track statistics — pure, in-memory, no network.
 *
 * Model: a file becomes `{ tracks, waypoints }`. A track keeps its segments (GPX <trkseg>,
 * KML MultiGeometry parts, GeoJSON MultiLineString parts) so distance is never measured
 * across a recording gap. GPX routes (<rte>) are read as single-segment tracks.
 *
 * Timestamps survive GeoJSON via the de-facto `properties.coordTimes` convention
 * (string[] for a LineString, string[][] for a MultiLineString). KML output uses plain
 * LineStrings, so timestamps are dropped there.
 */

export interface GeoPoint {
  lat: number
  lon: number
  ele?: number
  time?: string
}
export interface GeoTrack {
  name: string
  segments: GeoPoint[][]
}
export interface GeoWaypoint extends GeoPoint {
  name?: string
}
export interface GeoData {
  tracks: GeoTrack[]
  waypoints: GeoWaypoint[]
}
export type GeoKind = 'gpx' | 'kml' | 'geojson'
export type ParseResult = ({ ok: true; kind: GeoKind } & GeoData) | { ok: false; error: string }

export interface GeoBounds {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}
export interface TrackStats {
  points: number
  distanceKm: number
  elevationGainM: number
  elevationLossM: number
  /** First to last timestamp, seconds. Undefined when fewer than two points carry a time. */
  durationS?: number
  /** Sum of intervals with speed ≥ MOVING_SPEED_MS, seconds. Undefined without times. */
  movingS?: number
  bounds: GeoBounds | null
}

/** IUGG mean Earth radius. */
export const EARTH_RADIUS_KM = 6371.0088
/**
 * Elevation noise threshold: a climb/descent is only counted once the elevation has moved
 * at least this far from the last counted level (simple hysteresis). Filters GPS jitter
 * without discarding slow, steady climbs.
 */
export const ELEVATION_THRESHOLD_M = 2
/** Intervals slower than this (1.8 km/h) count as stopped for moving time. */
export const MOVING_SPEED_MS = 0.5

/* ---- geometry ------------------------------------------------------------ */

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function stats(track: GeoTrack): TrackStats {
  let points = 0
  let distanceKm = 0
  let gain = 0
  let loss = 0
  let movingS = 0
  let firstT = Infinity
  let lastT = -Infinity
  let timed = 0
  let bounds: GeoBounds | null = null

  for (const seg of track.segments) {
    let ref: number | undefined // last counted elevation level
    for (let i = 0; i < seg.length; i++) {
      const p = seg[i]
      points++
      if (!bounds) bounds = { minLat: p.lat, minLon: p.lon, maxLat: p.lat, maxLon: p.lon }
      else {
        bounds.minLat = Math.min(bounds.minLat, p.lat)
        bounds.minLon = Math.min(bounds.minLon, p.lon)
        bounds.maxLat = Math.max(bounds.maxLat, p.lat)
        bounds.maxLon = Math.max(bounds.maxLon, p.lon)
      }

      if (p.ele !== undefined) {
        if (ref === undefined) ref = p.ele
        else if (p.ele - ref >= ELEVATION_THRESHOLD_M) {
          gain += p.ele - ref
          ref = p.ele
        } else if (ref - p.ele >= ELEVATION_THRESHOLD_M) {
          loss += ref - p.ele
          ref = p.ele
        }
      }

      const t = timeOf(p)
      if (t !== undefined) {
        timed++
        firstT = Math.min(firstT, t)
        lastT = Math.max(lastT, t)
      }

      if (i > 0) {
        const prev = seg[i - 1]
        const d = haversineKm(prev, p)
        distanceKm += d
        const pt = timeOf(prev)
        if (t !== undefined && pt !== undefined && t > pt) {
          const dt = (t - pt) / 1000
          if ((d * 1000) / dt >= MOVING_SPEED_MS) movingS += dt
        }
      }
    }
  }

  const out: TrackStats = {
    points,
    distanceKm,
    elevationGainM: round(gain),
    elevationLossM: round(loss),
    bounds,
  }
  if (timed >= 2) {
    out.durationS = (lastT - firstT) / 1000
    out.movingS = movingS
  }
  return out
}

function timeOf(p: GeoPoint): number | undefined {
  if (!p.time) return undefined
  const t = Date.parse(p.time)
  return Number.isFinite(t) ? t : undefined
}

function round(n: number, dp = 6): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/* ---- parsing ------------------------------------------------------------- */

export function detectKind(text: string): GeoKind | null {
  const t = text.trimStart()
  if (t.startsWith('{') || t.startsWith('[')) return 'geojson'
  const head = t.slice(0, 4096)
  if (/<(\w+:)?gpx[\s>]/i.test(head)) return 'gpx'
  if (/<(\w+:)?kml[\s>]/i.test(head)) return 'kml'
  return null
}

export function parseGeo(text: string, kind: GeoKind | 'auto' = 'auto'): ParseResult {
  if (!text.trim()) return { ok: false, error: 'Nothing to convert — add a GPX, KML or GeoJSON file.' }
  const k = kind === 'auto' ? detectKind(text) : kind
  if (!k) return { ok: false, error: 'Could not recognise this as GPX, KML or GeoJSON.' }
  let data: GeoData | string
  try {
    data = k === 'geojson' ? parseGeoJSON(text) : parseXml(text, k)
  } catch {
    data = `Could not read this ${label(k)} file.`
  }
  if (typeof data === 'string') return { ok: false, error: data }
  const hasPoints = data.waypoints.length > 0 || data.tracks.some((t) => t.segments.some((s) => s.length > 0))
  if (!hasPoints) return { ok: false, error: `No tracks, routes or waypoints found in this ${label(k)} file.` }
  return { ok: true, kind: k, ...data }
}

function label(k: GeoKind) {
  return k === 'geojson' ? 'GeoJSON' : k.toUpperCase()
}

function validLatLon(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
}

function num(s: string | null | undefined): number | undefined {
  if (s == null || s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

function point(lat: number, lon: number, ele?: number, time?: string): GeoPoint {
  const p: GeoPoint = { lat, lon }
  if (ele !== undefined) p.ele = ele
  if (time) p.time = time
  return p
}

/* XML helpers — match on localName so default namespaces and prefixes (gx:) both work. */
function kids(el: Element, name: string): Element[] {
  return Array.from(el.children).filter((c) => c.localName === name)
}
function kid(el: Element, name: string): Element | undefined {
  return kids(el, name)[0]
}
function kidText(el: Element, name: string): string | undefined {
  const t = kid(el, name)?.textContent?.trim()
  return t ? t : undefined
}
function all(el: Element | Document, name: string): Element[] {
  return Array.from(el.getElementsByTagNameNS('*', name))
}

function parseXml(text: string, k: 'gpx' | 'kml'): GeoData | string {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0 || !doc.documentElement) {
    return `This ${label(k)} file is not well-formed XML.`
  }
  return k === 'gpx' ? readGpx(doc) : readKml(doc)
}

function gpxPoint(el: Element): GeoPoint | null {
  const lat = Number(el.getAttribute('lat'))
  const lon = Number(el.getAttribute('lon'))
  if (el.getAttribute('lat') === null || el.getAttribute('lon') === null || !validLatLon(lat, lon)) return null
  return point(lat, lon, num(kidText(el, 'ele')), kidText(el, 'time'))
}

function readGpx(doc: Document): GeoData {
  const tracks: GeoTrack[] = []
  const waypoints: GeoWaypoint[] = []
  for (const w of all(doc, 'wpt')) {
    const p = gpxPoint(w)
    if (!p) continue
    const name = kidText(w, 'name')
    waypoints.push(name ? { name, ...p } : p)
  }
  for (const trk of all(doc, 'trk')) {
    const segments = kids(trk, 'trkseg').map((s) =>
      kids(s, 'trkpt').map(gpxPoint).filter((p): p is GeoPoint => p !== null),
    )
    tracks.push({ name: kidText(trk, 'name') ?? '', segments })
  }
  for (const rte of all(doc, 'rte')) {
    const seg = kids(rte, 'rtept').map(gpxPoint).filter((p): p is GeoPoint => p !== null)
    tracks.push({ name: kidText(rte, 'name') ?? '', segments: [seg] })
  }
  return { tracks, waypoints }
}

/** KML `<coordinates>`: whitespace-separated `lon,lat[,alt]` tuples. */
function kmlCoords(text: string | null): GeoPoint[] {
  const out: GeoPoint[] = []
  for (const tuple of (text ?? '').trim().split(/\s+/)) {
    if (!tuple) continue
    const [lon, lat, alt] = tuple.split(',').map((s) => num(s))
    if (lat === undefined || lon === undefined || !validLatLon(lat, lon)) continue
    out.push(point(lat, lon, alt))
  }
  return out
}

function readKml(doc: Document): GeoData {
  const tracks: GeoTrack[] = []
  const waypoints: GeoWaypoint[] = []
  for (const pm of all(doc, 'Placemark')) {
    const name = kidText(pm, 'name')
    const segments: GeoPoint[][] = []
    for (const ls of all(pm, 'LineString')) {
      const c = all(ls, 'coordinates')[0]
      const seg = kmlCoords(c ? c.textContent : null)
      if (seg.length) segments.push(seg)
    }
    // gx:Track — parallel <when> and <gx:coord>"lon lat alt"</gx:coord> lists.
    for (const tr of all(pm, 'Track')) {
      const whens = kids(tr, 'when').map((w) => w.textContent?.trim() ?? '')
      const seg: GeoPoint[] = []
      kids(tr, 'coord').forEach((c, i) => {
        const [lon, lat, alt] = (c.textContent ?? '').trim().split(/\s+/).map((s) => num(s))
        if (lat === undefined || lon === undefined || !validLatLon(lat, lon)) return
        seg.push(point(lat, lon, alt, whens[i] || undefined))
      })
      if (seg.length) segments.push(seg)
    }
    if (segments.length) tracks.push({ name: name ?? '', segments })
    for (const pt of all(pm, 'Point')) {
      const c = all(pt, 'coordinates')[0]
      const p = kmlCoords(c ? c.textContent : null)[0]
      if (p) waypoints.push(name ? { name, ...p } : p)
    }
  }
  return { tracks, waypoints }
}

/* GeoJSON */
type Json = Record<string, unknown>

function gjPoint(c: unknown, time?: unknown): GeoPoint | null {
  if (!Array.isArray(c) || c.length < 2) return null
  const [lon, lat, ele] = c as unknown[]
  if (typeof lat !== 'number' || typeof lon !== 'number' || !validLatLon(lat, lon)) return null
  return point(lat, lon, typeof ele === 'number' && Number.isFinite(ele) ? ele : undefined, typeof time === 'string' ? time : undefined)
}

function gjLine(coords: unknown, times: unknown): GeoPoint[] {
  if (!Array.isArray(coords)) return []
  const t = Array.isArray(times) ? times : []
  return coords.map((c, i) => gjPoint(c, t[i])).filter((p): p is GeoPoint => p !== null)
}

function parseGeoJSON(text: string): GeoData | string {
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    return 'This GeoJSON is not valid JSON.'
  }
  const data: GeoData = { tracks: [], waypoints: [] }
  const visit = (geom: unknown, props: Json) => {
    if (!geom || typeof geom !== 'object') return
    const g = geom as Json
    const name = typeof props.name === 'string' ? props.name : ''
    const withName = (p: GeoPoint): GeoWaypoint => (name ? { name, ...p } : p)
    switch (g.type) {
      case 'LineString':
        data.tracks.push({ name, segments: [gjLine(g.coordinates, props.coordTimes)] })
        break
      case 'MultiLineString': {
        const lines = Array.isArray(g.coordinates) ? g.coordinates : []
        const times = Array.isArray(props.coordTimes) ? props.coordTimes : []
        data.tracks.push({ name, segments: lines.map((l, i) => gjLine(l, times[i])).filter((s) => s.length) })
        break
      }
      case 'Point': {
        const p = gjPoint(g.coordinates, props.time)
        if (p) data.waypoints.push(withName(p))
        break
      }
      case 'MultiPoint':
        for (const c of Array.isArray(g.coordinates) ? g.coordinates : []) {
          const p = gjPoint(c)
          if (p) data.waypoints.push(withName(p))
        }
        break
      case 'GeometryCollection':
        for (const sub of Array.isArray(g.geometries) ? g.geometries : []) visit(sub, props)
        break
      case 'Feature': {
        const p = g.properties && typeof g.properties === 'object' ? (g.properties as Json) : {}
        visit(g.geometry, p)
        break
      }
      case 'FeatureCollection':
        for (const f of Array.isArray(g.features) ? g.features : []) visit(f, {})
        break
    }
  }
  if (Array.isArray(root)) root.forEach((r) => visit(r, {}))
  else visit(root, {})
  return data
}

/* ---- writers ------------------------------------------------------------- */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function gjCoord(p: GeoPoint): number[] {
  return p.ele !== undefined ? [p.lon, p.lat, p.ele] : [p.lon, p.lat]
}

export function toGeoJSON(data: GeoData): string {
  const features: unknown[] = []
  for (const w of data.waypoints) {
    const properties: Json = {}
    if (w.name) properties.name = w.name
    if (w.time) properties.time = w.time
    features.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: gjCoord(w) } })
  }
  for (const t of data.tracks) {
    const segs = t.segments.filter((s) => s.length)
    if (!segs.length) continue
    const properties: Json = {}
    if (t.name) properties.name = t.name
    const hasTimes = segs.some((s) => s.some((p) => p.time))
    if (segs.length === 1) {
      if (hasTimes) properties.coordTimes = segs[0].map((p) => p.time ?? null)
      features.push({ type: 'Feature', properties, geometry: { type: 'LineString', coordinates: segs[0].map(gjCoord) } })
    } else {
      if (hasTimes) properties.coordTimes = segs.map((s) => s.map((p) => p.time ?? null))
      features.push({
        type: 'Feature',
        properties,
        geometry: { type: 'MultiLineString', coordinates: segs.map((s) => s.map(gjCoord)) },
      })
    }
  }
  return JSON.stringify({ type: 'FeatureCollection', features }, null, 2)
}

function gpxPt(tag: string, p: GeoWaypoint, indent: string): string {
  const inner: string[] = []
  if (p.ele !== undefined) inner.push(`<ele>${p.ele}</ele>`)
  if (p.time) inner.push(`<time>${esc(p.time)}</time>`)
  if (p.name) inner.push(`<name>${esc(p.name)}</name>`)
  const open = `${indent}<${tag} lat="${p.lat}" lon="${p.lon}"`
  return inner.length ? `${open}>${inner.join('')}</${tag}>` : `${open}/>`
}

export function toGPX(data: GeoData): string {
  const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="dauntexlabs" xmlns="http://www.topografix.com/GPX/1/1">',
  ]
  for (const w of data.waypoints) out.push(gpxPt('wpt', w, '  '))
  for (const t of data.tracks) {
    out.push('  <trk>')
    if (t.name) out.push(`    <name>${esc(t.name)}</name>`)
    for (const s of t.segments) {
      out.push('    <trkseg>')
      for (const p of s) out.push(gpxPt('trkpt', { lat: p.lat, lon: p.lon, ele: p.ele, time: p.time }, '      '))
      out.push('    </trkseg>')
    }
    out.push('  </trk>')
  }
  out.push('</gpx>')
  return out.join('\n')
}

function kmlCoord(p: GeoPoint): string {
  return p.ele !== undefined ? `${p.lon},${p.lat},${p.ele}` : `${p.lon},${p.lat}`
}

export function toKML(data: GeoData): string {
  const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '  <Document>',
  ]
  for (const w of data.waypoints) {
    out.push('    <Placemark>')
    if (w.name) out.push(`      <name>${esc(w.name)}</name>`)
    out.push(`      <Point><coordinates>${kmlCoord(w)}</coordinates></Point>`)
    out.push('    </Placemark>')
  }
  for (const t of data.tracks) {
    const segs = t.segments.filter((s) => s.length)
    if (!segs.length) continue
    out.push('    <Placemark>')
    if (t.name) out.push(`      <name>${esc(t.name)}</name>`)
    const line = (s: GeoPoint[]) => `<LineString><coordinates>${s.map(kmlCoord).join(' ')}</coordinates></LineString>`
    if (segs.length === 1) out.push(`      ${line(segs[0])}`)
    else out.push(`      <MultiGeometry>${segs.map(line).join('')}</MultiGeometry>`)
    out.push('    </Placemark>')
  }
  out.push('  </Document>', '</kml>')
  return out.join('\n')
}

function csvCell(v: string | number | undefined): string {
  if (v === undefined) return ''
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Track points only, one row each; segment and index are 1-based. Waypoints are not included. */
export function toCSV(data: GeoData): string {
  const rows = ['track,segment,index,lat,lon,ele,time']
  for (const t of data.tracks) {
    t.segments.forEach((s, si) =>
      s.forEach((p, pi) =>
        rows.push([t.name, si + 1, pi + 1, p.lat, p.lon, p.ele, p.time].map(csvCell).join(',')),
      ),
    )
  }
  return rows.join('\n')
}
