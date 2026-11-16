'use client'

// Instant converter for a single unit/number-base pair, pre-set from the page.
import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/ui/kit'
import { convertUnit, convertBase, formatScaleValue, shownSymbols, type Pair } from '@/lib/conversions'

export default function ConvertWidget({ pair }: { pair: Pair }) {
  const isUnit = pair.family === 'unit'
  const [val, setVal] = useState(isUnit ? '1' : '10')
  const sym = isUnit ? shownSymbols(pair) : { from: '', to: '' }

  const { out, error } = useMemo(() => {
    if (val.trim() === '') return { out: '', error: '' }
    try {
      if (isUnit) {
        // Pasted values may carry international or Indian commas ("10,000,000", "1,00,000").
        const n = parseFloat(val.replace(/,/g, ''))
        if (!Number.isFinite(n)) return { out: '', error: 'Enter a number.' }
        return { out: formatScaleValue(pair, convertUnit(pair, n)), error: '' }
      }
      return { out: convertBase(pair, val), error: '' }
    } catch (e) {
      return { out: '', error: e instanceof Error ? e.message : 'Invalid input.' }
    }
  }, [val, isUnit, pair])

  return (
    <div className="cw">
      <div className="cw-row">
        <label className="cw-field">
          <span className="cw-cap">
            {pair.fromLabel}
            {sym.from ? ` · ${sym.from}` : ''}
          </span>
          <input
            className="cw-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            inputMode={isUnit ? 'decimal' : 'text'}
            spellCheck={false}
            autoComplete="off"
            aria-label={`Value in ${pair.fromLabel}`}
          />
        </label>
        <span className="cw-eq" aria-hidden>
          =
        </span>
        <div className="cw-field">
          <span className="cw-cap">
            {pair.toLabel}
            {sym.to ? ` · ${sym.to}` : ''}
          </span>
          <div className={`cw-out ${error ? 'err' : ''}`} aria-live="polite">
            {error ? error : out || '—'}
          </div>
        </div>
      </div>
      {out && !error && (
        <div className="cw-actions">
          <CopyButton text={out} label="copy result" />
        </div>
      )}
    </div>
  )
}
