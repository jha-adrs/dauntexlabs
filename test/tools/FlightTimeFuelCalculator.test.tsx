import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FlightTimeFuelCalculator from '@/components/tools/FlightTimeFuelCalculator'

const set = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })
const fill = () => {
  set('e.g. 150', '150')
  set('e.g. 120', '120')
  set('e.g. 10', '10')
}

describe('FlightTimeFuelCalculator', () => {
  it('shows the notice and a prompt before input', () => {
    render(<FlightTimeFuelCalculator />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
    expect(screen.getByText(/Enter distance, ground speed and fuel burn/)).toBeInTheDocument()
  })

  it('150 nm @ 120 kt, 10 gal/h, 45 min reserve → 1 h 15 min, 20.0 gal, 120 lb', () => {
    render(<FlightTimeFuelCalculator />)
    fill()
    expect(screen.getByText('1 h 15 min')).toBeInTheDocument()
    expect(screen.getByText('12.5 gal')).toBeInTheDocument()
    expect(screen.getByText('7.5 gal')).toBeInTheDocument()
    expect(screen.getByText('20.0 gal')).toBeInTheDocument()
    expect(screen.getByText('120 lb')).toBeInTheDocument()
  })

  it('30 min reserve preset and Jet A', () => {
    render(<FlightTimeFuelCalculator />)
    fill()
    fireEvent.click(screen.getByRole('tab', { name: '30 min' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Jet A' }))
    expect(screen.getByText('17.5 gal')).toBeInTheDocument()
    expect(screen.getByText('117 lb')).toBeInTheDocument()
  })

  it('shows an error for zero ground speed', () => {
    render(<FlightTimeFuelCalculator />)
    set('e.g. 150', '150')
    set('e.g. 120', '0')
    set('e.g. 10', '10')
    expect(screen.getByText(/Ground speed must be greater than 0/)).toBeInTheDocument()
  })
})
