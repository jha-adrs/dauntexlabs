import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SubtitleSyncFixer from '@/components/tools/SubtitleSyncFixer'

const SRT = [
  '1', '00:00:10,000 --> 00:00:11,000', 'First line', '',
  '2', '00:00:55,000 --> 00:00:56,000', 'Middle', '',
  '3', '00:01:40,000 --> 00:01:41,000', 'Last line', '',
].join('\n')

const output = () => (screen.getByLabelText('Output') as HTMLTextAreaElement).value

function paste(text = SRT) {
  render(<SubtitleSyncFixer />)
  fireEvent.change(screen.getByPlaceholderText(/paste subtitles/i), { target: { value: text } })
}

async function downloaded(spy: ReturnType<typeof vi.spyOn>) {
  await waitFor(() => expect(spy).toHaveBeenCalled())
  return (spy.mock.calls.at(-1)![0] as Blob).text()
}

describe('SubtitleSyncFixer', () => {
  it('parses pasted SRT and shows the cue count', () => {
    paste()
    expect(screen.getByText(/3 cues/)).toBeInTheDocument()
    expect(output()).toContain('00:00:10,000 --> 00:00:11,000')
  })

  it('shifts every cue by the given milliseconds', () => {
    paste()
    fireEvent.change(screen.getByLabelText(/^Shift by \(ms\)/), { target: { value: '1500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply shift' }))
    expect(output()).toContain('00:00:11,500 --> 00:00:12,500')
  })

  it('prefills first and last cue for resync and maps drift linearly', () => {
    paste()
    expect(screen.getByLabelText('Cue A number')).toHaveValue(1)
    expect(screen.getByLabelText('Cue B number')).toHaveValue(3)
    expect(screen.getByText('Now 00:00:10,000 — “First line”')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Cue A should start at/), { target: { value: '00:00:12,000' } })
    fireEvent.change(screen.getByLabelText(/^Cue B should start at/), { target: { value: '00:01:44,000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply resync' }))
    expect(output()).toContain('00:00:58,000 --> ')
  })

  it('rejects a badly formatted correct time', () => {
    paste()
    fireEvent.change(screen.getByLabelText(/^Cue A should start at/), { target: { value: 'soon' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply resync' }))
    expect(screen.getByText(/Enter times as hh:mm:ss,mmm/)).toBeInTheDocument()
  })

  it('switches output to VTT and names pasted downloads subtitles.synced.vtt', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    paste()
    fireEvent.click(screen.getByRole('tab', { name: 'VTT' }))
    expect(output().startsWith('WEBVTT')).toBe(true)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('subtitles.synced.vtt')
    })
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /download/i }))
    expect(await downloaded(spy)).toContain('00:00:10.000 --> 00:00:11.000')
    expect(click).toHaveBeenCalled()
    expect(revoke).toHaveBeenCalled()
    click.mockRestore()
  })

  it('loads a file and names the download after it', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<SubtitleSyncFixer />)
    const file = new File([SRT], 'Movie.2024.en.srt', { type: 'application/x-subrip' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    expect(await screen.findByText(/3 cues/)).toBeInTheDocument()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('Movie.2024.en.synced.srt')
    })
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /download/i }))
    await downloaded(spy)
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })

  it('shows an error for text that is not subtitles', () => {
    paste('hello world')
    expect(screen.getByText(/No subtitle cues found/)).toBeInTheDocument()
  })
})
