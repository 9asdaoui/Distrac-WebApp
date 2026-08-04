/**
 * Command Center date period helpers.
 * Period shape: { granularity: 'day'|'week'|'month'|'year', value: 'YYYY-MM-DD' }
 * `value` is an anchor ISO date inside the selected bucket.
 */

export const PERIOD_GRANULARITIES = ['day', 'week', 'month', 'year']

const GRANULARITY_SET = new Set(PERIOD_GRANULARITIES)

export function toIsoDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIsoDate(iso) {
  if (!iso || typeof iso !== 'string') return null
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function localTodayIso() {
  return toIsoDate(new Date())
}

export function createDayPeriod(iso = localTodayIso()) {
  const value = parseIsoDate(iso) ? iso.slice(0, 10) : localTodayIso()
  return { granularity: 'day', value }
}

/**
 * Normalize unknown input into a valid period.
 * Accepts a period object or a legacy ISO date string.
 */
export function normalizePeriod(input) {
  if (typeof input === 'string') {
    return createDayPeriod(input)
  }
  if (!input || typeof input !== 'object') {
    return createDayPeriod()
  }
  const granularity = GRANULARITY_SET.has(input.granularity) ? input.granularity : 'day'
  let value = parseIsoDate(input.value) ? input.value.slice(0, 10) : localTodayIso()

  // Canonical anchors for month/year buckets
  if (granularity === 'month') {
    const d = parseIsoDate(value)
    value = toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1))
  } else if (granularity === 'year') {
    const d = parseIsoDate(value)
    value = toIsoDate(new Date(d.getFullYear(), 0, 1))
  } else if (granularity === 'week') {
    value = startOfWeekMondayIso(value)
  }

  return { granularity, value }
}

/** Monday (ISO week start) for the week containing `iso`. */
export function startOfWeekMondayIso(iso) {
  const d = parseIsoDate(iso) || new Date()
  const day = d.getDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return toIsoDate(monday)
}

export function endOfWeekSundayIso(iso) {
  const monday = parseIsoDate(startOfWeekMondayIso(iso))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return toIsoDate(sunday)
}

export function resolvePeriodRange(period) {
  const p = normalizePeriod(period)
  const anchor = parseIsoDate(p.value) || new Date()

  if (p.granularity === 'week') {
    const dateFrom = startOfWeekMondayIso(p.value)
    const dateTo = endOfWeekSundayIso(p.value)
    return { date: dateFrom, dateFrom, dateTo, granularity: 'week' }
  }

  if (p.granularity === 'month') {
    const y = anchor.getFullYear()
    const m = anchor.getMonth()
    const dateFrom = toIsoDate(new Date(y, m, 1))
    const dateTo = toIsoDate(new Date(y, m + 1, 0))
    return { date: dateFrom, dateFrom, dateTo, granularity: 'month' }
  }

  if (p.granularity === 'year') {
    const y = anchor.getFullYear()
    const dateFrom = toIsoDate(new Date(y, 0, 1))
    const dateTo = toIsoDate(new Date(y, 11, 31))
    return { date: dateFrom, dateFrom, dateTo, granularity: 'year' }
  }

  const day = toIsoDate(anchor)
  return { date: day, dateFrom: day, dateTo: day, granularity: 'day' }
}

export function periodForToday(granularity = 'day') {
  return normalizePeriod({ granularity, value: localTodayIso() })
}

/**
 * Build period from a clicked cell under the active granularity.
 */
export function periodFromSelection(granularity, iso) {
  return normalizePeriod({ granularity, value: iso })
}

export function formatPeriodLabel(period, locale) {
  const p = normalizePeriod(period)
  const range = resolvePeriodRange(p)
  const loc = locale || undefined

  if (p.granularity === 'year') {
    return String(parseIsoDate(range.dateFrom).getFullYear())
  }

  if (p.granularity === 'month') {
    return parseIsoDate(range.dateFrom).toLocaleDateString(loc, {
      month: 'long',
      year: 'numeric',
    })
  }

  if (p.granularity === 'week') {
    const start = parseIsoDate(range.dateFrom)
    const end = parseIsoDate(range.dateTo)
    const sameYear = start.getFullYear() === end.getFullYear()
    const sameMonth = sameYear && start.getMonth() === end.getMonth()
    if (sameMonth) {
      const left = start.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
      const right = end.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
      return `${left} – ${right}`
    }
    if (sameYear) {
      const left = start.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
      const right = end.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
      return `${left} – ${right}`
    }
    const left = start.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
    const right = end.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
    return `${left} – ${right}`
  }

  // day — match existing picker label
  return parseIsoDate(range.date).toLocaleDateString(loc, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function isIsoInRange(iso, dateFrom, dateTo) {
  if (!iso || !dateFrom || !dateTo) return false
  return iso >= dateFrom && iso <= dateTo
}

/** Decade start year (e.g. 2026 → 2020). */
export function decadeStart(year) {
  return Math.floor(Number(year) / 10) * 10
}
