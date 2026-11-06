import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExamPhotoResizer from '@/components/tools/ExamPhotoResizer'
import { PHOTO_PRESETS } from '@/lib/photo-presets'

describe('ExamPhotoResizer', () => {
  it('lists every preset and defaults to IBPS', () => {
    const { container } = render(<ExamPhotoResizer />)
    const sel = container.querySelector('select.sel') as HTMLSelectElement
    expect(sel.options).toHaveLength(PHOTO_PRESETS.length)
    expect(sel.value).toBe('ibps-photo-signature-size')
    expect(screen.getByRole('region', { name: 'Left thumb impression' })).toBeInTheDocument()
    // next/link drops the trailing slash under Vitest
    expect(screen.getByRole('link', { name: /full page/i }).getAttribute('href')?.replace(/\/$/, '')).toBe('/photo/ibps-photo-signature-size')
  })
  it('switches preset', () => {
    const { container } = render(<ExamPhotoResizer />)
    fireEvent.change(container.querySelector('select.sel')!, { target: { value: 'ssc-signature-size' } })
    expect(screen.queryByRole('region', { name: 'Photo' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Signature' })).toBeInTheDocument()
    // next/link drops the trailing slash under Vitest
    expect(screen.getByRole('link', { name: /full page/i }).getAttribute('href')?.replace(/\/$/, '')).toBe('/photo/ssc-signature-size')
  })
})
