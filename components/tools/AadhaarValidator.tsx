'use client'

import { useMemo, useState } from 'react'
import { Field, Notice, Panel, TextInput, Toggle } from '@/components/ui/kit'
import { validateAadhaar } from '@/lib/verhoeff'

export default function AadhaarValidator() {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const result = useMemo(() => (value.trim() ? validateAadhaar(value) : null), [value])
  const full = value.replace(/[\s-]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')

  return (
    <>
      <Field label="Aadhaar number" hint="Spaces and hyphens are ignored. Processed on your device.">
        <TextInput value={value} onChange={setValue} placeholder="1234 5678 9012" />
      </Field>

      <Notice>
        This checks the format and check digit only. It cannot tell you whether an Aadhaar number was issued.
      </Notice>

      {result && !result.ok && <Notice kind="error">{result.error}</Notice>}

      {result?.ok && (
        <Panel title="Result" actions={<Toggle checked={show} onChange={setShow} label="Show full number" />}>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--accent)', fontWeight: 500 }}>
            Format valid — 12 digits and the check digit matches.
          </p>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '1.25rem' }}>
            {show ? full : result.masked}
          </p>
        </Panel>
      )}

      <p style={{ color: 'var(--mute)', fontSize: '0.875rem' }}>
        Sharing a copy of an Aadhaar card? Hide the first eight digits with the{' '}
        <a href="/tools/aadhaar-masker/">Aadhaar masker</a>.
      </p>
    </>
  )
}
