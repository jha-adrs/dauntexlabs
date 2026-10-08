import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import HindiTypingKeyboard from '@/components/tools/HindiTypingKeyboard'

const input = () => screen.getByPlaceholderText(/type here/i)
const output = () => screen.getByPlaceholderText('Hindi text appears here…')

describe('HindiTypingKeyboard', () => {
  it('types Remington (Gail) by default', () => {
    render(<HindiTypingKeyboard />)
    fireEvent.change(input(), { target: { value: 'Hkkjr deZ' } })
    expect(output()).toHaveValue('भारत कर्म')
  })

  it('switches to InScript', () => {
    render(<HindiTypingKeyboard />)
    fireEvent.click(screen.getByRole('tab', { name: 'InScript' }))
    fireEvent.change(input(), { target: { value: 'jhl' } })
    expect(output()).toHaveValue('रपत')
  })

  it('backspace works on the raw keys', () => {
    render(<HindiTypingKeyboard />)
    fireEvent.click(screen.getByRole('tab', { name: 'InScript' }))
    fireEvent.change(input(), { target: { value: 'kd' } })
    expect(output()).toHaveValue('क्')
    fireEvent.change(input(), { target: { value: 'k' } })
    expect(output()).toHaveValue('क')
  })

  it('offers copy and download .txt', () => {
    render(<HindiTypingKeyboard />)
    expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download .txt' })).toBeInTheDocument()
  })

  it('renders a 4-row layout chart', () => {
    render(<HindiTypingKeyboard />)
    const chart = screen.getByRole('table', { name: /layout chart/i })
    expect(within(chart).getAllByRole('row')).toHaveLength(4)
  })
})
