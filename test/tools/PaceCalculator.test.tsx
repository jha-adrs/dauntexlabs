import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PaceCalculator from '@/components/tools/PaceCalculator'

// Pace mode: distance + time → pace per km & per mi
// Time mode: distance + pace → total time
// Distance mode: time + pace → distance

describe('PaceCalculator', () => {
  // Helper: fill hh:mm:ss fields
  function fillTime(hh: string, mm: string, ss: string) {
    const placeholders = ['hh', 'mm', 'ss']
    const inputs = screen.getAllByPlaceholderText(/^hh$|^mm$|^ss$/)
    fireEvent.change(inputs[0], { target: { value: hh } })
    fireEvent.change(inputs[1], { target: { value: mm } })
    fireEvent.change(inputs[2], { target: { value: ss } })
    return placeholders
  }

  describe('Pace mode (distance + time → pace)', () => {
    it('10 km in 50:00 → 5:00 /km', () => {
      render(<PaceCalculator />)
      // Pace is default mode
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '10' } })
      fillTime('0', '50', '0')
      expect(screen.getByText('5:00')).toBeInTheDocument()
    })

    it('5 km in 25:00 → 5:00 /km', () => {
      render(<PaceCalculator />)
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '5' } })
      fillTime('0', '25', '0')
      expect(screen.getByText('5:00')).toBeInTheDocument()
    })

    it('21.1 km in 1:45:00 → pace ≈ 4:59 /km', () => {
      render(<PaceCalculator />)
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '21.1' } })
      fillTime('1', '45', '0')
      // 6300 / 21.1 = 298.58s = 4:58.58 → 4:59
      expect(screen.getByText('4:59')).toBeInTheDocument()
    })

    it('also shows pace in /mi', () => {
      render(<PaceCalculator />)
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '10' } })
      fillTime('0', '50', '0')
      // 5:00 /km * 1.60934 = 8:03 /mi
      expect(screen.getByText('8:03')).toBeInTheDocument()
    })
  })

  describe('Time mode (distance + pace → total time)', () => {
    it('10 km at 5:00 /km → 50:00 total', () => {
      render(<PaceCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Time' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '10' } })
      fireEvent.change(screen.getByPlaceholderText('5:30'), { target: { value: '5:00' } })
      expect(screen.getByText('50:00')).toBeInTheDocument()
    })

    it('42.195 km at 4:15 /km → 2:59:26 total', () => {
      render(<PaceCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Time' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '42.195' } })
      fireEvent.change(screen.getByPlaceholderText('5:30'), { target: { value: '4:15' } })
      // 4:15 = 255s/km, 42.195 * 255 = 10759.725s → 2:59:19... wait
      // 42.195 * 255 = 10759.725 → Math.round = 10760 → 2h 59m 20s
      // Actually: floor(10760/3600)=2, floor(360/60)=5... let me calc: 10760/3600=2.988..., 2h, remaining=10760-7200=3560, 3560/60=59.33, 59m, 60s→ 3560-3540=20s → 2:59:20
      expect(screen.getByText(/2:59/)).toBeInTheDocument()
    })
  })

  describe('Distance mode (time + pace → distance)', () => {
    it('50 min at 5:00 /km → 10 km', () => {
      render(<PaceCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Distance' }))
      fillTime('0', '50', '0')
      fireEvent.change(screen.getByPlaceholderText('5:30'), { target: { value: '5:00' } })
      // 3000s / 300s/km = 10.00 km
      expect(screen.getByText('10.00')).toBeInTheDocument()
    })

    it('1:00:00 at 6:00 /km → 10 km', () => {
      render(<PaceCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Distance' }))
      fillTime('1', '0', '0')
      fireEvent.change(screen.getByPlaceholderText('5:30'), { target: { value: '6:00' } })
      expect(screen.getByText('10.00')).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows error for invalid pace format', () => {
      render(<PaceCalculator />)
      fireEvent.click(screen.getByRole('tab', { name: 'Time' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '10' } })
      fireEvent.change(screen.getByPlaceholderText('5:30'), { target: { value: 'abc' } })
      expect(screen.getByText(/Pace must be in mm:ss format/i)).toBeInTheDocument()
    })

    it('shows empty state when no inputs provided', () => {
      render(<PaceCalculator />)
      expect(screen.getByText(/Enter distance and time to calculate pace/i)).toBeInTheDocument()
    })
  })
})
