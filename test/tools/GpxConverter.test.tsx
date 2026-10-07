import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GpxConverter from '@/components/tools/GpxConverter'

const GPX = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Loop</name><trkseg>
<trkpt lat="0" lon="0"><ele>100</ele><time>2026-01-01T10:00:00Z</time></trkpt>
<trkpt lat="0" lon="0.01"><ele>150</ele><time>2026-01-01T10:05:00Z</time></trkpt>
<trkpt lat="0" lon="0.02"><ele>120</ele><time>2026-01-01T10:10:00Z</time></trkpt>
</trkseg></trk></gpx>`

const SRC = 'Or paste GPX, KML or GeoJSON here…'
const OUT = 'Converted output…'

afterEach(() => vi.restoreAllMocks())

describe('GpxConverter', () => {
  it('auto-detects pasted GPX and converts to GeoJSON by default', () => {
    render(<GpxConverter />)
    fireEvent.change(screen.getByPlaceholderText(SRC), { target: { value: GPX } })
    expect(screen.getByText(/Detected: GPX/)).toBeInTheDocument()
    const out = JSON.parse((screen.getByPlaceholderText(OUT) as HTMLTextAreaElement).value)
    expect(out.type).toBe('FeatureCollection')
    expect(out.features[0].geometry.coordinates).toHaveLength(3)
  })

  it('shows stats: distance, elevation gain/loss, moving time, points', () => {
    render(<GpxConverter />)
    fireEvent.change(screen.getByPlaceholderText(SRC), { target: { value: GPX } })
    expect(screen.getByText('2.22 km · 1.38 mi')).toBeInTheDocument()
    expect(screen.getByText('50 m · 164 ft')).toBeInTheDocument()
    expect(screen.getByText('30 m · 98 ft')).toBeInTheDocument()
    expect(screen.getAllByText('10:00')).toHaveLength(2) // moving + elapsed
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('switches output to KML and CSV', () => {
    render(<GpxConverter />)
    fireEvent.change(screen.getByPlaceholderText(SRC), { target: { value: GPX } })
    fireEvent.click(screen.getByRole('tab', { name: 'KML' }))
    expect((screen.getByPlaceholderText(OUT) as HTMLTextAreaElement).value).toContain('<LineString>')
    fireEvent.click(screen.getByRole('tab', { name: 'CSV' }))
    const csv = (screen.getByPlaceholderText(OUT) as HTMLTextAreaElement).value
    expect(csv.split('\n')[0]).toBe('track,segment,index,lat,lon,ele,time')
    expect(csv.split('\n')).toHaveLength(4)
  })

  it('shows an error for malformed input', () => {
    render(<GpxConverter />)
    fireEvent.change(screen.getByPlaceholderText(SRC), { target: { value: '<gpx><trk>' } })
    expect(screen.getByText(/not well-formed/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(OUT)).toHaveValue('')
  })

  it('loads a dropped file and names the download after it', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<GpxConverter />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([GPX], 'morning-ride.gpx', { type: 'application/gpx+xml' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText('morning-ride.gpx')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/Detected: GPX/)).toBeInTheDocument())

    const clicks: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this.download)
    })
    fireEvent.click(screen.getByRole('button', { name: /download/i }))
    expect(spy).toHaveBeenCalled()
    expect(clicks).toEqual(['morning-ride.geojson'])
  })
})
