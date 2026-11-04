import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays } from 'lucide-react'
import { Card, Chip, EmptyState, ErrorState, Skeleton, TickerLogo } from '@/components/ui'
import { EVENT_TYPES } from '@/components/calendar/calendarUtils'
import { EpsLine, OutcomeChip } from '@/components/calendar/EventItems'
import { useEvents } from '@/hooks/useMarket'
import { vnNow } from '@/lib/time'
import { formatLongDate, timeAgo } from '@/utils/format'

function Row({ e, upcoming }) {
  const meta = EVENT_TYPES[e.type] ?? EVENT_TYPES.market
  const now = vnNow()
  const days = Math.round((new Date(e.date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000)
  return (
    <Link to={`/app/co-phieu/${e.ticker}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-raised">
      <TickerLogo ticker={e.ticker} color={e.color} size={32} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold">{e.ticker}</span>
          <Chip tone={meta.tone} className="h-5 px-2 text-[10.5px]">
            {meta.label}
          </Chip>
        </span>
        <span className="block truncate text-xs text-muted">{e.title}</span>
        <EpsLine event={e} className="block" />
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1 text-right">
        <span className="text-xs text-dim">{upcoming ? (days === 0 ? 'Hôm nay' : days === 1 ? 'Ngày mai' : `${days} ngày nữa`) : timeAgo(e.date, now.getTime())}</span>
        <span className="text-[11px] text-faint">{formatLongDate(e.date)}</span>
        <OutcomeChip event={e} className="h-5 px-2 text-[10.5px]" />
      </span>
    </Link>
  )
}

/** Sự kiện sắp tới / vừa qua của các mã đang theo dõi. */
export function RelatedEvents({ tickers }) {
  const { data, isLoading, error, refetch } = useEvents()
  const set = new Set(tickers)
  const today = new Date(vnNow()).setHours(0, 0, 0, 0)
  const mine = (data ?? []).filter((e) => e.ticker && set.has(e.ticker))
  const upcoming = mine.filter((e) => !e.done && e.date >= today).sort((a, b) => a.date - b.date).slice(0, 5)
  const recent = mine
    .filter((e) => e.done && e.date >= today - 30 * 86400000)
    .sort((a, b) => b.date - a.date)
    .slice(0, 3)

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="ds-h3">Sự kiện liên quan</h2>
        <Link to="/app/lich" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
          Mở lịch <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : !upcoming.length && !recent.length ? (
        <EmptyState icon={CalendarDays} title="Chưa có sự kiện" description="Các mã bạn theo dõi chưa có lịch công bố KQKD hay chia cổ tức trong thời gian tới." className="py-10" />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h3 className="ds-label px-2 pb-1">Sắp diễn ra</h3>
              {upcoming.map((e) => (
                <Row key={e.id} e={e} upcoming />
              ))}
            </section>
          )}
          {recent.length > 0 && (
            <section className="mt-3">
              <h3 className="ds-label px-2 pb-1">Vừa diễn ra</h3>
              {recent.map((e) => (
                <Row key={e.id} e={e} />
              ))}
            </section>
          )}
        </>
      )}
    </Card>
  )
}
