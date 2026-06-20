import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BoxShadowGenerator from '@/components/tools/BoxShadowGenerator'

function out() {
  return (screen.getByPlaceholderText('box-shadow CSS…') as HTMLTextAreaElement).value
}

describe('BoxShadowGenerator', () => {
  it('produces a box-shadow string with px units by default', () => {
    render(<BoxShadowGenerator />)
    const v = out()
    expect(v.startsWith('box-shadow:')).toBe(true)
    expect(v).toContain('px')
    expect(v).not.toContain('inset')
  })

  it('adds inset when the toggle is enabled', () => {
    render(<BoxShadowGenerator />)
    fireEvent.click(screen.getByLabelText('inset'))
    expect(out()).toContain('inset')
  })

  it('reflects slider changes in the CSS', () => {
    render(<BoxShadowGenerator />)
    fireEvent.change(screen.getByLabelText('blur'), { target: { value: '40' } })
    expect(out()).toContain('40px')
  })

  it('reflects the chosen color', () => {
    render(<BoxShadowGenerator />)
    fireEvent.change(screen.getByLabelText('color'), { target: { value: '#ff0000' } })
    expect(out()).toContain('#ff0000')
  })
})
