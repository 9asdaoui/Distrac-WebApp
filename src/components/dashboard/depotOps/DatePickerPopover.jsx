import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  createDayPeriod,
  decadeStart,
  endOfWeekSundayIso,
  formatPeriodLabel,
  isIsoInRange,
  normalizePeriod,
  periodForToday,
  periodFromSelection,
  resolvePeriodRange,
  startOfWeekMondayIso,
  toIsoDate,
} from './datePeriod'

const DAYS_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DAYS_SHORT_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const GRANULARITY_TABS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
]

function dayHeaders(locale) {
  return locale === 'fr' ? DAYS_SHORT_FR : DAYS_SHORT
}

function isSameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(d) {
  return isSameDay(d, new Date())
}

/**
 * Full Mon-start month grid including adjacent-month days so each row is 7 cells.
 * Each cell: { day, iso, isCurrentMonth }
 */
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  let startDow = first.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  // Leading days from previous month
  if (startDow > 0) {
    const prevDays = new Date(year, month, 0).getDate()
    for (let i = startDow - 1; i >= 0; i--) {
      const day = prevDays - i
      const d = new Date(year, month - 1, day)
      cells.push({ day, iso: toIsoDate(d), isCurrentMonth: false })
    }
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true,
    })
  }

  // Trailing days from next month to complete rows
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, nextDay)
    cells.push({ day: nextDay, iso: toIsoDate(d), isCurrentMonth: false })
    nextDay += 1
  }

  return cells
}

/**
 * Custom date picker dropdown with Day / Week / Month / Year granularities.
 */
export function DatePickerPopover({
  period: periodProp,
  onPeriodChange,
  /** @deprecated prefer period — legacy ISO day string */
  value,
  /** @deprecated prefer onPeriodChange */
  onChange,
  locale = 'en',
}) {
  const [open, setOpen] = useState(false)
  const [hoverWeekIso, setHoverWeekIso] = useState(null)
  const containerRef = useRef(null)
  const popoverId = useId()

  const period = useMemo(() => {
    if (periodProp !== undefined) return normalizePeriod(periodProp)
    if (value) return createDayPeriod(value)
    return createDayPeriod()
  }, [periodProp, value])

  const selectedRange = useMemo(() => resolvePeriodRange(period), [period])
  const granularity = period.granularity

  const commitPeriod = useCallback(
    (next) => {
      const normalized = normalizePeriod(next)
      if (onPeriodChange) {
        onPeriodChange(normalized)
      } else if (onChange) {
        onChange(normalized.value)
      }
      setOpen(false)
    },
    [onPeriodChange, onChange],
  )

  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewDecade, setViewDecade] = useState(() => decadeStart(today.getFullYear()))

  useEffect(() => {
    if (!open) return
    const anchor = new Date(`${period.value}T12:00:00`)
    if (Number.isNaN(anchor.getTime())) return
    setViewYear(anchor.getFullYear())
    setViewMonth(anchor.getMonth())
    setViewDecade(decadeStart(anchor.getFullYear()))
  }, [open, period.value])

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const headerLabel = useMemo(() => {
    if (granularity === 'year') {
      return `${viewDecade} – ${viewDecade + 9}`
    }
    if (granularity === 'month') {
      return String(viewYear)
    }
    const d = new Date(viewYear, viewMonth, 1)
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [granularity, viewYear, viewMonth, viewDecade])

  const formattedLabel = useMemo(
    () => formatPeriodLabel(period, locale),
    [period, locale],
  )

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const stepPrev = useCallback(() => {
    if (granularity === 'year') {
      setViewDecade((d) => d - 10)
      return
    }
    if (granularity === 'month') {
      setViewYear((y) => y - 1)
      return
    }
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }, [granularity])

  const stepNext = useCallback(() => {
    if (granularity === 'year') {
      setViewDecade((d) => d + 10)
      return
    }
    if (granularity === 'month') {
      setViewYear((y) => y + 1)
      return
    }
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }, [granularity])

  const setGranularityTab = useCallback(
    (nextG) => {
      // Keep open; re-anchor period under new granularity without closing.
      const next = normalizePeriod({ granularity: nextG, value: period.value })
      if (onPeriodChange) onPeriodChange(next)
      else if (onChange) onChange(next.value)
    },
    [period.value, onPeriodChange, onChange],
  )

  const handleDayClick = useCallback(
    (iso) => {
      if (!iso) return
      commitPeriod(periodFromSelection(granularity === 'week' ? 'week' : 'day', iso))
    },
    [commitPeriod, granularity],
  )

  const handleMonthClick = useCallback(
    (monthIndex) => {
      const iso = toIsoDate(new Date(viewYear, monthIndex, 1))
      commitPeriod(periodFromSelection('month', iso))
    },
    [commitPeriod, viewYear],
  )

  const handleYearClick = useCallback(
    (year) => {
      const iso = toIsoDate(new Date(year, 0, 1))
      commitPeriod(periodFromSelection('year', iso))
    },
    [commitPeriod],
  )

  const goToday = useCallback(() => {
    commitPeriod(periodForToday(granularity))
  }, [commitPeriod, granularity])

  const hoverRange = useMemo(() => {
    if (granularity !== 'week' || !hoverWeekIso) return null
    return {
      dateFrom: startOfWeekMondayIso(hoverWeekIso),
      dateTo: endOfWeekSundayIso(hoverWeekIso),
    }
  }, [granularity, hoverWeekIso])

  const selectedWeekRange =
    granularity === 'week'
      ? { dateFrom: selectedRange.dateFrom, dateTo: selectedRange.dateTo }
      : null

  const localeKey = String(locale || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en'

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(viewYear, i, 1)
      return {
        index: i,
        label: d.toLocaleDateString(locale, { month: 'short' }),
      }
    })
  }, [viewYear, locale])

  const years = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => viewDecade + i)
  }, [viewDecade])

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        className={`relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-cc-control border bg-cc-surface px-3 text-cc-body text-cc-secondary transition hover:border-cc-border-hover hover:text-white ${
          open ? 'border-cc-accent' : 'border-cc-border'
        }`}
      >
        <CalendarIcon />
        <span className="whitespace-nowrap font-medium">{formattedLabel}</span>
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Date picker"
          className="absolute left-1/2 top-[calc(100%+6px)] z-50 -translate-x-1/2 rounded-xl border border-cc-border bg-cc-surface p-4 shadow-cc-panel"
          style={{ width: '300px' }}
        >
          {/* Granularity tabs */}
          <div className="mb-3 flex rounded-lg border border-cc-border bg-cc-bg p-0.5">
            {GRANULARITY_TABS.map((tab) => {
              const active = granularity === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGranularityTab(tab.id)}
                  className={`flex-1 rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition ${
                    active
                      ? 'bg-distrac-primary text-white'
                      : 'text-cc-tertiary hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={stepPrev}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-cc-tertiary transition hover:bg-cc-surface-hover hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-cc-primary">{headerLabel}</span>
            <button
              type="button"
              onClick={stepNext}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-cc-tertiary transition hover:bg-cc-surface-hover hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {granularity === 'month' ? (
            <div className="grid grid-cols-3 gap-1.5">
              {months.map((m) => {
                const isSel =
                  selectedRange.granularity === 'month' &&
                  parseInt(selectedRange.dateFrom.slice(0, 4), 10) === viewYear &&
                  parseInt(selectedRange.dateFrom.slice(5, 7), 10) - 1 === m.index
                const now = new Date()
                const isCurr = now.getFullYear() === viewYear && now.getMonth() === m.index
                return (
                  <button
                    key={m.index}
                    type="button"
                    onClick={() => handleMonthClick(m.index)}
                    className={`rounded-lg py-2.5 text-cc-body font-medium transition ${
                      isSel
                        ? 'bg-distrac-primary text-white'
                        : isCurr
                          ? 'text-cc-primary hover:bg-cc-surface-hover hover:text-white'
                          : 'text-[#8892a8] hover:bg-cc-surface-hover hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          ) : granularity === 'year' ? (
            <div className="grid grid-cols-3 gap-1.5">
              {years.map((y) => {
                const isSel =
                  selectedRange.granularity === 'year' &&
                  parseInt(selectedRange.dateFrom.slice(0, 4), 10) === y
                const isCurr = new Date().getFullYear() === y
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearClick(y)}
                    className={`rounded-lg py-2.5 text-cc-body font-medium transition ${
                      isSel
                        ? 'bg-distrac-primary text-white'
                        : isCurr
                          ? 'text-cc-primary hover:bg-cc-surface-hover hover:text-white'
                          : 'text-[#8892a8] hover:bg-cc-surface-hover hover:text-white'
                    }`}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <div className="mb-1 grid grid-cols-7 text-center text-cc-caption font-semibold uppercase tracking-wider text-[#5a6478]">
                {dayHeaders(localeKey).map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div
                className="grid grid-cols-7 text-center"
                onMouseLeave={() => setHoverWeekIso(null)}
              >
                {grid.map((cell) => {
                  const isoDate = new Date(`${cell.iso}T12:00:00`)
                  const inSelectedWeek =
                    selectedWeekRange &&
                    isIsoInRange(cell.iso, selectedWeekRange.dateFrom, selectedWeekRange.dateTo)
                  const inHoverWeek =
                    hoverRange && isIsoInRange(cell.iso, hoverRange.dateFrom, hoverRange.dateTo)

                  const isSelDay =
                    granularity === 'day' &&
                    cell.iso === selectedRange.date

                  const isSel = granularity === 'week' ? inSelectedWeek : isSelDay
                  const isTod = isToday(isoDate)
                  const muted = !cell.isCurrentMonth

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => handleDayClick(cell.iso)}
                      onMouseEnter={() => {
                        if (granularity === 'week') setHoverWeekIso(cell.iso)
                      }}
                      className={`relative rounded-lg py-1.5 text-cc-body font-medium transition ${
                        isSel
                          ? 'bg-distrac-primary text-white'
                          : inHoverWeek && granularity === 'week'
                            ? 'bg-distrac-primary/25 text-white'
                            : isTod
                              ? `${muted ? 'text-cc-tertiary' : 'text-cc-primary'} after:absolute after:bottom-[3px] after:left-1/2 after:h-[3px] after:w-[3px] after:-translate-x-1/2 after:rounded-full after:bg-distrac-primary hover:bg-cc-surface-hover hover:text-white`
                              : muted
                                ? 'text-[#5a6478] hover:bg-cc-surface-hover hover:text-white'
                                : 'text-[#8892a8] hover:bg-cc-surface-hover hover:text-white'
                      }`}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="mt-3 border-t border-cc-border pt-3">
            <button
              type="button"
              onClick={goToday}
              className="w-full rounded-lg px-3 py-1.5 text-center text-cc-body-sm font-semibold text-cc-accent transition hover:bg-cc-accent/10"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-cc-tertiary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export default DatePickerPopover
