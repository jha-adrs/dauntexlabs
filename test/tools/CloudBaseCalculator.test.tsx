import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CloudBaseCalculator from '@/components/tools/CloudBaseCalculator'

const set = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })

describe('CloudBaseCalculator', () => {
  it('shows the planning-only notice and a prompt before input', () => {
    render(<CloudBaseCalculator />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
    expect(screen.getByText(/Enter temperature and dewpoint/)).toBeInTheDocument()
  })

  it('25 °C / 15 °C → 4,000 ft AGL and RH 54 %', () => {
    render(<CloudBaseCalculator />)
    set('e.g. 25', '25')
    set('e.g. 15', '15')
    expect(screen.getAllByText('4,000 ft AGL')).toHaveLength(2)
    expect(screen.getByText('54 %')).toBeInTheDocument()
  })

  it('accepts °F: 77 °F / 59 °F → 4,000 ft AGL', () => {
    render(<CloudBaseCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: '°F' }))
    set('e.g. 77', '77')
    set('e.g. 59', '59')
    expect(screen.getAllByText('4,000 ft AGL')).toHaveLength(2)
  })

  it('shows an error when dewpoint exceeds temperature', () => {
    render(<CloudBaseCalculator />)
    set('e.g. 25', '10')
    set('e.g. 15', '12')
    expect(screen.getByText(/Dewpoint cannot be higher/)).toBeInTheDocument()
  })
})
