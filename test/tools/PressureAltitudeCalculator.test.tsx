import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PressureAltitudeCalculator from '@/components/tools/PressureAltitudeCalculator'

const set = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })

describe('PressureAltitudeCalculator', () => {
  it('shows the notice, a prompt and links to density altitude', () => {
    render(<PressureAltitudeCalculator />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
    expect(screen.getByText(/Enter field elevation/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /density altitude/i })).toHaveAttribute('href', '/tools/density-altitude-calculator/')
  })

  it('elev 1000 ft, 29.42 inHg → 1,467 ft, rule of thumb 1,500 ft', () => {
    render(<PressureAltitudeCalculator />)
    set('e.g. 1000', '1000')
    set('e.g. 29.92', '29.42')
    expect(screen.getByText('1,467 ft')).toBeInTheDocument()
    expect(screen.getByText('1,500 ft')).toBeInTheDocument()
  })

  it('hPa: elev 0, 1003.25 hPa → 274 ft', () => {
    render(<PressureAltitudeCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'hPa' }))
    set('e.g. 1000', '0')
    set('e.g. 1013', '1003.25')
    expect(screen.getByText('274 ft')).toBeInTheDocument()
  })

  it('shows an error for an implausible altimeter setting', () => {
    render(<PressureAltitudeCalculator />)
    set('e.g. 1000', '0')
    set('e.g. 29.92', '1013')
    expect(screen.getByText(/Altimeter setting must be between/)).toBeInTheDocument()
  })
})
