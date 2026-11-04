import { useState } from 'react'
import { cn } from '@/utils/cn'
import { weekdayShort } from '@/utils/format'
import { EventPill } from './EventItems'
import { dayKey, fmtDM, sameDay, todayVn, weekDays, SESSION_LABEL } from './calendarUtils'

const LIMIT = 4

/** Chế độ Tuần: 5 cột T2–T6, mỗi cột chia Trước / Sau giờ giao dịch. */
export function WeekView({ date, byDay, onOpenDay }) {
  const [expanded, setExpanded] = useState({})
  const today = todayVn()
  const days = weekDays(date)

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[760px] grid-cols-5 gap-2">
        {days.map((d) => {
          const k = dayKey(d)
          const list = byDay.get(k) ?? []
          const isToday = sameDay(d, today)
          const open = expanded[k]
          return (
            <div
              key={k}
              className={cn(
                'flex min-h-[440px] flex-col rounded-[18px] border p-2 transition-colors',
                isToday ? 'border-line-strong bg-raised shadow-[0_20px_50px_-25px_rgb(0_0_0/0.9)]' : 'border-line bg-surface',
              )}
            >
              <button type="button" onClick={() => onOpenDay(d)} className="mb-2 flex items-baseline justify-between rounded-xl px-2 py-1.5 text-left hover:bg-hover">
                <span className={cn('text-sm font-semibold', isToday ? 'text-brand' : 'text-fg')}>{weekdayShort(d)}</span>
                <span className="num text-xs text-muted">{fmtDM(d)}</span>
              </button>
              {list.length === 0 ? (
                <p className="px-2 pt-6 text-center text-xs text-faint">Không có sự kiện</p>
              ) : (
                ['pre', 'post'].map((s) => {
                  const items = list.filter((e) => (e.session ?? 'pre') === s)
                  if (!items.length) return null
                  const shown = open ? items : items.slice(0, LIMIT)
                  return (
                    <div key={s} className="mb-2">
                      <div className="px-2 pb-1 text-[10.5px] font-medium tracking-wide text-faint uppercase">{s === 'pre' ? 'Trước giờ' : 'Sau giờ'}</div>
                      {shown.map((e) => (
                        <EventPill key={e.id} event={e} onClick={() => onOpenDay(d, e.id)} />
                      ))}
                      {items.length > LIMIT && (
                        <button
                          type="button"
                          onClick={() => setExpanded((x) => ({ ...x, [k]: !open }))}
                          aria-label={open ? 'Thu gọn' : `Xem thêm ${items.length - LIMIT} sự kiện ${SESSION_LABEL[s].toLowerCase()}`}
                          className="mt-0.5 w-full rounded-lg px-2 py-1 text-left text-[11.5px] text-muted hover:bg-hover hover:text-fg"
                        >
                          {open ? 'Thu gọn' : `+${items.length - LIMIT} sự kiện`}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
