import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ColorConverter from '@/components/tools/ColorConverter'

describe('ColorConverter', () => {
  it('converts #ff0000 to rgb(255, 0, 0)', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#ff0000' } })
    expect(screen.getByText('rgb(255, 0, 0)')).toBeInTheDocument()
  })

  it('converts #ff0000 to hsl(0, 100%, 50%)', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#ff0000' } })
    expect(screen.getByText('hsl(0, 100%, 50%)')).toBeInTheDocument()
  })

  it('shows lowercase hex output', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#FF0000' } })
    expect(screen.getByText('#ff0000')).toBeInTheDocument()
  })

  it('expands shorthand #rgb to full hex', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#f00' } })
    expect(screen.getByText('rgb(255, 0, 0)')).toBeInTheDocument()
  })

  it('converts #00ff00 (green) correctly', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#00ff00' } })
    expect(screen.getByText('rgb(0, 255, 0)')).toBeInTheDocument()
    expect(screen.getByText('hsl(120, 100%, 50%)')).toBeInTheDocument()
  })

  it('converts #0000ff (blue) correctly', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#0000ff' } })
    expect(screen.getByText('rgb(0, 0, 255)')).toBeInTheDocument()
    expect(screen.getByText('hsl(240, 100%, 50%)')).toBeInTheDocument()
  })

  it('converts #ffffff (white) to hsl(0, 0%, 100%)', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#ffffff' } })
    expect(screen.getByText('rgb(255, 255, 255)')).toBeInTheDocument()
    expect(screen.getByText('hsl(0, 0%, 100%)')).toBeInTheDocument()
  })

  it('converts #000000 (black) to hsl(0, 0%, 0%)', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#000000' } })
    expect(screen.getByText('rgb(0, 0, 0)')).toBeInTheDocument()
    expect(screen.getByText('hsl(0, 0%, 0%)')).toBeInTheDocument()
  })

  it('shows error for invalid hex', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#xyz' } })
    expect(screen.getByText(/Invalid hex color/i)).toBeInTheDocument()
  })

  it('shows error for partial hex like "#12"', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#12' } })
    expect(screen.getByText(/Invalid hex color/i)).toBeInTheDocument()
  })

  it('renders three CopyButtons for valid input', () => {
    render(<ColorConverter />)
    const input = screen.getByPlaceholderText('#rrggbb or #rgb')
    fireEvent.change(input, { target: { value: '#ff0000' } })
    const copyButtons = screen.getAllByText('copy')
    expect(copyButtons.length).toBeGreaterThanOrEqual(3)
  })
})
