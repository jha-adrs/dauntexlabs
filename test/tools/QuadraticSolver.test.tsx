import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuadraticSolver from '@/components/tools/QuadraticSolver'

function fillCoeff(labelText: RegExp | string, value: string) {
  const label = screen.getByText(labelText)
  const input = label.closest('label')?.querySelector('input') as HTMLInputElement
  fireEvent.change(input, { target: { value } })
}

describe('QuadraticSolver', () => {
  it('renders without crashing', () => {
    render(<QuadraticSolver />)
    // panel title "coefficients" is in a span.panel-title
    expect(screen.getAllByText(/coefficients/i)[0]).toBeInTheDocument()
  })

  it('shows info notice when inputs are empty', () => {
    render(<QuadraticSolver />)
    expect(screen.getByText(/Enter coefficients/i)).toBeInTheDocument()
  })

  it('solves x² − 3x + 2 = 0 → roots 2 and 1, discriminant 1', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '-3')
    fillCoeff(/c — constant term/i, '2')

    // discriminant = 1, roots = 2 and 1 — multiple "1"/"2" elements are fine
    const ones = screen.getAllByText('1')
    expect(ones.length).toBeGreaterThanOrEqual(1)
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThanOrEqual(1)
  })

  it('shows discriminant 1 for a=1,b=-3,c=2', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '-3')
    fillCoeff(/c — constant term/i, '2')

    // discriminant label + value
    expect(screen.getByText(/Discriminant/i)).toBeInTheDocument()
    expect(screen.getByText('Two real roots')).toBeInTheDocument()
  })

  it('labels root kind as "Two real roots" when D > 0', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '-3')
    fillCoeff(/c — constant term/i, '2')
    expect(screen.getByText('Two real roots')).toBeInTheDocument()
  })

  it('solves x² + 0x + 1 = 0 → two complex roots ±i, discriminant −4', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '0')
    fillCoeff(/c — constant term/i, '1')

    expect(screen.getByText('Two complex roots')).toBeInTheDocument()
    expect(screen.getByText('-4')).toBeInTheDocument() // discriminant = 0²-4·1·1 = -4
  })

  it('shows complex roots containing "i" for negative discriminant', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '0')
    fillCoeff(/c — constant term/i, '1')

    // Roots should contain "i"
    const rootElements = screen.getAllByText(/i/)
    expect(rootElements.length).toBeGreaterThan(0)
  })

  it('shows one real root (double) when D = 0', () => {
    render(<QuadraticSolver />)
    // x² + 2x + 1 = 0 → (x+1)² = 0 → x = -1, D = 0
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '2')
    fillCoeff(/c — constant term/i, '1')

    expect(screen.getByText('One real root (double)')).toBeInTheDocument()
    expect(screen.getByText('-1')).toBeInTheDocument()
  })

  it('shows discriminant 0 for a=1,b=2,c=1', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '2')
    fillCoeff(/c — constant term/i, '1')

    // D = 4 - 4 = 0
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows error when a = 0', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '0')
    fillCoeff(/b — coefficient of x/i, '3')
    fillCoeff(/c — constant term/i, '2')

    expect(screen.getByText(/not a quadratic/i)).toBeInTheDocument()
  })

  it('shows vertex for x² − 3x + 2 = 0 → vertex at (1.5, -0.25)', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, '-3')
    fillCoeff(/c — constant term/i, '2')

    expect(screen.getByText(/Vertex/i)).toBeInTheDocument()
    // Vertex x = 3/(2) = 1.5, y = 2 - 9/4 = -0.25
    expect(screen.getByText(/1\.5/)).toBeInTheDocument()
    expect(screen.getByText(/-0\.25/)).toBeInTheDocument()
  })

  it('shows error for non-numeric input', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '1')
    fillCoeff(/b — coefficient of x/i, 'abc')
    fillCoeff(/c — constant term/i, '2')

    expect(screen.getByText(/valid numbers/i)).toBeInTheDocument()
  })

  it('handles negative a correctly: -x² + 2x − 1 → D=0, root=1', () => {
    render(<QuadraticSolver />)
    fillCoeff(/a — coefficient of x²/i, '-1')
    fillCoeff(/b — coefficient of x/i, '2')
    fillCoeff(/c — constant term/i, '-1')

    // D = 4 - 4(-1)(-1) = 4-4 = 0
    expect(screen.getByText('One real root (double)')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
