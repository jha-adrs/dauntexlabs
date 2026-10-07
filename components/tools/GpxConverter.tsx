'use client'

import { useMemo, useState } from 'react'
import {
  CopyButton,
  DownloadButton,
  FileDrop,
  FilePreview,
  IO,
  Notice,
  Panel,
  Segmented,
  TextArea,
  Toolbar,
} from '@/components/ui/kit'
import { parseGeo, stats, toCSV, toGeoJSON, toGPX, toKML, ELEVATION_THRESHOLD_M, type GeoData } from '@/lib/geo'

type Out = 'geojson' | 'gpx' | 'kml' | 'csv'

const FORMATS: { value: Out; label: string; mime: string }[] = [
  { value: 'geojson', label: 'GeoJSON', mime: 'application/geo+json' },
  { value: 'gpx', label: 'GPX', mime: 'application/gpx+xml' },
  { value: 'kml', label: 'KML', mime: 'application/vnd.google-earth.kml+xml' },
  { value: 'csv', label: 'CSV', mime: 'text/csv' },
]

const LARGE_BYTES = 50 * 1024 * 1024

function convert(data: GeoData, out: Out): string {
  if (out === 'gpx') return toGPX(data)
  if (out === 'kml') return toKML(data)
  if (out === 'csv') return toCSV(data)
  return toGeoJSON(data)
}

function fmtDuration(s: number): string {
  const t = Math.round(s)
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = t % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

function fmtCoord(n: number) {
  return n.toFixed(5)
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--line)', padding: '4px 0' }}>
      <span style={{ color: 'var(--mute)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function GpxConverter() {
  const [text, setText] = useState('')
  const [file, setFile] = useState<{ name: string; bytes: number } | null>(null)
  const [readError, setReadError] = useState('')
  const [out, setOut] = useState<Out>('geojson')

  async function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setReadError('')
    try {
      const content = await f.text()
      setFile({ name: f.name, bytes: f.size })
      setText(content)
    } catch {
      setReadError('Could not read that file.')
    }
  }

  const parsed = useMemo(() => (text.trim() ? parseGeo(text, 'auto') : null), [text])

  const result = useMemo(() => {
    if (!parsed || !parsed.ok) return null
    const all = stats({ name: '', segments: parsed.tracks.flatMap((t) => t.segments) })
    return { output: convert(parsed, out), stats: all }
  }, [parsed, out])

  const base = (file?.name.replace(/\.[^.]+$/, '') || 'track').trim() || 'track'
  const fmt = FORMATS.find((f) => f.value === out)!
  const s = result?.stats
  const hasTimes = parsed?.ok && parsed.tracks.some((t) => t.segments.some((seg) => seg.some((p) => p.time)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FileDrop
        onFiles={onFiles}
        accept=".gpx,.kml,.geojson,.json"
        label="Drop a GPX, KML or GeoJSON file, or click to choose"
        hint="Processed on your device — no map, nothing to sign in to"
      />
      {file && (
        <FilePreview
          name={file.name}
          meta={fmtBytes(file.bytes)}
          onRemove={() => {
            setFile(null)
            setText('')
          }}
        />
      )}
      {file && file.bytes > LARGE_BYTES && (
        <Notice kind="info">This is a large file. Converting it in your browser may take a while.</Notice>
      )}
      {readError && <Notice kind="error">{readError}</Notice>}

      <Toolbar>
        <span className="hint-inline">Convert to</span>
        <Segmented value={out} onChange={(v) => setOut(v as Out)} options={FORMATS} />
      </Toolbar>

      <IO>
        <Panel
          title="Input"
          actions={
            parsed?.ok ? (
              <span className="hint-inline">
                Detected: {parsed.kind === 'geojson' ? 'GeoJSON' : parsed.kind.toUpperCase()} · {parsed.tracks.length} track
                {parsed.tracks.length === 1 ? '' : 's'} · {parsed.waypoints.length} waypoint
                {parsed.waypoints.length === 1 ? '' : 's'}
              </span>
            ) : undefined
          }
        >
          <TextArea
            value={text}
            onChange={(v) => {
              setText(v)
              setFile(null)
            }}
            placeholder="Or paste GPX, KML or GeoJSON here…"
          />
        </Panel>
        <Panel
          title={`Output · ${fmt.label}`}
          actions={
            <>
              <CopyButton text={result?.output ?? ''} />
              <DownloadButton text={result?.output ?? ''} filename={`${base}.${out}`} mime={fmt.mime} />
            </>
          }
        >
          <TextArea value={result?.output ?? ''} readOnly placeholder="Converted output…" />
        </Panel>
      </IO>

      {parsed && !parsed.ok && <Notice kind="error">{parsed.error}</Notice>}
      {result && out === 'kml' && hasTimes && (
        <Notice kind="info">KML output keeps positions and elevation but not timestamps.</Notice>
      )}
      {result && out === 'csv' && parsed?.ok && parsed.waypoints.length > 0 && (
        <Notice kind="info">CSV output lists track points only; waypoints are left out.</Notice>
      )}

      {s && s.points > 0 && (
        <Panel title="Track stats">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Row label="Distance" value={`${s.distanceKm.toFixed(2)} km · ${(s.distanceKm / 1.609344).toFixed(2)} mi`} />
            <Row label="Elevation gain" value={`${Math.round(s.elevationGainM)} m · ${Math.round(s.elevationGainM / 0.3048)} ft`} />
            <Row label="Elevation loss" value={`${Math.round(s.elevationLossM)} m · ${Math.round(s.elevationLossM / 0.3048)} ft`} />
            {s.movingS !== undefined && <Row label="Moving time" value={fmtDuration(s.movingS)} />}
            {s.durationS !== undefined && <Row label="Elapsed time" value={fmtDuration(s.durationS)} />}
            <Row label="Track points" value={String(s.points)} />
            {s.bounds && (
              <Row
                label="Bounds (south-west → north-east)"
                value={`${fmtCoord(s.bounds.minLat)}, ${fmtCoord(s.bounds.minLon)} → ${fmtCoord(s.bounds.maxLat)}, ${fmtCoord(s.bounds.maxLon)}`}
              />
            )}
          </div>
          <p className="hint-inline" style={{ marginTop: 8 }}>
            Distance is the great-circle sum between points. Elevation changes under {ELEVATION_THRESHOLD_M} m are
            ignored as GPS noise. Moving time skips stretches slower than 1.8 km/h.
          </p>
        </Panel>
      )}
    </div>
  )
}
