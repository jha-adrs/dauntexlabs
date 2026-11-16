import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import WhatsappChatViewer from '@/components/tools/WhatsappChatViewer'

const CHAT = [
  '31/12/2023, 22:14 - Messages and calls are end-to-end encrypted.',
  '31/12/2023, 22:15 - Alice: Hello there',
  'second line',
  '31/12/2023, 22:16 - +91 98765 43210: =HYPERLINK("x")',
  '31/12/2023, 22:17 - Alice: <Media omitted>',
].join('\n')

const AMBIG = '03/04/23, 10:00 - A: x\n05/06/23, 11:00 - B: y'

function paste(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/paste the chat text/i), { target: { value: text } })
}

async function downloadedText(spy: ReturnType<typeof vi.spyOn>) {
  const blob = spy.mock.calls.at(-1)![0] as Blob
  return blob.text()
}

describe('WhatsappChatViewer', () => {
  it('says it is not affiliated with WhatsApp or Meta', () => {
    render(<WhatsappChatViewer />)
    expect(screen.getByText(/not affiliated with WhatsApp or Meta/i)).toBeInTheDocument()
  })

  it('shows messages in a table with counts per sender', () => {
    render(<WhatsappChatViewer />)
    paste(CHAT)
    expect(screen.getByText(/4 messages/)).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /Hello there/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Alice (2)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '+91 98765 43210 (1)' })).toBeInTheDocument()
  })

  it('filters by sender and by search text', () => {
    render(<WhatsappChatViewer />)
    paste(CHAT)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '+91 98765 43210' } })
    expect(screen.queryByRole('cell', { name: /Hello there/ })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText(/search messages/i), { target: { value: 'second' } })
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows).toHaveLength(2) // header + 1
  })

  it('loads a .txt file', async () => {
    const { container } = render(<WhatsappChatViewer />)
    const file = new File([CHAT], 'WhatsApp Chat with Alice.txt', { type: 'text/plain' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    expect(await screen.findByRole('cell', { name: /Hello there/ })).toBeInTheDocument()
  })

  it('tells iOS users to unzip a .zip export', async () => {
    const { container } = render(<WhatsappChatViewer />)
    const file = new File(['PK'], 'chat.zip', { type: 'application/zip' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    expect(await screen.findByText(/unzip/i)).toBeInTheDocument()
  })

  it('downloads CSV with neutralised formulas and JSON', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    render(<WhatsappChatViewer />)
    paste(CHAT)
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /download csv/i }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    const csv = await downloadedText(spy)
    expect(csv).toContain('Date,Time,Sender,Message,Type\r\n')
    expect(csv).toContain(`+91 98765 43210,"'=HYPERLINK(""x"")",text`)
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /download json/i }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    const json = JSON.parse(await downloadedText(spy))
    expect(json).toHaveLength(4)
    expect(json[1]).toMatchObject({ sender: 'Alice', message: 'Hello there\nsecond line' })
  })

  it('offers a day-first / month-first toggle only for ambiguous dates', () => {
    render(<WhatsappChatViewer />)
    paste(CHAT)
    expect(screen.queryByRole('tab', { name: /month-first/i })).not.toBeInTheDocument()
    paste(AMBIG)
    expect(screen.getByRole('cell', { name: '2023-04-03' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /month-first/i }))
    expect(screen.getByRole('cell', { name: '2023-03-04' })).toBeInTheDocument()
  })

  it('shows a notice when nothing parses', () => {
    render(<WhatsappChatViewer />)
    paste('just some text')
    expect(screen.getByText(/No WhatsApp messages found/i)).toHaveTextContent(/date and time format.*not recognised/i)
  })

  it('labels the sender filter and search box, shows a Type column and announces the count', () => {
    render(<WhatsappChatViewer />)
    paste(CHAT)
    expect(screen.getByRole('combobox', { name: /sender/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'media' })).toBeInTheDocument()
    expect(screen.getByText(/4 messages/).closest('[aria-live]')).not.toBeNull()
  })

  it('shows 200 rows at a time with a "show more" button', () => {
    render(<WhatsappChatViewer />)
    paste(Array.from({ length: 250 }, (_, i) => `31/12/2023, 22:15 - Alice: m${i}`).join('\n'))
    const rows = () => within(screen.getByRole('table')).getAllByRole('row')
    expect(rows()).toHaveLength(201)
    expect(screen.getByText(/showing 200 of 250/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /show 200 more/i }))
    expect(rows()).toHaveLength(251)
    expect(screen.queryByRole('button', { name: /show 200 more/i })).not.toBeInTheDocument()
  })
})
