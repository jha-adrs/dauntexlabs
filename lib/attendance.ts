/**
 * Attendance arithmetic (pure, integer-only). With classes held `t`, attended `a`,
 * required percentage `p` and optional remaining classes `r`:
 * - can miss    = floor((100a − p·t) / p)            when 100a ≥ p·t
 * - must attend = ceil((p·t − 100a) / (100 − p))      otherwise (null when p = 100)
 * - with r:     needed = max(0, ceil((p(t+r) − 100a) / 100)) of the r remaining
 */

export type AttendanceInput = { held: number; attended: number; target: number; remaining?: number }

export type AttendancePlan = {
  remaining: number
  /** classes of the remaining ones you must attend to end at or above the target */
  needed: number
  reachable: boolean
  /** remaining classes you can skip (0 when not reachable) */
  canMiss: number
  /** final percentage if you attend every remaining class */
  best: number
}

export type AttendanceResult =
  | { ok: false; error: string }
  | {
      ok: true
      percent: number
      /** classes you can miss in a row and stay at or above the target */
      canMiss: number
      /** classes you must attend in a row to reach the target; null when unreachable */
      mustAttend: number | null
      reachable: boolean
      plan: AttendancePlan | null
    }

const isWhole = (n: number) => Number.isSafeInteger(n) && n >= 0

/** Integer ceil(n / d) for d > 0. */
const ceilDiv = (n: number, d: number) => -Math.floor(-n / d)

export function attendance({ held: t, attended: a, target: p, remaining: r }: AttendanceInput): AttendanceResult {
  if (!isWhole(t) || !isWhole(a)) return { ok: false, error: 'Classes held and attended must be whole numbers, 0 or more.' }
  if (t === 0) return { ok: false, error: 'Classes held must be at least 1.' }
  if (a > t) return { ok: false, error: 'Classes attended cannot be more than classes held.' }
  if (!Number.isSafeInteger(p) || p < 1 || p > 100)
    return { ok: false, error: 'Required attendance must be a whole number from 1 to 100.' }
  if (r !== undefined && !isWhole(r)) return { ok: false, error: 'Classes remaining must be a whole number, 0 or more.' }

  const surplus = 100 * a - p * t
  let canMiss = 0
  let mustAttend: number | null = 0
  let reachable = true
  if (surplus >= 0) {
    canMiss = Math.floor(surplus / p)
  } else if (p === 100) {
    mustAttend = null
    reachable = false
  } else {
    mustAttend = ceilDiv(-surplus, 100 - p)
  }

  let plan: AttendancePlan | null = null
  if (r !== undefined) {
    const needed = Math.max(0, ceilDiv(p * (t + r) - 100 * a, 100))
    const ok = needed <= r
    plan = { remaining: r, needed, reachable: ok, canMiss: ok ? r - needed : 0, best: ((a + r) / (t + r)) * 100 }
  }

  return { ok: true, percent: (a / t) * 100, canMiss, mustAttend, reachable, plan }
}

/** Percentage to at most 2 decimals, trailing zeros trimmed: 84, 82.5, 71.43. */
export const formatPct = (n: number) => String(Number(n.toFixed(2)))
