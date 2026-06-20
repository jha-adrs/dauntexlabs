import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RandomNamePicker from '@/components/tools/RandomNamePicker'

const NAMES = 'Alice\nBob\nCarol'

function setup() {
  render(<RandomNamePicker />)
  const textarea = screen.getByPlaceholderText(/Alice/)
  fireEvent.change(textarea, { target: { value: NAMES } })
  return { textarea }
}

describe('RandomNamePicker', () => {
  it('shows info prompt before any action', () => {
    render(<RandomNamePicker />)
    expect(screen.getByText(/pick or shuffle/i)).toBeInTheDocument()
  })

  it('picking 1 name yields one of the input names', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /^Pick$/ }))
    const picked = screen.queryByText('Alice') || screen.queryByText('Bob') || screen.queryByText('Carol')
    expect(picked).not.toBeNull()
  })

  it('picking 1 name shows exactly one result', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /^Pick$/ }))
    // Results are in acid-colored divs; the picked section header says "picked"
    expect(screen.getByText('picked')).toBeInTheDocument()
    // Only one name from the pool should appear as a large result
    const validNames = ['Alice', 'Bob', 'Carol']
    const found = validNames.filter((n) => {
      try {
        screen.getByText(n)
        return true
      } catch {
        return false
      }
    })
    expect(found.length).toBe(1)
  })

  it('picking 2 unique from 3 yields 2 distinct names', () => {
    setup()
    // Set count to 2
    const countInput = screen.getByPlaceholderText('1')
    fireEvent.change(countInput, { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /^Pick$/ }))

    const validNames = ['Alice', 'Bob', 'Carol']
    const found = validNames.filter((n) => {
      try {
        screen.getByText(n)
        return true
      } catch {
        return false
      }
    })
    expect(found.length).toBe(2)
    // All found must be distinct (which they always are since they're Set-filtered from the pool)
    expect(new Set(found).size).toBe(2)
  })

  it('empty list → shows error', () => {
    render(<RandomNamePicker />)
    fireEvent.click(screen.getByRole('button', { name: /^Pick$/ }))
    expect(screen.getByText(/enter at least one name/i)).toBeInTheDocument()
  })

  it('empty list on shuffle → shows error', () => {
    render(<RandomNamePicker />)
    fireEvent.click(screen.getByRole('button', { name: /shuffle list/i }))
    expect(screen.getByText(/enter at least one name/i)).toBeInTheDocument()
  })

  it('shows an error when requesting more unique picks than names', () => {
    setup()
    const countInput = screen.getByPlaceholderText('1')
    fireEvent.change(countInput, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /^Pick$/ }))
    expect(screen.getByText(/cannot pick 5 unique/i)).toBeInTheDocument()
  })

  it('shuffle shows all names in a new order column', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /shuffle list/i }))
    // All three names should appear in the shuffled section
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
    expect(screen.getByText('shuffled order')).toBeInTheDocument()
  })

  it('allow duplicates: picking 5 from 3 succeeds', () => {
    setup()
    const countInput = screen.getByPlaceholderText('1')
    fireEvent.change(countInput, { target: { value: '5' } })
    fireEvent.click(screen.getByLabelText('Allow duplicates'))
    fireEvent.click(screen.getByRole('button', { name: /^Pick$/ }))
    // Should not show error
    expect(screen.queryByText(/cannot pick/i)).toBeNull()
    // Should show "picked" heading
    expect(screen.getByText('picked')).toBeInTheDocument()
  })
})
