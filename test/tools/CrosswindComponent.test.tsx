import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CrosswindComponent from '@/components/tools/CrosswindComponent'

const set = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })

describe('CrosswindComponent', () => {
  it('shows the planning-only notice', () => {
    render(<CrosswindComponent />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
  })

  it('runway 270, wind 300/20 → headwind 17.3 kt, crosswind 10.0 kt from the right', () => {
    render(<CrosswindComponent />)
    set('e.g. 270', '270')
    set('e.g. 300', '300')
    set('e.g. 20', '20')
    expect(screen.getByText('Headwind')).toBeInTheDocument()
    expect(screen.getByText('17.3 kt')).toBeInTheDocument()
    expect(screen.getByText('10.0 kt from the right')).toBeInTheDocument()
  })

  it('labels a tailwind', () => {
    render(<CrosswindComponent />)
    set('e.g. 270', '90')
    set('e.g. 300', '270')
    set('e.g. 20', '10')
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
    expect(screen.getByText('10.0 kt')).toBeInTheDocument()
  })

  it('shows an error for an out-of-range heading', () => {
    render(<CrosswindComponent />)
    set('e.g. 270', '400')
    set('e.g. 300', '0')
    set('e.g. 20', '10')
    expect(screen.getByText(/Runway heading must be between/)).toBeInTheDocument()
  })
})
