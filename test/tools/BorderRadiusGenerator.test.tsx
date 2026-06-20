import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BorderRadiusGenerator from '@/components/tools/BorderRadiusGenerator'

function out() {
  return (screen.getByPlaceholderText('border-radius CSS…') as HTMLTextAreaElement).value
}

describe('BorderRadiusGenerator', () => {
  it('yields the single-value form when linked', () => {
    render(<BorderRadiusGenerator />)
    // link is on by default; set any corner to 10 -> all become 10
    fireEvent.change(screen.getByLabelText('top-left'), { target: { value: '10' } })
    expect(out()).toBe('border-radius: 10px;')
  })

  it('yields the 4-value form when unlinked with distinct corners', () => {
    render(<BorderRadiusGenerator />)
    fireEvent.click(screen.getByLabelText('link all corners')) // unlink
    fireEvent.change(screen.getByLabelText('top-left'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('top-right'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('bottom-right'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('bottom-left'), { target: { value: '20' } })
    expect(out()).toBe('border-radius: 5px 10px 15px 20px;')
  })

  it('keeps every corner in sync while linked', () => {
    render(<BorderRadiusGenerator />)
    fireEvent.change(screen.getByLabelText('bottom-right'), { target: { value: '30' } })
    expect(out()).toBe('border-radius: 30px;')
  })

  it('collapses to single-value when unlinked corners happen to match', () => {
    render(<BorderRadiusGenerator />)
    fireEvent.click(screen.getByLabelText('link all corners')) // unlink
    fireEvent.change(screen.getByLabelText('top-left'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('top-right'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('bottom-right'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('bottom-left'), { target: { value: '12' } })
    expect(out()).toBe('border-radius: 12px;')
  })
})
