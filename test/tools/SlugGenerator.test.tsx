import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SlugGenerator from '@/components/tools/SlugGenerator'

describe('SlugGenerator', () => {
  function getOutput() {
    return (screen.getByPlaceholderText('Result…') as HTMLTextAreaElement).value
  }

  it('shows empty output for empty input', () => {
    render(<SlugGenerator />)
    expect(getOutput()).toBe('')
  })

  it('converts "Hello, World! Café" to "hello-world-cafe"', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'Hello, World! Café' },
    })
    expect(getOutput()).toBe('hello-world-cafe')
  })

  it('converts to underscore separator when selected', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByDisplayValue('Hyphen ( - )'), {
      target: { value: '_' },
    })
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'Hello World' },
    })
    expect(getOutput()).toBe('hello_world')
  })

  it('preserves case when lowercase toggle is off', () => {
    render(<SlugGenerator />)
    // Toggle off the lowercase checkbox (it's on by default)
    fireEvent.click(screen.getByLabelText('Lowercase'))
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'Hello World' },
    })
    expect(getOutput()).toBe('Hello-World')
  })

  it('strips diacritics from accented characters', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'naïve résumé' },
    })
    expect(getOutput()).toBe('naive-resume')
  })

  it('trims leading and trailing separators', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: '---hello world---' },
    })
    expect(getOutput()).toBe('hello-world')
  })

  it('collapses multiple separators into one', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'hello   world' },
    })
    expect(getOutput()).toBe('hello-world')
  })

  it('handles already-slugified input unchanged', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'hello-world' },
    })
    expect(getOutput()).toBe('hello-world')
  })

  it('handles numbers in input', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'Chapter 42: The Answer' },
    })
    expect(getOutput()).toBe('chapter-42-the-answer')
  })

  it('handles underscore separator + no lowercase for "Hello World Café"', () => {
    render(<SlugGenerator />)
    fireEvent.change(screen.getByDisplayValue('Hyphen ( - )'), {
      target: { value: '_' },
    })
    fireEvent.click(screen.getByLabelText('Lowercase'))
    fireEvent.change(screen.getByPlaceholderText('Hello, World! Café au lait…'), {
      target: { value: 'Hello World Café' },
    })
    expect(getOutput()).toBe('Hello_World_Cafe')
  })
})
