import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConvertPage, { generateMetadata } from '@/app/convert/[slug]/page'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('number-scale metadata (quick win #1)', () => {
  it('titles number-scale pages as a singular converter with abbreviations', async () => {
    const m = await generateMetadata(params('crores-to-billions'))
    expect(m.title).toBe('Crore to Billion Converter (Cr to Bn)')
    expect(m.openGraph?.title).toBe('Crore to Billion Converter (Cr to Bn) — dauntexlabs')
    expect(m.description).toBe(
      'Convert crores to billions instantly and free. 1 crore = 0.01 billion. Designed to run in your browser.',
    )
    expect((await generateMetadata(params('thousands-to-millions'))).title).toBe(
      'Thousand to Million Converter (K to Mn)',
    )
    expect((await generateMetadata(params('lakh-crores-to-trillions'))).title).toBe(
      'Lakh Crore to Trillion Converter (L Cr to Tn)',
    )
  })

  it('mentions the "lac" spelling on lakh pages only', async () => {
    const lakh = await generateMetadata(params('lakhs-to-crores'))
    expect(lakh.title).toBe('Lakh to Crore Converter (Lakh to Cr)')
    expect(lakh.description).toContain('lakhs (also written lac)')
    expect((await generateMetadata(params('lakh-crores-to-trillions'))).description).toMatch(
      /^Convert lakh crores \(also written lac crore\) to trillions/,
    )
    expect((await generateMetadata(params('crores-to-lakh-crores'))).description).toMatch(
      /^Convert crores to lakh crores \(also written lac crore\) instantly/,
    )
    expect((await generateMetadata(params('crores-to-billions'))).description).not.toContain('lac')
  })

  it('omits the abbreviations when they only repeat the unit names', async () => {
    expect((await generateMetadata(params('lakhs-to-arab'))).title).toBe('Lakh to Arab Converter')
    expect((await generateMetadata(params('arab-to-crores'))).title).toBe('Arab to Crore Converter (Arab to Cr)')
  })

  it('leaves other pairs unchanged', async () => {
    const m = await generateMetadata(params('kilograms-to-pounds'))
    expect(m.title).toBe('Kilograms to Pounds')
    expect((await generateMetadata(params('binary-to-octal'))).title).toBe('Binary to Octal')
    expect((await generateMetadata(params('png-to-jpg'))).title).toBe('PNG to JPG')
  })

  it('keeps the H1 and lede readable', async () => {
    const { container } = render(await ConvertPage(params('crores-to-billions')))
    expect(screen.getByRole('heading', { level: 1, name: 'Convert Crores to Billions' })).toBeTruthy()
    expect(container.textContent).toContain('1 crore = 0.01 billion — convert any value')
  })

  it('groups large values in the lede', async () => {
    const { container } = render(await ConvertPage(params('trillions-to-crores')))
    expect(container.textContent).toContain('1 trillion = 100,000 crore — convert any value')
  })

  it('table headers skip a symbol that repeats the unit name', async () => {
    const { container } = render(await ConvertPage(params('arab-to-crores')))
    const head = container.querySelector('.conv-table-h')!.textContent
    expect(head).toBe('ArabCrores (Cr)')
  })

  it('related links prefer pairs sharing a unit', async () => {
    const { container } = render(await ConvertPage(params('billions-to-arab')))
    const siblings = [...container.querySelectorAll('.conv-links a.conv-chip:not(.rev):not(.parent)')].map((a) =>
      a.getAttribute('href'),
    )
    expect(siblings).toHaveLength(6)
    for (const h of siblings) expect(h).toMatch(/billions|arab/)
    expect(siblings.filter((h) => /arab/.test(h ?? '')).length).toBeGreaterThan(1)
  })
})

describe('convert page worked examples', () => {
  it('renders query-phrased worked examples in the static HTML', async () => {
    const { container } = render(await ConvertPage(params('billions-to-millions')))
    expect(screen.getByRole('heading', { level: 2, name: 'Billion in million: common values' })).toBeTruthy()
    expect(container.textContent).toContain('1.49 billion in million = 1490 million')
  })

  it('uses the plural unit words for measurement pairs', async () => {
    const { container } = render(await ConvertPage(params('fluid-ounces-to-gallons')))
    expect(screen.getByRole('heading', { level: 2, name: 'Fluid ounces in gallons: common values' })).toBeTruthy()
    expect(container.textContent).toContain('128 fluid ounces in gallons = 1 gal')
  })

  it('omits the section on commodity pages', async () => {
    render(await ConvertPage(params('kilometers-to-miles')))
    expect(screen.queryByRole('heading', { level: 2, name: /common values/ })).toBeNull()
  })
})
