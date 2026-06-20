import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EngagementRateCalculator from '@/components/tools/EngagementRateCalculator'

describe('EngagementRateCalculator', () => {
  it('calculates rate in total mode: 300 engagements / 10000 followers = 3%', () => {
    render(<EngagementRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 300'), { target: { value: '300' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10000'), { target: { value: '10000' } })
    expect(screen.getByText('3.00%')).toBeInTheDocument()
  })

  it('calculates rate in breakdown mode: likes+comments+shares / followers', () => {
    render(<EngagementRateCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Likes / Comments / Shares' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 75'), { target: { value: '75' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '25' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10000'), { target: { value: '10000' } })
    expect(screen.getByText('3.00%')).toBeInTheDocument()
  })

  it('shows error when audience size is zero', () => {
    render(<EngagementRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 300'), { target: { value: '300' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10000'), { target: { value: '0' } })
    expect(screen.getByText(/Audience size must be a positive number/i)).toBeInTheDocument()
  })

  it('shows info notice when inputs are empty', () => {
    render(<EngagementRateCalculator />)
    expect(screen.getByText(/Enter engagements/i)).toBeInTheDocument()
  })

  it('shows error when audience size is missing', () => {
    render(<EngagementRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 300'), { target: { value: '300' } })
    expect(screen.getByText(/Enter the audience size/i)).toBeInTheDocument()
  })

  it('handles fractional engagement rate: 1 engagement / 200 followers = 0.50%', () => {
    render(<EngagementRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 300'), { target: { value: '1' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10000'), { target: { value: '200' } })
    expect(screen.getByText('0.50%')).toBeInTheDocument()
  })

  it('shows engagement and audience counts in results', () => {
    render(<EngagementRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 300'), { target: { value: '300' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10000'), { target: { value: '10000' } })
    // Both counts appear in the summary cards
    const threeHundreds = screen.getAllByText('300')
    expect(threeHundreds.length).toBeGreaterThanOrEqual(1)
    const tenThousands = screen.getAllByText('10,000')
    expect(tenThousands.length).toBeGreaterThanOrEqual(1)
  })
})
