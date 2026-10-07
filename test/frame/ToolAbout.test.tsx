import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ToolAbout from '@/components/ToolAbout'
import { tools } from '@/lib/tools'

vi.mock('@/lib/tool-content', () => ({
  TOOL_CONTENT: {
    'keyword-density': {
      intro: ['First paragraph.', 'Second paragraph.'],
      steps: ['Paste text.', 'Pick options.', 'Read results.'],
      faq: [
        { q: 'What is keyword density?', a: 'A ratio.' },
        { q: 'Is my text sent anywhere?', a: 'It is processed on your device.' },
        { q: 'What is a good density?', a: 'It depends.' },
      ],
    },
  },
}))

const tool = (slug: string) => tools.find((t) => t.slug === slug)!

describe('ToolAbout', () => {
  it('renders about, how-to and FAQ for a tool with content', () => {
    const { container } = render(<ToolAbout tool={tool('keyword-density')} />)
    expect(screen.getByRole('heading', { name: 'About Keyword Density Analyzer' })).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How to use' })).toBeInTheDocument()
    expect(container.querySelectorAll('ol li')).toHaveLength(3)
    const details = container.querySelectorAll('details.faq')
    expect(details).toHaveLength(3)
    expect(details[0]).toHaveAttribute('open')
    expect(details[1]).not.toHaveAttribute('open')
  })

  it('emits FAQPage structured data matching the FAQ', () => {
    const { container } = render(<ToolAbout tool={tool('keyword-density')} />)
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(3)
    expect(ld.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'What is keyword density?',
      acceptedAnswer: { '@type': 'Answer', text: 'A ratio.' },
    })
  })

  it('renders nothing for a tool without content', () => {
    const { container } = render(<ToolAbout tool={tool('base64')} />)
    expect(container).toBeEmptyDOMElement()
  })
})
