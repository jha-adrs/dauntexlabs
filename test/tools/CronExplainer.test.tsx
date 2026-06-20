import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CronExplainer from '@/components/tools/CronExplainer'

describe('CronExplainer', () => {
  it('describes "*/15 * * * *" as every 15 minutes', () => {
    render(<CronExplainer />)
    // default value is */15 * * * *
    expect(screen.getByText(/every 15 minutes/i)).toBeInTheDocument()
  })

  it('renders 5 future run times for */15', () => {
    render(<CronExplainer />)
    const runsPanel = screen.getByText('next 5 runs').closest('.panel') as HTMLElement
    const rows = runsPanel.querySelectorAll('code')
    expect(rows.length).toBe(5)
    // every run string should be non-empty
    rows.forEach((r) => expect(r.textContent?.length).toBeGreaterThan(0))
  })

  it('describes a fixed daily time "0 9 * * 1-5"', () => {
    render(<CronExplainer />)
    const input = screen.getByPlaceholderText('*/15 * * * *')
    fireEvent.change(input, { target: { value: '0 9 * * 1-5' } })
    expect(screen.getByText(/At 09:00/)).toBeInTheDocument()
    // weekday names should appear
    expect(screen.getByText(/Monday/)).toBeInTheDocument()
    expect(screen.getByText(/Friday/)).toBeInTheDocument()
  })

  it('describes "every minute" for "* * * * *"', () => {
    render(<CronExplainer />)
    const input = screen.getByPlaceholderText('*/15 * * * *')
    fireEvent.change(input, { target: { value: '* * * * *' } })
    expect(screen.getByText(/Every minute/i)).toBeInTheDocument()
  })

  it('handles day-of-month and month "30 4 1 * *"', () => {
    render(<CronExplainer />)
    const input = screen.getByPlaceholderText('*/15 * * * *')
    fireEvent.change(input, { target: { value: '30 4 1 * *' } })
    expect(screen.getByText(/At 04:30/)).toBeInTheDocument()
    expect(screen.getByText(/day-of-month 1/)).toBeInTheDocument()
  })

  it('errors on a garbage expression', () => {
    render(<CronExplainer />)
    const input = screen.getByPlaceholderText('*/15 * * * *')
    fireEvent.change(input, { target: { value: 'not a cron' } })
    expect(screen.getByText(/Expected 5 fields/i)).toBeInTheDocument()
  })

  it('errors on an out-of-range value', () => {
    render(<CronExplainer />)
    const input = screen.getByPlaceholderText('*/15 * * * *')
    fireEvent.change(input, { target: { value: '99 * * * *' } })
    expect(screen.getByText(/out of range/i)).toBeInTheDocument()
  })

  it('errors on wrong field count', () => {
    render(<CronExplainer />)
    const input = screen.getByPlaceholderText('*/15 * * * *')
    fireEvent.change(input, { target: { value: '* * *' } })
    expect(screen.getByText(/Expected 5 fields/i)).toBeInTheDocument()
  })

  it('lets you pick an example preset', () => {
    render(<CronExplainer />)
    fireEvent.click(screen.getByRole('button', { name: '0 0 * * 0' }))
    expect(screen.getByText(/At 00:00/)).toBeInTheDocument()
    expect(screen.getByText(/Sunday/)).toBeInTheDocument()
  })
})
