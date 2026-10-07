import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CronToSystemdTimer from '@/components/tools/CronToSystemdTimer'

function textareaValues(): string[] {
  return Array.from(document.querySelectorAll('textarea')).map((t) => t.value)
}

describe('CronToSystemdTimer', () => {
  it('converts the default schedule and shows the description', () => {
    render(<CronToSystemdTimer />)
    expect(screen.getByText('OnCalendar=*-*-* *:00/15:00')).toBeInTheDocument()
    expect(screen.getByText(/every 15 minutes/i)).toBeInTheDocument()
    expect(screen.getByText(/systemd-analyze calendar '\*-\*-\* \*:00\/15:00'/)).toBeInTheDocument()
  })

  it('updates the timer and service files from the inputs', () => {
    render(<CronToSystemdTimer />)
    fireEvent.change(screen.getByPlaceholderText('*/15 * * * *'), { target: { value: '0 9 * * 1-5' } })
    fireEvent.change(screen.getByPlaceholderText('my-job'), { target: { value: 'backup' } })
    fireEvent.change(screen.getByPlaceholderText('/usr/local/bin/backup.sh'), {
      target: { value: '/opt/run.sh' },
    })
    fireEvent.click(screen.getByLabelText(/Persistent/))
    const [timer, service] = textareaValues()
    expect(timer).toContain('OnCalendar=Mon..Fri *-*-* 09:00:00')
    expect(timer).toContain('Persistent=false')
    expect(timer).toContain('Unit=backup.service')
    expect(service).toContain('ExecStart=/opt/run.sh')
    expect(screen.getByText('backup.timer')).toBeInTheDocument()
  })

  it('shows the OnBootSec hint for @reboot', () => {
    render(<CronToSystemdTimer />)
    fireEvent.change(screen.getByPlaceholderText('*/15 * * * *'), { target: { value: '@reboot' } })
    expect(screen.getByText(/OnBootSec=/)).toBeInTheDocument()
    expect(textareaValues()).toHaveLength(0)
  })

  it('downloads the timer file', () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    render(<CronToSystemdTimer />)
    fireEvent.click(screen.getAllByRole('button', { name: 'download' })[0])
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
