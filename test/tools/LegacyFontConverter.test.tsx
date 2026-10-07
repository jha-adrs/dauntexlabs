import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KrutiDevToUnicode from '@/components/tools/KrutiDevToUnicode'
import DevLysToUnicode from '@/components/tools/DevLysToUnicode'
import ChanakyaToUnicode from '@/components/tools/ChanakyaToUnicode'
import ShivajiToUnicode from '@/components/tools/ShivajiToUnicode'

const input = () => screen.getAllByRole('textbox')[0]
const output = () => screen.getByPlaceholderText('Result…')

describe('LegacyFontConverter', () => {
  it('converts Kruti Dev to Unicode', () => {
    render(<KrutiDevToUnicode />)
    fireEvent.change(input(), { target: { value: 'Hkkjr deZ' } })
    expect(output()).toHaveValue('भारत कर्म')
  })

  it('converts Unicode to Kruti Dev and says the font must be installed', () => {
    render(<KrutiDevToUnicode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Unicode → Legacy' }))
    fireEvent.change(input(), { target: { value: 'हिन्दी' } })
    expect(output()).toHaveValue('fgUnh')
    expect(screen.getByText(/only looks right in the Kruti Dev 010 font/i)).toBeInTheDocument()
  })

  it('warns when Unicode is pasted in the legacy → Unicode direction', () => {
    render(<KrutiDevToUnicode />)
    fireEvent.change(input(), { target: { value: 'भारत' } })
    expect(screen.getByText(/already looks like Unicode/i)).toBeInTheDocument()
  })

  it('warns when legacy text is pasted in the Unicode → legacy direction', () => {
    render(<KrutiDevToUnicode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Unicode → Legacy' }))
    fireEvent.change(input(), { target: { value: 'Hkkjr' } })
    expect(screen.getByText(/doesn't look like Unicode Hindi/i)).toBeInTheDocument()
  })

  it('DevLys uses the Kruti Dev layout', () => {
    render(<DevLysToUnicode />)
    fireEvent.change(input(), { target: { value: 'fgUnh' } })
    expect(output()).toHaveValue('हिन्दी')
  })

  it('converts Chanakya to Unicode', () => {
    render(<ChanakyaToUnicode />)
    fireEvent.change(input(), { target: { value: 'ÖæÚUÌ' } })
    expect(output()).toHaveValue('भारत')
  })

  it('converts Shivaji to Unicode and blocks the unsupported direction', () => {
    render(<ShivajiToUnicode />)
    fireEvent.change(input(), { target: { value: 'maharaYT/' } })
    expect(output()).toHaveValue('महाराष्ट्र')
    fireEvent.click(screen.getByRole('tab', { name: 'Unicode → Legacy' }))
    expect(screen.getByText(/Unicode → Shivaji isn't available/i)).toBeInTheDocument()
    expect(output()).toHaveValue('')
  })

  it('is empty for empty input', () => {
    render(<KrutiDevToUnicode />)
    expect(output()).toHaveValue('')
  })
})
