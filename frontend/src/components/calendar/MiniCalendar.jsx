import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { MONTH_NAMES, WEEKDAY_SHORT, dayKey, isWeekend, monthGrid, sameDay, todayVn } from './calendarUtils'

/** Lịch tháng thu nhỏ: hôm nay được tô, ngày có sự kiện có chấm, bấm để chọn ngày. */
export function MiniCalendar({ selected, onSelect, byDay }) {
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const [prevSel, setPrevSel] = useState(selected)
  if (!sameDay(prevSel, selected)) {
    setPrevSel(selected)
    if (selected.getMonth() !== month.getMonth() || selected.getFullYear() !== month.getFullYear()) setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }
  const today = todayVn()
  const cells = monthGrid(month)
  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">
          {MONTH_NAMES[month.getMonth()]}, {month.getFullYear()}
        </span>
        <span className="flex gap-1">
          <button type="button" onClick={() => shift(-1)} aria-label="Tháng trước" className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-fg">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Tháng sau" className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-fg">
            <ChevronRight className="size-4" />
          </button>
        </span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_SHORT.map((w) => (
          <span key={w} className="pb-1 text-[11px] font-medium text-faint">
            {w}
          </span>
        ))}
        {cells.map((d) => {
          const inMonth = d.getMonth() === month.getMonth()
          const weekend = isWeekend(d)
          const isToday = sameDay(d, today)
          const isSel = sameDay(d, selected)
          const has = byDay.has(dayKey(d))
          return (
            <button
              key={d.getTime()}
              type="button"
              disabled={weekend}
              onClick={() => onSelect(d)}
              aria-label={`Ngày ${d.getDate()} tháng ${d.getMonth() + 1}`}
              aria-current={isToday ? 'date' : undefined}
              className={cn(
                'num relative mx-auto flex size-8 items-center justify-center rounded-full text-[12.5px] transition-colors',
                !inMonth && 'text-faint/60',
                inMonth && !weekend && 'text-dim hover:bg-raised hover:text-fg',
                weekend && 'cursor-default text-faint/40',
                isToday && !isSel && 'border border-brand/60 text-fg',
                isSel && 'bg-fg font-semibold text-canvas hover:bg-fg hover:text-canvas',
              )}
            >
              {d.getDate()}
              {has && !weekend && <span className={cn('absolute bottom-1 size-1 rounded-full', isSel ? 'bg-canvas' : 'bg-brand')} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
