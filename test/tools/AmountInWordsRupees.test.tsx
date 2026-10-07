import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AmountInWordsRupees from '@/components/tools/AmountInWordsRupees'

function type(v: string) {
  fireEvent.change(screen.getByPlaceholderText('e.g. 1,25,000.50'), { target: { value: v } })
}

describe('AmountInWordsRupees', () => {
  it('shows English words and the Indian-grouped amount', () => {
    render(<AmountInWordsRupees />)
    type('123456789.05')
    expect(
      screen.getByText(
        'Twelve Crore Thirty-Four Lakh Fifty-Six Thousand Seven Hundred Eighty-Nine Rupees and Five Paise Only',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('₹12,34,56,789.05')).toBeInTheDocument()
  })

  it('switches to Hindi', () => {
    render(<AmountInWordsRupees />)
    type('100000')
    fireEvent.click(screen.getByRole('tab', { name: 'Hindi' }))
    expect(screen.getByText('एक लाख रुपये मात्र')).toBeInTheDocument()
  })

  it('drops "Only" when the toggle is off', () => {
    render(<AmountInWordsRupees />)
    type('1')
    fireEvent.click(screen.getByLabelText('Add "Only"'))
    expect(screen.getByText('One Rupee')).toBeInTheDocument()
  })

  it('shows an error for too many decimals', () => {
    render(<AmountInWordsRupees />)
    type('1.234')
    expect(screen.getByText(/at most two decimal places/i)).toBeInTheDocument()
  })
})
