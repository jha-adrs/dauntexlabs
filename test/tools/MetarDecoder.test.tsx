import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetarDecoder from '@/components/tools/MetarDecoder'

const paste = (v: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value: v } })

describe('MetarDecoder', () => {
  it('shows the planning notice and the no-fetch copy', () => {
    render(<MetarDecoder />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
    expect(
      screen.getByText('Paste a METAR from your briefing source — this page does not fetch weather.'),
    ).toBeInTheDocument()
  })

  it('decodes a pasted METAR into a table with a flight-category badge', () => {
    render(<MetarDecoder />)
    paste('KJFK 121651Z 31015G25KT 10SM FEW050 SCT250 22/12 A3002 RMK AO2 SLP165')
    expect(screen.getByText('From 310° at 15 kt, gusting 25 kt')).toBeInTheDocument()
    expect(screen.getByText('30.02 inHg (1016.6 hPa)')).toBeInTheDocument()
    expect(screen.getByText('VFR')).toBeInTheDocument()
  })

  it('shows unknown groups as "Not decoded"', () => {
    render(<MetarDecoder />)
    paste('KXYZ 081200Z 18010KT 9999 ZZZZ SCT030 15/10 Q1012')
    expect(screen.getByText('Not decoded')).toBeInTheDocument()
  })

  it('shows an error for input without a station', () => {
    render(<MetarDecoder />)
    paste('121651Z 31015KT')
    expect(screen.getByText(/station/i)).toBeInTheDocument()
  })
})
