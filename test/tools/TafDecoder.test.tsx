import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TafDecoder from '@/components/tools/TafDecoder'

const paste = (v: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value: v } })

describe('TafDecoder', () => {
  it('shows the planning notice and the no-fetch copy', () => {
    render(<TafDecoder />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
    expect(screen.getByText(/this page does not fetch weather/)).toBeInTheDocument()
  })

  it('decodes a TAF into a period timeline', () => {
    render(<TafDecoder />)
    paste(
      'TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250 FM081800 30012G20KT P6SM SCT050 TEMPO 0820/0824 3SM -SHRA BKN030 PROB30 0902/0906 1SM BR OVC004',
    )
    expect(screen.getByText(/8th 12:00 to 9th 18:00 UTC/)).toBeInTheDocument()
    expect(screen.getByText(/From 8th 18:00/)).toBeInTheDocument()
    expect(screen.getByText(/Temporarily 8th 20:00/)).toBeInTheDocument()
    expect(screen.getByText(/30% probability/)).toBeInTheDocument()
    expect(screen.getByText('Light showers of rain')).toBeInTheDocument()
  })

  it('shows an error for input without a station', () => {
    render(<TafDecoder />)
    paste('TAF')
    expect(screen.getByText(/station/i)).toBeInTheDocument()
  })
})
