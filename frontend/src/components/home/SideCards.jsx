import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock } from 'lucide-react'
import { BarChart } from '@/components/charts'
import { Card, ChangePill, Chip, EmptyState, ErrorState, PriceText, Segmented, Skeleton, TickerCell, TickerLogo } from '@/components/ui'
import { useEvents, useForeignMarket, useMovers } from '@/hooks/useMarket'
import { vnNow } from '@/lib/time'
import { formatDate, formatMediumDate, formatValueVnd, weekdayShort } from '@/utils/format'
import { cn } from '@/utils/cn'

function CardTitle({ children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="ds-h3">{children}</h2>
      {action}
    </div>
  )
}

function RowsSkeleton({ n = 4 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className="h-11" />
      ))}
    </div>
  )
}

const EVENT_LABEL = { earnings: { label: 'KQKD', tone: 'brand' }, dividend: { label: 'Cổ tức', tone: 'up' } }

/** Sự kiện sắp tới: công bố KQKD & ngày GDKHQ cổ tức. */
export function UpcomingEvents() {
  const { data, isLoading, error, refetch } = useEvents()
  const list = useMemo(() => {
    const now = vnNow().getTime()
    return (data ?? []).filter((e) => !e.done && e.date >= now - 3600000 && EVENT_LABEL[e.type]).slice(0, 4)
  }, [data])
  return (
    <Card className="p-5">
      <CardTitle
        action={
          <Link to="/app/lich" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
            Xem lịch <ArrowUpRight className="size-3.5" />
          </Link>
        }
      >
        Sự kiện sắp tới
      </CardTitle>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <RowsSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Chưa có sự kiện" description="Không có sự kiện doanh nghiệp nào trong thời gian tới." className="py-8" />
      ) : (
        <ul className="space-y-1">
          {list.map((e) => {
            const meta = EVENT_LABEL[e.type]
            return (
              <li key={e.id}>
                <Link to={`/app/co-phieu/${e.ticker}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-raised">
                  <TickerLogo ticker={e.ticker} color={e.color} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {e.ticker} <Chip tone={meta.tone} className="h-5 px-2 text-[10.5px]">{meta.label}</Chip>
                    </span>
                    <span className="block truncate text-xs text-muted">{e.title}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="num block text-[13px] font-medium">
                      {weekdayShort(e.date)}, {formatMediumDate(e.date, false)}
                    </span>
                    <span className="block text-[11px] text-faint">{e.session === 'pre' ? 'Trước phiên' : 'Sau phiên'}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

const MOVER_TABS = [
  { value: 'gainers', label: 'Tăng mạnh' },
  { value: 'losers', label: 'Giảm mạnh' },
  { value: 'active', label: 'Giao dịch nhiều' },
]

/** Cổ phiếu nổi bật trong phiên. */
export function MoversCard() {
  const { data, isLoading, error, refetch } = useMovers()
  const [tab, setTab] = useState('gainers')
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ds-h3">Cổ phiếu nổi bật</h2>
        <Segmented size="sm" options={MOVER_TABS} value={tab} onChange={setTab} ariaLabel="Nhóm cổ phiếu nổi bật" />
      </div>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <RowsSkeleton n={5} />
      ) : (
        <ul className="divide-y divide-line">
          {data[tab].slice(0, 5).map((s) => (
            <li key={s.ticker} className="flex items-center gap-3 py-2.5">
              <TickerCell ticker={s.ticker} name={s.name} color={s.color} className="flex-1" />
              <span className="ml-auto text-right">
                <PriceText price={s.price} quote={s} className="block text-sm" />
                {tab === 'active' && <span className="num block text-[11px] text-muted">{formatValueVnd(s.value)}</span>}
              </span>
              <ChangePill value={s.changePct} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/** Dòng tiền khối ngoại. */
export function ForeignCard() {
  const { data, isLoading, error, refetch } = useForeignMarket()
  const chart = useMemo(
    () => (data?.series ?? []).slice(-20).map((d) => ({ label: formatDate(d.t, { day: '2-digit', month: '2-digit' }), values: [d.net / 1e9] })),
    [data],
  )
  return (
    <Card className="p-5">
      <CardTitle action={<span className="text-xs text-muted">20 phiên gần nhất</span>}>Khối ngoại</CardTitle>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <RowsSkeleton n={3} />
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className={cn('num text-2xl font-bold tracking-tight', data.net >= 0 ? 'text-up' : 'text-down')}>
              {data.net >= 0 ? '+' : '-'}
              {formatValueVnd(Math.abs(data.net))}
            </span>
            <span className="text-sm text-muted">{data.net >= 0 ? 'mua ròng' : 'bán ròng'} phiên gần nhất</span>
          </div>
          <BarChart
            className="mt-3"
            height={150}
            data={chart}
            keys={[{ label: 'Mua/bán ròng', color: '#2fd28a' }]}
            colorFn={(v) => (v >= 0 ? '#2fd28a' : '#ff5a6a')}
            yFormat={(v) => `${Math.round(v)} tỷ`}
            showLegend={false}
          />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Mua ròng nhiều', data.topBuy, 'text-up'],
              ['Bán ròng nhiều', data.topSell, 'text-down'],
            ].map(([title, list, tone]) => (
              <div key={title}>
                <div className="ds-caption mb-2">{title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {list.slice(0, 3).map((x) => (
                    <Link
                      key={x.ticker}
                      to={`/app/co-phieu/${x.ticker}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-raised py-1 pr-2.5 pl-1 text-xs hover:border-muted"
                    >
                      <TickerLogo ticker={x.ticker} color={x.color} size={18} />
                      <span className="font-semibold">{x.ticker}</span>
                      <span className={cn('num', tone)}>{formatValueVnd(Math.abs(x.net))}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
