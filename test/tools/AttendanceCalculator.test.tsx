import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AttendanceCalculator from '@/components/tools/AttendanceCalculator'

const set = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } })

describe('AttendanceCalculator', () => {
  it('prompts before input and defaults the target to 75', () => {
    render(<AttendanceCalculator />)
    expect(screen.getByText(/Enter classes held and attended/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Required attendance/)).toHaveValue(75)
  })

  it('42 of 50 → 84% and can miss 6', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '42')
    expect(screen.getByText('84%')).toBeInTheDocument()
    expect(screen.getByText(/You can miss 6 classes/)).toBeInTheDocument()
  })

  it('30 of 50 → must attend the next 30', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '30')
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText(/attend the next 30 classes/)).toBeInTheDocument()
  })

  it('with 20 remaining: 30 of 50 is not reachable, best 71.43%', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '30')
    set(/Classes remaining/, '20')
    expect(screen.getByText(/not reachable/)).toBeInTheDocument()
    expect(screen.getByText(/71\.43%/)).toBeInTheDocument()
  })

  it('with 20 remaining: 40 of 50 → attend 13, can miss 7', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '40')
    set(/Classes remaining/, '20')
    expect(screen.getByText(/attend at least 13 of the 20/)).toBeInTheDocument()
    expect(screen.getByText(/miss up to 7/)).toBeInTheDocument()
  })

  it('echoes the target as a normalised number ("075" → 75%)', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '42')
    set(/Required attendance/, '075')
    expect(screen.getByText(/at or above 75%/)).toBeInTheDocument()
    expect(screen.queryByText(/075%/)).toBeNull()
  })

  it('p = 100 with an absence says it can no longer be reached', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '20')
    set(/Classes attended/, '19')
    set(/Required attendance/, '100')
    expect(screen.getByText(/100% can no longer be reached/)).toBeInTheDocument()
  })

  it('empty target shows an error', () => {
    const { container } = render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '42')
    set(/Required attendance/, '')
    expect(screen.getByText(/Required attendance must be/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/NaN|Infinity/)
  })

  it('remaining = 0 shows no plan paragraph', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '42')
    set(/Classes remaining/, '0')
    expect(screen.getByText(/You can miss 6 classes in a row/)).toBeInTheDocument()
    expect(screen.queryByText(/remaining class/)).toBeNull()
  })

  it('needed = 0 → can miss all remaining, and hides the contradicting in-a-row line', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '50')
    set(/Classes attended/, '42')
    set(/Classes remaining/, '3')
    expect(screen.getByText(/You can miss all 3 remaining classes and still finish at or above 75%/)).toBeInTheDocument()
    expect(screen.queryByText(/in a row/)).toBeNull()
  })

  it('uses the singular for one remaining class', () => {
    render(<AttendanceCalculator />)
    set(/Classes held/, '3')
    set(/Classes attended/, '2')
    set(/Classes remaining/, '1')
    expect(screen.getByText(/attend at least 1 of the 1 remaining class;/)).toBeInTheDocument()
  })

  it('attended > held shows an error and no NaN/Infinity', () => {
    const { container } = render(<AttendanceCalculator />)
    set(/Classes held/, '10')
    set(/Classes attended/, '12')
    expect(screen.getByText(/cannot be more than classes held/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/NaN|Infinity/)
  })

  it('held = 0 and target 0 show errors, no NaN/Infinity', () => {
    const { container } = render(<AttendanceCalculator />)
    set(/Classes held/, '0')
    set(/Classes attended/, '0')
    expect(container.querySelector('.notice.error')).not.toBeNull()
    set(/Classes held/, '10')
    set(/Required attendance/, '0')
    expect(container.querySelector('.notice.error')).not.toBeNull()
    expect(container.textContent).not.toMatch(/NaN|Infinity/)
  })
})
