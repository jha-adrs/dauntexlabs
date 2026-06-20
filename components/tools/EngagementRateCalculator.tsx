'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Select, Segmented, Toolbar, IO, Panel, Notice, CopyButton } from '@/components/ui/kit'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
]

const AUDIENCE_OPTIONS = [
  { value: 'followers', label: 'Followers' },
  { value: 'reach', label: 'Reach' },
]

const CARD_STYLE: React.CSSProperties = {
  padding: '1rem',
  background: 'var(--ink-800)',
  border: '1px solid var(--line)',
  borderRadius: '4px',
}

const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.75rem',
  fontFamily: 'var(--ff-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
}

const VALUE_STYLE: React.CSSProperties = {
  color: 'var(--acid)',
  fontSize: '1.75rem',
  fontFamily: 'var(--ff-mono)',
  fontWeight: 700,
}

const SUB_STYLE: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.75rem',
  marginTop: '0.25rem',
}

export default function EngagementRateCalculator() {
  const [inputMode, setInputMode] = useState<'total' | 'breakdown'>('total')
  const [currency, setCurrency] = useState('USD')
  const [audienceType, setAudienceType] = useState('followers')

  // Total mode
  const [totalEngagements, setTotalEngagements] = useState('')

  // Breakdown mode
  const [likes, setLikes] = useState('')
  const [comments, setComments] = useState('')
  const [shares, setShares] = useState('')

  // Audience
  const [audienceSize, setAudienceSize] = useState('')

  const result = useMemo(() => {
    let engagements: number

    if (inputMode === 'total') {
      if (!totalEngagements && !audienceSize) return null
      engagements = parseFloat(totalEngagements)
      if (isNaN(engagements)) return { error: 'Enter a valid number for total engagements.' }
    } else {
      if (!likes && !comments && !shares && !audienceSize) return null
      const l = parseFloat(likes) || 0
      const c = parseFloat(comments) || 0
      const s = parseFloat(shares) || 0
      if ((likes && isNaN(parseFloat(likes))) || (comments && isNaN(parseFloat(comments))) || (shares && isNaN(parseFloat(shares)))) {
        return { error: 'Enter valid numbers for likes, comments, and shares.' }
      }
      engagements = l + c + s
    }

    if (engagements < 0) return { error: 'Engagements cannot be negative.' }

    const audience = parseFloat(audienceSize)
    if (!audienceSize) return { error: 'Enter the audience size (' + audienceType + ').' }
    if (isNaN(audience) || audience <= 0) return { error: 'Audience size must be a positive number.' }

    const rate = (engagements / audience) * 100

    return { rate, engagements }
  }, [inputMode, totalEngagements, likes, comments, shares, audienceSize, audienceType])

  const copyText =
    result && !('error' in result)
      ? `Engagement Rate: ${result.rate.toFixed(2)}% (${result.engagements.toLocaleString()} engagements)`
      : ''

  return (
    <>
      <Toolbar>
        <Segmented
          value={inputMode}
          onChange={(v) => setInputMode(v as 'total' | 'breakdown')}
          options={[
            { value: 'total', label: 'Total Engagements' },
            { value: 'breakdown', label: 'Likes / Comments / Shares' },
          ]}
        />
        <Select value={audienceType} onChange={setAudienceType} options={AUDIENCE_OPTIONS} />
        <Select value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          {inputMode === 'total' ? (
            <Field label="Total Engagements" hint="Sum of all engagement actions (likes, comments, shares, etc.)">
              <TextInput
                type="number"
                value={totalEngagements}
                onChange={setTotalEngagements}
                placeholder="e.g. 300"
              />
            </Field>
          ) : (
            <>
              <Field label="Likes" hint="Number of likes / reactions">
                <TextInput
                  type="number"
                  value={likes}
                  onChange={setLikes}
                  placeholder="e.g. 200"
                />
              </Field>
              <Field label="Comments" hint="Number of comments">
                <TextInput
                  type="number"
                  value={comments}
                  onChange={setComments}
                  placeholder="e.g. 75"
                />
              </Field>
              <Field label="Shares" hint="Number of shares / reposts">
                <TextInput
                  type="number"
                  value={shares}
                  onChange={setShares}
                  placeholder="e.g. 25"
                />
              </Field>
            </>
          )}
          <Field
            label={audienceType === 'followers' ? 'Followers' : 'Reach'}
            hint={audienceType === 'followers' ? 'Your total follower count' : 'Number of unique accounts reached'}
          >
            <TextInput
              type="number"
              value={audienceSize}
              onChange={setAudienceSize}
              placeholder="e.g. 10000"
            />
          </Field>
        </Panel>

        <Panel
          title="results"
          actions={copyText ? <CopyButton text={copyText} /> : undefined}
        >
          {!result && (
            <Notice kind="info">
              Enter engagements and {audienceType === 'followers' ? 'follower count' : 'reach'} to calculate engagement rate.
            </Notice>
          )}
          {result && 'error' in result && (
            <Notice kind="error">{result.error}</Notice>
          )}
          {result && !('error' in result) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={CARD_STYLE}>
                <div style={LABEL_STYLE}>Engagement Rate</div>
                <div style={VALUE_STYLE}>{result.rate.toFixed(2)}%</div>
                <div style={SUB_STYLE}>
                  by {audienceType === 'followers' ? 'followers' : 'reach'}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>Engagements</div>
                  <div style={{ ...VALUE_STYLE, fontSize: '1.25rem' }}>
                    {result.engagements.toLocaleString()}
                  </div>
                </div>
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>{audienceType === 'followers' ? 'Followers' : 'Reach'}</div>
                  <div style={{ ...VALUE_STYLE, fontSize: '1.25rem' }}>
                    {parseFloat(audienceSize).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
