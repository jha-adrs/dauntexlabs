import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DensityAltitudeCalculator from '@/components/tools/DensityAltitudeCalculator'

const set = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })

describe('DensityAltitudeCalculator', () => {
  it('shows the planning-only notice and a prompt before input', () => {
    render(<DensityAltitudeCalculator />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
    expect(screen.getByText(/Enter pressure altitude/)).toBeInTheDocument()
  })

  it('PA 5000 ft, OAT 30 °C → 7,801 ft, ISA 5.1 °C, ISA +24.9 °C', () => {
    render(<DensityAltitudeCalculator />)
    set('e.g. 5000', '5000')
    set('e.g. 30', '30')
    expect(screen.getByText('7,801 ft')).toBeInTheDocument()
    expect(screen.getByText('5.1 °C')).toBeInTheDocument()
    expect(screen.getByText('+24.9 °C')).toBeInTheDocument()
  })

  it('uses the optional dewpoint', () => {
    render(<DensityAltitudeCalculator />)
    set('e.g. 5000', '5000')
    set('e.g. 30', '30')
    set('Optional, e.g. 20', '20')
    expect(screen.getByText('8,141 ft')).toBeInTheDocument()
  })

  it('shows an error when dewpoint exceeds temperature', () => {
    render(<DensityAltitudeCalculator />)
    set('e.g. 5000', '0')
    set('e.g. 30', '10')
    set('Optional, e.g. 20', '15')
    expect(screen.getByText(/Dewpoint cannot be higher/)).toBeInTheDocument()
  })
})
