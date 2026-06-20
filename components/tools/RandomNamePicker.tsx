'use client'

import { useState } from 'react'
import { TextArea, TextInput, Toggle, Button, CopyButton, Field, Panel, IO, Notice, Toolbar } from '@/components/ui/kit'

/** Fisher-Yates shuffle using crypto.getRandomValues for unbiased randomness. */
function cryptoShuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    const j = buf[0] % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick `count` items from `pool`. If `allowDuplicates` is false, items are unique. */
function pickNames(pool: string[], count: number, allowDuplicates: boolean): string[] {
  if (allowDuplicates) {
    const result: string[] = []
    for (let i = 0; i < count; i++) {
      const buf = new Uint32Array(1)
      crypto.getRandomValues(buf)
      result.push(pool[buf[0] % pool.length])
    }
    return result
  }
  // Unique pick: shuffle and take first `count`
  const shuffled = cryptoShuffle(pool)
  return shuffled.slice(0, count)
}

export default function RandomNamePicker() {
  const [namesText, setNamesText] = useState('')
  const [countStr, setCountStr] = useState('1')
  const [allowDuplicates, setAllowDuplicates] = useState(false)
  const [removeAfterPick, setRemoveAfterPick] = useState(false)

  const [picked, setPicked] = useState<string[]>([])
  const [shuffled, setShuffled] = useState<string[]>([])
  const [error, setError] = useState('')

  function getNames(): string[] {
    return namesText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
  }

  function handlePick() {
    setError('')
    setShuffled([])
    const names = getNames()

    if (names.length === 0) {
      setError('Enter at least one name (one per line).')
      setPicked([])
      return
    }

    const count = parseInt(countStr, 10)
    if (isNaN(count) || count < 1) {
      setError('Number to pick must be at least 1.')
      setPicked([])
      return
    }

    if (!allowDuplicates && count > names.length) {
      setError(
        `Cannot pick ${count} unique names from a list of ${names.length}. Either reduce the count or enable Allow Duplicates.`,
      )
      setPicked([])
      return
    }

    const result = pickNames(names, count, allowDuplicates)
    setPicked(result)

    if (removeAfterPick && !allowDuplicates) {
      // Remove picked names from the list (first occurrence of each)
      const remaining = [...names]
      for (const p of result) {
        const idx = remaining.indexOf(p)
        if (idx !== -1) remaining.splice(idx, 1)
      }
      setNamesText(remaining.join('\n'))
    }
  }

  function handleShuffle() {
    setError('')
    const names = getNames()
    if (names.length === 0) {
      setError('Enter at least one name to shuffle.')
      return
    }
    setShuffled(cryptoShuffle(names))
    setPicked([])
  }

  const pickedText = picked.join('\n')
  const shuffledText = shuffled.join('\n')

  return (
    <>
      <Toolbar>
        <Field label="Number to pick">
          <TextInput
            type="number"
            value={countStr}
            onChange={setCountStr}
            placeholder="1"
          />
        </Field>
        <Toggle checked={allowDuplicates} onChange={setAllowDuplicates} label="Allow duplicates" />
        <Toggle checked={removeAfterPick} onChange={setRemoveAfterPick} label="Remove picked from list" />
      </Toolbar>

      {error && <Notice kind="error">{error}</Notice>}

      <IO>
        <Panel title="names (one per line)">
          <TextArea
            value={namesText}
            onChange={(v) => {
              setNamesText(v)
              setError('')
              setPicked([])
              setShuffled([])
            }}
            placeholder={'Alice\nBob\nCarol\nDave'}
            rows={14}
            mono={false}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Button variant="primary" onClick={handlePick}>
              Pick
            </Button>
            <Button variant="ghost" onClick={handleShuffle}>
              Shuffle list
            </Button>
          </div>
        </Panel>

        <Panel
          title={shuffled.length > 0 ? 'shuffled order' : 'picked'}
          actions={
            (picked.length > 0 || shuffled.length > 0) ? (
              <CopyButton text={shuffled.length > 0 ? shuffledText : pickedText} />
            ) : undefined
          }
        >
          {picked.length === 0 && shuffled.length === 0 ? (
            <Notice kind="info">Pick or shuffle names to see results.</Notice>
          ) : shuffled.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {shuffled.map((name, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    fontSize: '0.9rem',
                    color: 'var(--bone)',
                    padding: '0.4rem 0.6rem',
                    background: 'var(--ink-800)',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'var(--muted)', minWidth: '1.5rem', textAlign: 'right' }}>{i + 1}.</span>
                  {name}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {picked.map((name, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: picked.length === 1 ? '2rem' : '1.2rem',
                    color: 'var(--acid)',
                    padding: '0.75rem 1rem',
                    background: 'var(--ink-800)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    lineHeight: 1.2,
                  }}
                >
                  {picked.length > 1 && (
                    <span
                      style={{
                        fontFamily: 'var(--ff-mono)',
                        fontSize: '0.65rem',
                        color: 'var(--muted)',
                        display: 'block',
                        marginBottom: '0.2rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      #{i + 1}
                    </span>
                  )}
                  {name}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
