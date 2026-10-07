import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TrueAirspeedCalculator from '@/components/tools/TrueAirspeedCalculator'

const set = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })

describe('TrueAirspeedCalculator', () => {
  it('shows the planning-only notice', () => {
    render(<TrueAirspeedCalculator />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
  })

  it('CAS 150 kt, PA 8000 ft, OAT 0 °C → TAS 169 kt, Mach 0.263', () => {
    render(<TrueAirspeedCalculator />)
    set('e.g. 150', '150')
    set('e.g. 8000', '8000')
    set('e.g. 0', '0')
    expect(screen.getByText('169 kt')).toBeInTheDocument()
    expect(screen.getByText('0.263')).toBeInTheDocument()
  })

  it('shows an error for supersonic CAS', () => {
    render(<TrueAirspeedCalculator />)
    set('e.g. 150', '700')
    set('e.g. 8000', '0')
    set('e.g. 0', '15')
    expect(screen.getByText(/subsonic speeds only/)).toBeInTheDocument()
  })
})
