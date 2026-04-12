'use client'

import styles from './AvailabilityCalendar.module.css'

interface BlockedRange {
  start: string
  end: string
}

interface AvailabilityCalendarProps {
  blockedRanges: BlockedRange[]
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function isDateBlocked(date: Date, blockedRanges: BlockedRange[]): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return blockedRanges.some((range) => dateStr >= range.start && dateStr < range.end)
}

function isDatePast(date: Date, today: Date): boolean {
  return date < today
}

function renderMonth(year: number, month: number, blockedRanges: BlockedRange[], today: Date) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const cells: React.ReactNode[] = []

  // Empty filler cells for alignment
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className={styles.dayEmpty} />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const blocked = isDateBlocked(date, blockedRanges)
    const past = isDatePast(date, today)

    let className = styles.day
    if (blocked) {
      className += ` ${styles.dayBlocked}`
    } else if (past) {
      className += ` ${styles.dayPast}`
    } else {
      className += ` ${styles.dayAvailable}`
    }

    cells.push(
      <div
        key={d}
        className={className}
        aria-disabled={blocked ? 'true' : undefined}
        aria-label={`${d} ${MONTH_NAMES[month]} ${year}${blocked ? ', not available' : past ? ', past date' : ', available'}`}
        tabIndex={blocked || past ? undefined : 0}
        role="gridcell"
      >
        {d}
      </div>
    )
  }

  return cells
}

export function AvailabilityCalendar({ blockedRanges }: AvailabilityCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const months = [
    { year: today.getFullYear(), month: today.getMonth() },
    {
      year: today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear(),
      month: (today.getMonth() + 1) % 12,
    },
  ]

  return (
    <div aria-label="Availability calendar">
      <div className={styles.root}>
        {months.map(({ year, month }) => (
          <div key={`${year}-${month}`} className={styles.month} role="grid" aria-label={`${MONTH_NAMES[month]} ${year}`}>
            <div className={styles.monthHeading}>{MONTH_NAMES[month]} {year}</div>
            <div className={styles.weekdayRow} role="row">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className={styles.weekday} role="columnheader" aria-label={label}>
                  {label}
                </div>
              ))}
            </div>
            <div className={styles.daysGrid}>
              {renderMonth(year, month, blockedRanges, today)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.legend} aria-hidden="true">
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.legendSwatchAvailable}`} />
          <span>Available</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.legendSwatchBlocked}`} />
          <span>Not available</span>
        </div>
      </div>
    </div>
  )
}
