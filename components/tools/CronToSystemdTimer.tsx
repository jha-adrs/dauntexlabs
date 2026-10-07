'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextInput,
  TextArea,
  Toggle,
  Panel,
  IO,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'
import { cronToSystemd } from '@/lib/systemd'

export default function CronToSystemdTimer() {
  const [expr, setExpr] = useState('*/15 * * * *')
  const [name, setName] = useState('my-job')
  const [command, setCommand] = useState('/usr/local/bin/backup.sh')
  const [persistent, setPersistent] = useState(true)

  const result = useMemo(
    () => cronToSystemd(expr, { name, command, persistent }),
    [expr, name, command, persistent],
  )
  const unit = name.trim() || 'my-job'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel title="Cron job">
        <Field label="Cron schedule" hint="5 fields (minute hour day month weekday) or @daily, @hourly…">
          <TextInput value={expr} onChange={setExpr} placeholder="*/15 * * * *" />
        </Field>
        <Field label="Unit name" hint="Files are named <name>.timer and <name>.service">
          <TextInput value={name} onChange={setName} placeholder="my-job" />
        </Field>
        <Field label="Command">
          <TextInput value={command} onChange={setCommand} placeholder="/usr/local/bin/backup.sh" />
        </Field>
        <Toggle
          checked={persistent}
          onChange={setPersistent}
          label="Persistent (catch up on runs missed while the machine was off)"
        />
      </Panel>

      {!result.ok ? (
        <Notice kind="error">{result.error}</Notice>
      ) : (
        <>
          <Panel
            title="OnCalendar"
            actions={
              <CopyButton
                text={result.onCalendar
                  .split('\n')
                  .map((l) => `OnCalendar=${l}`)
                  .join('\n')}
              />
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.onCalendar.split('\n').map((l) => (
                <code key={l} style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>
                  {`OnCalendar=${l}`}
                </code>
              ))}
              {result.description && (
                <p style={{ margin: 0, color: 'var(--mute)' }}>{result.description}</p>
              )}
              {result.note && <Notice kind="info">{result.note}</Notice>}
              {result.onCalendar.split('\n').map((l) => (
                <p key={l} style={{ margin: 0, color: 'var(--mute)', fontSize: '0.9rem' }}>
                  Double-check on your server:{' '}
                  <code style={{ fontFamily: 'var(--font-mono)' }}>{`systemd-analyze calendar '${l}'`}</code>
                </p>
              ))}
            </div>
          </Panel>

          <IO>
            <Panel
              title={`${unit}.timer`}
              actions={
                <>
                  <CopyButton text={result.timer} />
                  <DownloadButton text={result.timer} filename={`${unit}.timer`} />
                </>
              }
            >
              <TextArea value={result.timer} readOnly rows={14} />
            </Panel>
            <Panel
              title={`${unit}.service`}
              actions={
                <>
                  <CopyButton text={result.service} />
                  <DownloadButton text={result.service} filename={`${unit}.service`} />
                </>
              }
            >
              <TextArea value={result.service} readOnly rows={14} />
            </Panel>
          </IO>
        </>
      )}
    </div>
  )
}
