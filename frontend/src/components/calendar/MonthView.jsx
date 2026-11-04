import { cn } from '@/utils/cn'
import { EventPill } from './EventItems'
import { dayKey, monthWeeks, sameDay, todayVn } from './calendarUtils'

const HEADS = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu']
const LIMIT = 3

/** Chế độ Tháng: lưới T2–T6 (bỏ cuối tuần), bấm ô để mở chế độ Ngày. */
export function MonthView({ date, byDay, onOpenDay }) {
  const today = todayVn()
  const weeks = monthWeeks(date)
  const month = date.getMonth()

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="min-w-[720px] overflow-hidden rounded-[18px] border border-line bg-surface">
        <div className="grid grid-cols-5 border-b border-line">
          {HEADS.map((h) => (
            <div key={h} className="px-3 py-2.5 text-xs font-medium text-muted">
              {h}
            </div>
          ))}
        </div>
        {weeks.map((w) => (
          <div key={w[0].getTime()} className="grid grid-cols-5 border-b border-line last:border-0">
            {w.map((d) => {
              const list = byDay.get(dayKey(d)) ?? []
              const isToday = sameDay(d, today)
              const inMonth = d.getMonth() === month
              return (
                <div
                  key={d.getTime()}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenDay(d)}
                  onKeyDown={(e) => e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpenDay(d))}
                  aria-label={`Ngày ${d.getDate()}/${d.getMonth() + 1}: ${list.length} sự kiện`}
                  className={cn(
                    'min-h-[118px] cursor-pointer border-r border-line p-1.5 transition-colors last:border-r-0 hover:bg-raised',
                    !inMonth && 'bg-base/60',
                    isToday && 'bg-raised shadow-[inset_0_0_0_1px_rgb(255_163_108/0.45)]',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between px-1.5 pt-0.5">
                    <span
                      className={cn(
                        'num flex size-6 items-center justify-center rounded-full text-xs',
                        isToday ? 'bg-brand font-semibold text-canvas' : inMonth ? 'text-dim' : 'text-faint',
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {list.length > 0 && <span className="text-[10.5px] text-faint">{list.length}</span>}
                  </div>
                  {list.slice(0, LIMIT).map((e) => (
                    <div key={e.id} onClick={(ev) => ev.stopPropagation()}>
                      <EventPill event={e} compact onClick={() => onOpenDay(d, e.id)} />
                    </div>
                  ))}
                  {list.length > LIMIT && <div className="px-1.5 pt-0.5 text-[11px] text-muted">+{list.length - LIMIT} sự kiện</div>}
                  {list.length === 0 && isToday && <div className="px-1.5 pt-2 text-[11px] text-faint">Không có sự kiện</div>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
