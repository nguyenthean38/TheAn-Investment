import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarSearch, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button, ErrorState, IconButton, Kbd, Segmented, Skeleton, Toggle, Tooltip } from '@/components/ui'
import { DayView } from '@/components/calendar/DayView'
import { WeekView } from '@/components/calendar/WeekView'
import { MonthView } from '@/components/calendar/MonthView'
import { EVENT_TYPES, MONTH_NAMES, TYPE_IDS, addDays, fmtDM, groupByDay, toWeekday, todayVn, weekDays } from '@/components/calendar/calendarUtils'
import { useEvents } from '@/hooks/useMarket'
import { useWatchedSet } from '@/hooks/useWatchlists'
import { isTypingTarget } from '@/hooks/useHotkeys'
import { formatLongDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const VIEWS = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
]

const TONE_ON = {
  brand: 'border-brand/50 bg-brand/12 text-brand',
  up: 'border-up/50 bg-up/12 text-up',
  info: 'border-info/50 bg-info/12 text-info',
  ceil: 'border-ceil/50 bg-ceil/14 text-ceil',
  floor: 'border-floor/50 bg-floor/14 text-floor',
  ref: 'border-ref/50 bg-ref/12 text-ref',
}

function periodLabel(view, d) {
  if (view === 'day') return `${formatLongDate(d)}, ${d.getFullYear()}`
  if (view === 'week') {
    const w = weekDays(d)
    return `Tuần ${fmtDM(w[0])} – ${fmtDM(w[4])}/${w[4].getFullYear()}`
  }
  return `${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`
}

/** Lịch sự kiện doanh nghiệp & thị trường: Ngày / Tuần / Tháng. */
export default function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const view = VIEWS.some((v) => v.value === params.get('xem')) ? params.get('xem') : 'week'
  const setView = (v) =>
    setParams(
      (p) => {
        p.set('xem', v)
        return p
      },
      { replace: true },
    )
  const [cursor, setCursor] = useState(() => toWeekday(todayVn()))
  const [selectedId, setSelectedId] = useState(null)
  const [onlyWatched, setOnlyWatched] = useState(false)
  const [types, setTypes] = useState(() => new Set(TYPE_IDS))

  const { data: events, isLoading, error, refetch } = useEvents()
  const watched = useWatchedSet()
  const watchedKey = [...watched].sort().join(',')

  const filtered = useMemo(() => {
    const w = new Set(watchedKey ? watchedKey.split(',') : [])
    return (events ?? []).filter((e) => types.has(e.type) && (!onlyWatched || (e.ticker && w.has(e.ticker))))
  }, [events, types, onlyWatched, watchedKey])
  const byDay = useMemo(() => groupByDay(filtered), [filtered])

  const move = (dir) => {
    setSelectedId(null)
    setCursor((c) => {
      if (view === 'day') return toWeekday(addDays(c, dir), dir)
      if (view === 'week') return addDays(c, dir * 7)
      return toWeekday(new Date(c.getFullYear(), c.getMonth() + dir, 1), 1)
    })
  }
  const goToday = () => {
    setSelectedId(null)
    setCursor(toWeekday(todayVn()))
  }
  const openDay = (d, eventId = null) => {
    setCursor(toWeekday(d))
    setSelectedId(eventId)
    setView('day')
  }
  const toggleType = (id) =>
    setTypes((s) => {
      const n = new Set(s)
      if (n.has(id) && n.size > 1) n.delete(id)
      else n.add(id)
      return n
    })

  // Phím tắt: ← → chuyển kỳ, T hôm nay, D/W/M đổi chế độ.
  // Lắng nghe ở pha capture để phím W đổi sang chế độ Tuần thay vì mở ngăn theo dõi.
  const keyRef = useRef(null)
  keyRef.current = { move, goToday, setView }
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (document.querySelector('[aria-modal="true"]') || window.__nhipPendingG) return
      const k = e.key.toLowerCase()
      const map = {
        arrowleft: () => keyRef.current.move(-1),
        arrowright: () => keyRef.current.move(1),
        t: () => keyRef.current.goToday(),
        d: () => keyRef.current.setView('day'),
        w: () => keyRef.current.setView('week'),
        m: () => keyRef.current.setView('month'),
      }
      if (!map[k]) return
      e.preventDefault()
      e.stopPropagation()
      map[k]()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const visibleCount = useMemo(() => {
    if (view === 'day') return byDay.get(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)?.length ?? 0
    if (view === 'week') return weekDays(cursor).reduce((a, d) => a + (byDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)?.length ?? 0), 0)
    return filtered.filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()
    }).length
  }, [view, cursor, byDay, filtered])

  const dayEvents = byDay.get(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`) ?? []

  return (
    <>
      <AppHeader title="Lịch sự kiện" subtitle="Công bố KQKD, ngày GDKHQ cổ tức, đại hội cổ đông và sự kiện thị trường" />
      <main className="container-app">
        {/* Thanh công cụ */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented options={VIEWS} value={view} onChange={setView} ariaLabel="Chế độ xem lịch" />
            <div className="flex items-center gap-1">
              <Tooltip label={<span className="flex items-center gap-2">Kỳ trước <Kbd>←</Kbd></span>}>
                <IconButton size="sm" aria-label="Kỳ trước" onClick={() => move(-1)}>
                  <ChevronLeft className="size-4" />
                </IconButton>
              </Tooltip>
              <Button size="sm" variant="secondary" onClick={goToday}>
                Hôm nay
              </Button>
              <Tooltip label={<span className="flex items-center gap-2">Kỳ sau <Kbd>→</Kbd></span>}>
                <IconButton size="sm" aria-label="Kỳ sau" onClick={() => move(1)}>
                  <ChevronRight className="size-4" />
                </IconButton>
              </Tooltip>
            </div>
            <h2 className="ml-1 text-[15px] font-semibold" aria-live="polite">
              {periodLabel(view, cursor)}
            </h2>
          </div>
          <Toggle checked={onlyWatched} onChange={setOnlyWatched} label="Chỉ mã tôi theo dõi" className="rounded-full border border-line bg-surface py-1.5 pr-1.5 pl-4" />
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo loại sự kiện">
          {TYPE_IDS.map((id) => {
            const meta = EVENT_TYPES[id]
            const on = types.has(id)
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleType(id)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors',
                  on ? TONE_ON[meta.tone] : 'border-line text-muted hover:border-line-strong hover:text-fg',
                )}
              >
                <span className={cn('size-1.5 rounded-full', on ? meta.dot : 'bg-faint')} />
                {meta.label}
              </button>
            )
          })}
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-faint md:inline-flex">
            <Kbd>D</Kbd>
            <Kbd>W</Kbd>
            <Kbd>M</Kbd> đổi chế độ · <Kbd>T</Kbd> hôm nay
          </span>
        </div>

        {error ? (
          <div className="card">
            <ErrorState error={error} onRetry={refetch} />
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[440px] rounded-[18px]" />
            ))}
          </div>
        ) : (
          <>
            {visibleCount === 0 && view !== 'day' && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
                <CalendarSearch className="size-4 shrink-0 text-faint" />
                {onlyWatched ? 'Không có sự kiện nào của các mã bạn theo dõi trong kỳ này.' : 'Không có sự kiện nào khớp bộ lọc trong kỳ này.'}
              </div>
            )}
            {view === 'day' && (
              <DayView
                date={cursor}
                events={dayEvents}
                byDay={byDay}
                selectedId={selectedId}
                onSelectEvent={setSelectedId}
                onSelectDate={(d) => {
                  setSelectedId(null)
                  setCursor(toWeekday(d))
                }}
              />
            )}
            {view === 'week' && <WeekView date={cursor} byDay={byDay} onOpenDay={openDay} />}
            {view === 'month' && <MonthView date={cursor} byDay={byDay} onOpenDay={openDay} />}
          </>
        )}
      </main>
    </>
  )
}
