import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NumberToWords from '@/components/tools/NumberToWords'

describe('NumberToWords', () => {
  function getOutput() {
    // The output is rendered in a div with style containing var(--bone)
    const el = document.querySelector('[style*="--bone"]') as HTMLElement | null
    return el?.textContent ?? ''
  }

  it('converts 0 to "zero"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '0' },
    })
    expect(getOutput()).toBe('zero')
  })

  it('converts 1 to "one"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '1' },
    })
    expect(getOutput()).toBe('one')
  })

  it('converts 13 to "thirteen"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '13' },
    })
    expect(getOutput()).toBe('thirteen')
  })

  it('converts 21 to "twenty-one"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '21' },
    })
    expect(getOutput()).toBe('twenty-one')
  })

  it('converts 100 to "one hundred"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '100' },
    })
    expect(getOutput()).toBe('one hundred')
  })

  it('converts 1234 to "one thousand two hundred thirty-four"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '1234' },
    })
    expect(getOutput()).toBe('one thousand two hundred thirty-four')
  })

  it('converts 1000000 to "one million"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '1000000' },
    })
    expect(getOutput()).toBe('one million')
  })

  it('converts 1000000000 to "one billion"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '1000000000' },
    })
    expect(getOutput()).toBe('one billion')
  })

  it('handles negative numbers', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '-42' },
    })
    expect(getOutput()).toBe('negative forty-two')
  })

  it('handles large numbers up to trillions', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '1000000000000' },
    })
    expect(getOutput()).toBe('one trillion')
  })

  it('capitalizes first letter when toggle is on', () => {
    render(<NumberToWords />)
    fireEvent.click(screen.getByLabelText('Capitalize first letter'))
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '42' },
    })
    const out = getOutput()
    expect(out.charAt(0)).toBe(out.charAt(0).toUpperCase())
    expect(out.charAt(0)).toBe('F') // "Forty-two"
  })

  it('shows error for non-numeric input', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: 'abc' },
    })
    expect(screen.getByText(/valid integer/i)).toBeInTheDocument()
  })

  it('shows error for decimal input', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '3.14' },
    })
    expect(screen.getByText(/valid integer/i)).toBeInTheDocument()
  })

  it('empty input shows no output and no error', () => {
    render(<NumberToWords />)
    expect(screen.queryByText(/valid integer/i)).not.toBeInTheDocument()
    expect(getOutput()).toBe('')
  })

  it('converts 999 to "nine hundred ninety-nine"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '999' },
    })
    expect(getOutput()).toBe('nine hundred ninety-nine')
  })

  it('converts 1001 to "one thousand one"', () => {
    render(<NumberToWords />)
    fireEvent.change(screen.getByPlaceholderText(/Enter an integer/), {
      target: { value: '1001' },
    })
    expect(getOutput()).toBe('one thousand one')
  })
})
