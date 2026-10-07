'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'
import {
  toUnicode,
  fromUnicode,
  looksLikeUnicodeDevanagari,
  FONT_SUPPORT,
  type LegacyFont,
} from '@/lib/legacy-fonts'

const FONT_NAME: Record<LegacyFont, string> = {
  krutidev: 'Kruti Dev 010',
  devlys: 'DevLys 010',
  chanakya: 'Chanakya',
  shivaji: 'Shivaji',
}

const LATIN_OR_SYMBOLS = /[A-Za-z\u0080-ÿ]/

/** Shared body for the four legacy-font tools (the only tool component that takes a prop). */
export default function LegacyFontConverter({ font }: { font: LegacyFont }) {
  const [mode, setMode] = useState('to')
  const [input, setInput] = useState('')
  const name = FONT_NAME[font]
  const toUni = mode === 'to'
  const supported = toUni ? FONT_SUPPORT[font].toUnicode : FONT_SUPPORT[font].fromUnicode

  const output = useMemo(() => {
    if (!input || !supported) return ''
    return toUni ? toUnicode(input, font) : fromUnicode(input, font)
  }, [input, toUni, font, supported])

  const isUnicode = !!input && looksLikeUnicodeDevanagari(input)
  let warning = ''
  if (supported && input) {
    if (toUni && isUnicode) {
      warning = FONT_SUPPORT[font].fromUnicode
        ? `This already looks like Unicode Hindi. To turn it into ${name} text, switch to Unicode → Legacy.`
        : 'This already looks like Unicode text, so there is nothing to convert.'
    } else if (!toUni && !isUnicode && LATIN_OR_SYMBOLS.test(input)) {
      warning = `This doesn't look like Unicode Hindi. If it is ${name} text, switch to Legacy → Unicode.`
    }
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'to', label: 'Legacy → Unicode' },
            { value: 'from', label: 'Unicode → Legacy' },
          ]}
        />
      </Toolbar>

      {!supported && (
        <Notice kind="error">
          Unicode → {name} isn&apos;t available. There is no reliable published {name} character
          map, and we would rather not guess and give you broken text. Legacy → Unicode works for
          common letters.
        </Notice>
      )}
      {supported && toUni && font === 'shivaji' && (
        <Notice>
          Shivaji support is partial: common Marathi letters and matras are converted, and any
          character we could not verify is left exactly as typed. Check the result before you use
          it.
        </Notice>
      )}
      {supported && !toUni && (
        <Notice>
          Legacy text only looks right in the {name} font. Paste it into Word or your typing
          software with {name} selected. In any other font it shows as Latin letters and
          symbols.
        </Notice>
      )}
      {warning && <Notice kind="error">{warning}</Notice>}

      <IO>
        <Panel title={toUni ? `${name} text` : 'Unicode Hindi'}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={toUni ? `Paste ${name} text…` : 'Paste Unicode Hindi text…'}
            rows={12}
            mono={false}
          />
        </Panel>
        <Panel
          title={toUni ? 'Unicode Hindi' : `${name} text`}
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton
                text={output}
                filename={toUni ? 'unicode.txt' : `${font}.txt`}
                mime="text/plain;charset=utf-8"
              />
            </>
          }
        >
          <TextArea value={output} readOnly placeholder="Result…" rows={12} mono={false} />
        </Panel>
      </IO>
    </>
  )
}
