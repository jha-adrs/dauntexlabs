import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FractionCalculator from '@/components/tools/FractionCalculator'

function fill(placeholder: string, value: string) {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } })
}

// The four number inputs share the same placeholder pattern from TextInput type="number"
// We distinguish by label text; use getByRole + name approach is complex in jsdom with Field labels.
// Instead we rely on placeholder text set in the component.
function fillByLabel(labelText: string | RegExp, value: string) {
  const label = screen.getByText(labelText)
  const input = label.closest('label')?.querySelector('input') as HTMLInputElement
  fireEvent.change(input, { target: { value } })
}

describe('FractionCalculator', () => {
  it('renders without crashing', () => {
    render(<FractionCalculator />)
    // "fractions" appears in panel title
    expect(screen.getAllByText(/fractions/i)[0]).toBeInTheDocument()
  })

  it('shows initial info notice when no inputs entered', () => {
    render(<FractionCalculator />)
    expect(screen.getByText(/Enter fractions above/i)).toBeInTheDocument()
  })

  it('computes 1/2 + 1/3 = 5/6', () => {
    render(<FractionCalculator />)
    // Default op is '+'
    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    // Fraction A
    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })
    // Fraction B
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '3' },
    })

    expect(screen.getByText('5/6')).toBeInTheDocument()
  })

  it('shows decimal ≈ 0.833333 for 5/6', () => {
    render(<FractionCalculator />)

    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '3' },
    })

    const decimal = screen.getByText(/≈ 0\.8333/)
    expect(decimal).toBeInTheDocument()
  })

  it('reduces fractions: 2/4 + 0/5 = 1/2', () => {
    render(<FractionCalculator />)
    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '4' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '0' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '5' },
    })

    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('computes subtraction: 3/4 − 1/4 = 1/2', () => {
    render(<FractionCalculator />)

    // Switch to subtraction
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '−' } })

    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '3' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '4' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '4' },
    })

    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('computes multiplication: 2/3 × 3/4 = 1/2', () => {
    render(<FractionCalculator />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '×' } })

    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '3' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '3' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '4' },
    })

    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('computes division: 1/2 ÷ 1/4 = 2', () => {
    render(<FractionCalculator />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '÷' } })

    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '4' },
    })

    // 1/2 ÷ 1/4 = 2 (whole number displayed as "2")
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows error when denominator A is 0', () => {
    render(<FractionCalculator />)
    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '0' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })

    expect(screen.getByText(/Denominator cannot be zero/i)).toBeInTheDocument()
  })

  it('shows error for 1/2 ÷ 0/1 (divide by zero fraction)', () => {
    render(<FractionCalculator />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '÷' } })

    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '0' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })

    expect(screen.getByText(/Division by zero/i)).toBeInTheDocument()
  })

  it('shows mixed number for improper fractions: 7/4 + 3/4 = 5/2 → mixed 2 1/2', () => {
    render(<FractionCalculator />)
    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '7' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '4' },
    })
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '3' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '4' },
    })

    // 7/4 + 3/4 = 10/4 = 5/2
    expect(screen.getByText('5/2')).toBeInTheDocument()
    // Mixed: 2 1/2
    expect(screen.getByText('2 1/2')).toBeInTheDocument()
  })

  it('shows error for non-integer inputs', () => {
    render(<FractionCalculator />)
    const numerators = screen.getAllByText('Numerator')
    const denominators = screen.getAllByText('Denominator')

    // Deliberately leave numerator B as NaN by typing a non-number
    fireEvent.change(numerators[0].closest('label')!.querySelector('input')!, {
      target: { value: '1' },
    })
    fireEvent.change(denominators[0].closest('label')!.querySelector('input')!, {
      target: { value: '2' },
    })
    // Leave B empty → parseInt('') = NaN → error
    fireEvent.change(numerators[1].closest('label')!.querySelector('input')!, {
      target: { value: '' },
    })
    fireEvent.change(denominators[1].closest('label')!.querySelector('input')!, {
      target: { value: '' },
    })

    // With only A filled: an=1, ad=2, bn=NaN, bd=NaN → error
    expect(screen.getByText(/must be integers/i)).toBeInTheDocument()
  })
})
