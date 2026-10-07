import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import IcsViewer from '@/components/tools/IcsViewer'

const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'SUMMARY:Later meeting',
  'DTSTART:20261008T033000Z',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:Standup',
  'DTSTART;TZID=Asia/Kolkata:20261007T090000',
  'DTEND;TZID=Asia/Kolkata:20261007T091500',
  'LOCATION:Room 1',
  'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

function summaries() {
  return screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent)
}

describe('IcsViewer', () => {
  it('lists events sorted by start, converted to the chosen time zone', () => {
    render(<IcsViewer />)
    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'Asia/Kolkata' } })
    fireEvent.change(screen.getByPlaceholderText(/paste calendar text/i), { target: { value: ICS } })
    expect(screen.getByText(/2 events/)).toBeInTheDocument()
    expect(summaries()).toEqual(['Standup', 'Later meeting'])
    expect(screen.getByRole('cell', { name: '2026-10-07 09:00' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Weekly on Monday, Wednesday' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'America/New_York' } })
    expect(screen.getByRole('cell', { name: '2026-10-06 23:30' })).toBeInTheDocument()
  })

  it('reverses the order when the start column is clicked', () => {
    render(<IcsViewer />)
    fireEvent.change(screen.getByPlaceholderText(/paste calendar text/i), { target: { value: ICS } })
    fireEvent.click(screen.getByRole('button', { name: /start/i }))
    expect(summaries()).toEqual(['Later meeting', 'Standup'])
  })

  it('loads an .ics file and downloads CSV', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<IcsViewer />)
    const file = new File([ICS], 'cal.ics', { type: 'text/calendar' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    expect(await screen.findByRole('cell', { name: 'Standup' })).toBeInTheDocument()
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /download csv/i }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    const csv = await (spy.mock.calls.at(-1)![0] as Blob).text()
    expect(csv).toContain('Summary,Start,End,All day,Location,Repeats,Description')
  })

  it('shows an error for text that is not a calendar', () => {
    render(<IcsViewer />)
    fireEvent.change(screen.getByPlaceholderText(/paste calendar text/i), { target: { value: 'nope' } })
    expect(screen.getByText(/No calendar found/)).toBeInTheDocument()
  })
})
