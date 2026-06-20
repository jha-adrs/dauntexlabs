import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CitationGenerator from '@/components/tools/CitationGenerator'

function fillField(labelText: string | RegExp, value: string) {
  const label = screen.getByText(labelText)
  const input = label.closest('label')?.querySelector('input') as HTMLInputElement
  fireEvent.change(input, { target: { value } })
}

function clickTab(name: string) {
  fireEvent.click(screen.getByRole('tab', { name }))
}

function getCitation(): string {
  const q = screen.queryByRole('blockquote') ?? document.querySelector('blockquote')
  return q?.textContent ?? ''
}

describe('CitationGenerator', () => {
  it('renders without crashing', () => {
    render(<CitationGenerator />)
    expect(screen.getAllByText(/source details/i)[0]).toBeInTheDocument()
  })

  it('shows info notice when no fields are filled', () => {
    render(<CitationGenerator />)
    expect(screen.getByText(/Fill in the source details/i)).toBeInTheDocument()
  })

  it('generates APA book citation: Smith, J. (2020). Deep Work. Focus Press.', () => {
    render(<CitationGenerator />)
    // APA + Book are the defaults

    fillField(/Author/i, 'Smith, J.')
    fillField(/Title/i, 'Deep Work')
    fillField(/Year/i, '2020')
    fillField(/Publisher/i, 'Focus Press')

    const citation = getCitation()
    expect(citation).toMatch(/Smith, J\./)
    expect(citation).toMatch(/\(2020\)/)
    expect(citation).toMatch(/Deep Work/)
    expect(citation).toMatch(/Focus Press/)
  })

  it('APA book puts year before title', () => {
    render(<CitationGenerator />)
    fillField(/Author/i, 'Smith, J.')
    fillField(/Year/i, '2020')
    fillField(/Title/i, 'Deep Work')
    fillField(/Publisher/i, 'Focus Press')

    const citation = getCitation()
    const yearPos = citation.indexOf('(2020)')
    const titlePos = citation.indexOf('Deep Work')
    expect(yearPos).toBeLessThan(titlePos)
  })

  it('switches to MLA format when MLA tab clicked', () => {
    render(<CitationGenerator />)
    clickTab('MLA')
    fillField(/Author/i, 'Smith, John')
    fillField(/Title/i, 'Deep Work')
    fillField(/Year/i, '2020')
    fillField(/Publisher/i, 'Focus Press')

    const citation = getCitation()
    // MLA: Author. Title. Publisher, Year.
    expect(citation).toMatch(/Smith, John/)
    expect(citation).toMatch(/Deep Work/)
    expect(citation).toMatch(/Focus Press, 2020/)
  })

  it('MLA places title before year (author first, then title, then publisher+year)', () => {
    render(<CitationGenerator />)
    clickTab('MLA')
    fillField(/Author/i, 'Smith, John')
    fillField(/Title/i, 'Deep Work')
    fillField(/Year/i, '2020')
    fillField(/Publisher/i, 'Focus Press')

    const citation = getCitation()
    const titlePos = citation.indexOf('Deep Work')
    const yearPos = citation.indexOf('2020')
    expect(titlePos).toBeLessThan(yearPos)
  })

  it('switches to Chicago format', () => {
    render(<CitationGenerator />)
    clickTab('Chicago')
    fillField(/Author/i, 'Smith, John')
    fillField(/Title/i, 'Deep Work')
    fillField(/Year/i, '2020')
    fillField(/Publisher/i, 'Focus Press')

    const citation = getCitation()
    expect(citation).toMatch(/Smith, John/)
    expect(citation).toMatch(/Deep Work/)
    expect(citation).toMatch(/2020/)
  })

  it('APA and MLA produce different formats', () => {
    const { unmount } = render(<CitationGenerator />)
    fillField(/Author/i, 'Smith, J.')
    fillField(/Title/i, 'Deep Work')
    fillField(/Year/i, '2020')
    fillField(/Publisher/i, 'Focus Press')
    const apaCitation = getCitation()
    unmount()

    render(<CitationGenerator />)
    clickTab('MLA')
    fillField(/Author/i, 'Smith, J.')
    fillField(/Title/i, 'Deep Work')
    fillField(/Year/i, '2020')
    fillField(/Publisher/i, 'Focus Press')
    const mlaCitation = getCitation()

    expect(apaCitation).not.toBe(mlaCitation)
  })

  it('switches to Website source type and shows URL fields', () => {
    render(<CitationGenerator />)
    clickTab('Website')
    expect(screen.getByText(/Site \/ Organisation Name/i)).toBeInTheDocument()
    expect(screen.getByText(/URL/i)).toBeInTheDocument()
    expect(screen.getByText(/Access date/i)).toBeInTheDocument()
  })

  it('generates APA website citation', () => {
    render(<CitationGenerator />)
    clickTab('Website')

    fillField(/Author/i, 'Jones, A.')
    fillField(/Title/i, 'Climate Facts')
    fillField(/Year/i, '2024')
    fillField(/Site \/ Organisation Name/i, 'EcoSite')
    fillField(/URL/i, 'https://ecosite.org/climate')
    fillField(/Access date/i, 'June 20, 2026')

    const citation = getCitation()
    expect(citation).toMatch(/Jones, A\./)
    expect(citation).toMatch(/\(2024\)/)
    expect(citation).toMatch(/Climate Facts/)
    expect(citation).toMatch(/EcoSite/)
    expect(citation).toMatch(/https:\/\/ecosite\.org\/climate/)
  })

  it('generates MLA website citation with "Accessed" keyword', () => {
    render(<CitationGenerator />)
    clickTab('MLA')
    clickTab('Website')

    fillField(/Author/i, 'Jones, Alex')
    fillField(/Title/i, 'Climate Facts')
    fillField(/Year/i, '2024')
    fillField(/Site \/ Organisation Name/i, 'EcoSite')
    fillField(/URL/i, 'https://ecosite.org/climate')
    fillField(/Access date/i, '20 June 2026')

    const citation = getCitation()
    expect(citation).toMatch(/Accessed 20 June 2026/)
  })

  it('generates Chicago website citation with URL at end', () => {
    render(<CitationGenerator />)
    clickTab('Chicago')
    clickTab('Website')

    fillField(/Author/i, 'Jones, Alex')
    fillField(/Title/i, 'Climate Facts')
    fillField(/Year/i, '2024')
    fillField(/Site \/ Organisation Name/i, 'EcoSite')
    fillField(/URL/i, 'https://ecosite.org/climate')
    fillField(/Access date/i, 'June 20, 2026')

    const citation = getCitation()
    const urlPos = citation.indexOf('https://ecosite.org/climate')
    const titlePos = citation.indexOf('Climate Facts')
    expect(urlPos).toBeGreaterThan(titlePos)
    expect(urlPos).toBeGreaterThan(-1)
  })

  it('works with partial fields (only author + title)', () => {
    render(<CitationGenerator />)
    fillField(/Author/i, 'Doe, J.')
    fillField(/Title/i, 'Sample Book')

    const citation = getCitation()
    expect(citation).toMatch(/Doe, J\./)
    expect(citation).toMatch(/Sample Book/)
  })

  it('shows label with style and source type in output panel', () => {
    render(<CitationGenerator />)
    fillField(/Author/i, 'Smith, J.')
    fillField(/Title/i, 'Test')

    expect(screen.getByText(/APA · Book/)).toBeInTheDocument()
  })
})
