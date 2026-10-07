import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WindCorrectionAngle from '@/components/tools/WindCorrectionAngle'

const set = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })
const fill = (tas: string, crs: string, dir: string, spd: string) => {
  set('e.g. 120', tas); set('e.g. 090', crs); set('e.g. 360', dir); set('e.g. 20', spd)
}

describe('WindCorrectionAngle', () => {
  it('shows the planning-only notice', () => {
    render(<WindCorrectionAngle />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
  })

  it('TAS 120, course 090, wind 360/20 → WCA 9.6° left, heading 080°, GS 118 kt', () => {
    render(<WindCorrectionAngle />)
    fill('120', '90', '360', '20')
    expect(screen.getByText('9.6° left')).toBeInTheDocument()
    expect(screen.getByText('080°')).toBeInTheDocument()
    expect(screen.getByText('118 kt')).toBeInTheDocument()
  })

  it('shows an error when the crosswind exceeds TAS', () => {
    render(<WindCorrectionAngle />)
    fill('50', '90', '0', '60')
    expect(screen.getByText(/crosswind component is at least your true airspeed/)).toBeInTheDocument()
  })
})
