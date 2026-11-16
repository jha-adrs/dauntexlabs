import { describe, it, expect } from 'vitest'
import { generateMetadata } from '@/app/tools/[slug]/page'
import { tools } from '@/lib/tools'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })
const tool = (slug: string) => tools.find((t) => t.slug === slug)!

describe('tool page metadata: optional search-facing title', () => {
  it('date-calculator uses its title for <title> and OG, keeps its name', async () => {
    const m = await generateMetadata(params('date-calculator'))
    expect(m.title).toBe('Date Calculator: Add or Subtract Days, Weeks, Months or Years')
    expect(m.openGraph?.title).toBe('Date Calculator: Add or Subtract Days, Weeks, Months or Years — dauntexlabs')
    expect(m.description).toBe(
      'Add or subtract days, weeks, months, years or business days from any date, for example 30 days before today or 90 days after a date.',
    )
    expect(tool('date-calculator').name).toBe('Date Add / Subtract')
  })

  it('tip-calculator uses its title, keeps its name', async () => {
    const m = await generateMetadata(params('tip-calculator'))
    expect(m.title).toBe('Tip Calculator with Bill Split (Tip per Person)')
    expect(m.description).toBe(
      "Enter the bill, tip percentage and number of people to get the tip, the total and each person's share.",
    )
    expect(tool('tip-calculator').name).toBe('Tip & Bill Split Calculator')
  })

  it('falls back to the name when no title is set', async () => {
    const m = await generateMetadata(params('base64'))
    expect(m.title).toBe(tool('base64').name)
    expect(m.openGraph?.title).toBe(`${tool('base64').name} — dauntexlabs`)
  })
})
