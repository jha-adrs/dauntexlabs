import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConvertWidget from '@/components/convert/ConvertWidget'
import { getPair } from '@/lib/conversions'

describe('ConvertWidget', () => {
  it('pre-fills and converts a unit pair (kg → lb)', () => {
    render(<ConvertWidget pair={getPair('kilograms-to-pounds')!} />)
    // default value 1 → ~2.2046
    expect(screen.getByText(/2\.2046/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Value in Kilograms'), { target: { value: '10' } })
    expect(screen.getByText(/22\.046/)).toBeInTheDocument()
  })

  it('converts a number-base pair (binary → decimal)', () => {
    render(<ConvertWidget pair={getPair('binary-to-decimal')!} />)
    // default value '10' (binary) → 2 (decimal)
    expect(screen.getByText('2')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Value in Binary'), { target: { value: '1111' } })
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('shows an error for an invalid base digit', () => {
    render(<ConvertWidget pair={getPair('binary-to-decimal')!} />)
    fireEvent.change(screen.getByLabelText('Value in Binary'), { target: { value: '2' } })
    expect(screen.getByText(/valid base-2/i)).toBeInTheDocument()
  })
})
