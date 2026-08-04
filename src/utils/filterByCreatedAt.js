/**
 * Client-side created_at filtering for CC inventory lists
 * that do not yet accept dateFrom/dateTo on the API.
 */

export function createdAtIsoDay(value) {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Filter rows whose creation day falls in [dateFrom, dateTo] (inclusive).
 * If the payload has no creation dates at all (e.g. map pins stripped the field),
 * return the original list instead of wiping it to empty.
 */
export function filterByCreatedAt(items, dateFrom, dateTo, field = 'created_at') {
  if (!Array.isArray(items) || !dateFrom || !dateTo) return items || []

  let anyDated = false
  const dated = items.map((row) => {
    const day = createdAtIsoDay(row?.[field] ?? row?.createdAt)
    if (day) anyDated = true
    return { row, day }
  })

  if (!anyDated) return items

  return dated
    .filter(({ day }) => day && day >= dateFrom && day <= dateTo)
    .map(({ row }) => row)
}
