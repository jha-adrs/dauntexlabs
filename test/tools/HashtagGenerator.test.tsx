import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HashtagGenerator from '@/components/tools/HashtagGenerator'

function setInput(value: string) {
  fireEvent.change(
    screen.getByPlaceholderText('social media, marketing, content creation'),
    { target: { value } },
  )
}

describe('HashtagGenerator', () => {
  it('shows prompt when input is empty', () => {
    render(<HashtagGenerator />)
    expect(screen.getByText(/Enter keywords/i)).toBeInTheDocument()
  })

  it('generates #socialmedia and #marketing from newline-separated input', () => {
    render(<HashtagGenerator />)
    setInput('social media\nmarketing')
    // CamelCase is ON by default: "social media" → #socialMedia
    // But with camelCase, multi-word → socialMedia
    expect(screen.getByText('#socialMedia')).toBeInTheDocument()
    expect(screen.getByText('#marketing')).toBeInTheDocument()
  })

  it('with CamelCase OFF produces concatenated lowercase', () => {
    render(<HashtagGenerator />)
    // Toggle CamelCase off
    fireEvent.click(screen.getByLabelText('CamelCase multi-word phrases'))
    setInput('social media\nmarketing')
    expect(screen.getByText('#socialmedia')).toBeInTheDocument()
    expect(screen.getByText('#marketing')).toBeInTheDocument()
  })

  it('output string contains #socialmedia and #marketing (CamelCase off)', () => {
    render(<HashtagGenerator />)
    fireEvent.click(screen.getByLabelText('CamelCase multi-word phrases'))
    setInput('social media\nmarketing')
    const textarea = screen.getByPlaceholderText('hashtags…') as HTMLTextAreaElement
    expect(textarea.value).toContain('#socialmedia')
    expect(textarea.value).toContain('#marketing')
  })

  it('handles comma-separated input', () => {
    render(<HashtagGenerator />)
    setInput('react, typescript, web dev')
    expect(screen.getByText('#react')).toBeInTheDocument()
    expect(screen.getByText('#typescript')).toBeInTheDocument()
  })

  it('deduplicates identical hashtags', () => {
    render(<HashtagGenerator />)
    setInput('react\nreact\nReact')
    // The chip area should only have one #react chip (not 3)
    // The textarea also shows the output, so there may be 2 elements total (chip + textarea)
    // but the number of chips must equal 1
    const allReact = screen.getAllByText('#react')
    // At most 2: one chip span + the output textarea; the chip count must be 1
    const chips = allReact.filter((el) => el.tagName.toLowerCase() === 'span')
    expect(chips.length).toBe(1)
  })

  it('strips non-alphanumeric characters from keywords', () => {
    render(<HashtagGenerator />)
    setInput('hello-world!')
    // "hello world" after strip — with CamelCase ON: #helloWorld
    const matches = screen.getAllByText(/^#hello/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows count of generated hashtags', () => {
    render(<HashtagGenerator />)
    setInput('react\ntypescript\nnextjs')
    expect(screen.getByText(/3 hashtags/i)).toBeInTheDocument()
  })

  it('single-word phrases are lowercase with # prefix', () => {
    render(<HashtagGenerator />)
    setInput('Marketing')
    // chip + textarea may both show #marketing
    expect(screen.getAllByText('#marketing').length).toBeGreaterThanOrEqual(1)
  })

  it('CamelCase multi-word: "content creation" becomes #contentCreation', () => {
    render(<HashtagGenerator />)
    setInput('content creation')
    // CamelCase is ON by default; chip + textarea both show it
    expect(screen.getAllByText('#contentCreation').length).toBeGreaterThanOrEqual(1)
  })

  it('output textarea contains space-separated tags', () => {
    render(<HashtagGenerator />)
    setInput('react\ntypescript')
    const textarea = screen.getByPlaceholderText('hashtags…') as HTMLTextAreaElement
    // Should be space separated
    expect(textarea.value).toMatch(/#\w+ #\w+/)
  })
})
