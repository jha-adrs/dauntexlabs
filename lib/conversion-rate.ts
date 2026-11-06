// Pure helpers for components/tools/ConversionRateCalculator.tsx. Validation returns a Result, never throws.

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR'

const RATE_ERROR = 'Conversion rate must be greater than 0% and at most 100%.'
// Float noise guard: 50 * 100 / 2.5 can land a hair above 2000.
const EPS = 1e-9
// Round up to a whole number; `+ 0` turns Math.ceil(-EPS) = -0 into 0.
const roundUp = (x: number) => Math.ceil(x - EPS) + 0

export function conversionRate(conversions: number, visits: number): Result<number> {
  if (!Number.isFinite(conversions) || !Number.isFinite(visits))
    return { ok: false, error: 'Enter valid numbers for conversions and visits.' }
  if (visits <= 0) return { ok: false, error: 'Visits must be greater than zero.' }
  if (conversions < 0) return { ok: false, error: 'Conversions cannot be negative.' }
  if (conversions > visits) return { ok: false, error: 'Conversions cannot exceed total visits.' }
  return { ok: true, value: (conversions / visits) * 100 }
}

function checkSolver(amount: number, ratePct: number): string | null {
  if (!Number.isFinite(amount) || !Number.isFinite(ratePct)) return 'Enter valid numbers.'
  if (amount < 0 || ratePct < 0) return 'Values cannot be negative.'
  if (ratePct === 0 || ratePct > 100) return RATE_ERROR
  return null
}

export function visitsNeeded(conversions: number, ratePct: number): Result<number> {
  const err = checkSolver(conversions, ratePct)
  if (err) return { ok: false, error: err }
  return { ok: true, value: roundUp((conversions * 100) / ratePct) }
}

export function conversionsNeeded(visits: number, ratePct: number): Result<number> {
  const err = checkSolver(visits, ratePct)
  if (err) return { ok: false, error: err }
  return { ok: true, value: roundUp((visits * ratePct) / 100) }
}

export function revenue(conversions: number, visits: number, aov: number): { revenue: number; perVisitor: number } {
  const total = conversions * aov
  return { revenue: total, perVisitor: visits > 0 ? total / visits : 0 }
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format(amount)
}
