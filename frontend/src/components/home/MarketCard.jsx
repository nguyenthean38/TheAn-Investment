import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { LineChart } from '@/components/charts'
import { Card, ChangePill, ChangeText, ErrorState, Segmented, Skeleton, TickMeter, TickerLogo } from '@/components/ui'
import { useIndexHistory, useOverview, useSectors, useStocks } from '@/hooks/useMarket'
import { formatDate, formatLongDate, formatPercent, formatPoint, formatTime, formatValueVnd } from '@/utils/format'
import { cn } from '@/utils/cn'

const RANGES = [
  { value: '1D', label: 'Hôm nay' },
  { value: '1M', label: '1TH' },
  { value: '3M', label: '3TH' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1NĂM' },
  { value: '3Y', label: '3NĂM' },
]

const MOOD_TONE = { bullish: 'text-up', positive: 'text-up', neutral: 'text-ref', cautious: 'text-down', bearish: 'text-down' }

/** Nút chú thích bật/tắt chuỗi dữ liệu trên biểu đồ. */
function LegendToggle({ color, label, on, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn('inline-flex items-center gap-2 rounded-full px-1 text-[13px] transition-opacity', on ? 'text-fg' : 'text-faint')}
    >
      <span className="h-3.5 w-[3px] rounded-full" style={{ background: on ? color : 'var(--color-faint)' }} />
      {label}
    </button>
  )
}

/** Thanh độ rộng thị trường: tăng / đứng giá / giảm (+ trần / sàn). */
export function BreadthBar({ breadth, liquidity }) {
  const total = breadth.up + breadth.flat + breadth.down || 1
  const seg = (n) => `${(n / total) * 100}%`
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-overlay" role="img" aria-label={`${breadth.up} mã tăng, ${breadth.flat} mã đứng giá, ${breadth.down} mã giảm`}>
        <span className="bg-up" style={{ width: seg(breadth.up) }} />
        <span className="bg-ref" style={{ width: seg(breadth.flat) }} />
        <span className="bg-down" style={{ width: seg(breadth.down) }} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs">
        <div className="num flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-up">▲ {breadth.up} tăng</span>
          <span className="text-ref">■ {breadth.flat} đứng giá</span>
          <span className="text-down">▼ {breadth.down} giảm</span>
          <span className="text-ceil">{breadth.ceil} trần</span>
          <span className="text-floor">{breadth.floor} sàn</span>
        </div>
        {liquidity != null && (
          <span className="text-muted">
            Thanh khoản <span className="num font-medium text-fg">{formatValueVnd(liquidity)}</span>
          </span>
        )}
      </div>
    </div>
  )
}

/** Dãy 4 chỉ số chính. */
function IndexStrip({ indices }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
      {indices.map((ix) => (
        <div key={ix.code} className="bg-surface px-3.5 py-3">
          <div className="text-xs text-muted">{ix.name}</div>
          <div className="num mt-0.5 text-[15px] font-semibold">{formatPoint(ix.value)}</div>
          <ChangeText change={ix.change} pct={ix.changePct} digits={2} className="text-[11.5px]" />
        </div>
      ))}
    </div>
  )
}

/** Danh sách hiệu suất ngành — bấm để xem các mã trong ngành. */
function SectorList() {
  const { data: sectors, isLoading, error, refetch } = useSectors()
  const { data: stocks = [] } = useStocks()
  const byTicker = useMemo(() => new Map(stocks.map((s) => [s.ticker, s])), [stocks])
  const [open, setOpen] = useState(null)
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    )
  const max = Math.max(1.5, ...sectors.map((s) => Math.abs(s.changePct)))
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-base/60">
      {sectors.map((s) => {
        const isOpen = open === s.id
        const tone = s.changePct > 0.005 ? 'bg-up' : s.changePct < -0.005 ? 'bg-down' : 'bg-ref'
        return (
          <li key={s.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : s.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-raised/60"
            >
              <span className={cn('size-2 shrink-0 rounded-full', tone)} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm text-dim">{s.name}</span>
              <span className={cn('num w-16 text-right text-[13px] font-medium', s.changePct >= 0 ? 'text-up' : 'text-down')}>{formatPercent(s.changePct)}</span>
              <TickMeter value={s.changePct} max={max} ticks={22} className="hidden sm:inline-flex" />
              <ChevronDown className={cn('size-4 shrink-0 text-faint transition-transform', isOpen && 'rotate-180')} aria-hidden />
            </button>
            {isOpen && (
              <div className="flex animate-fade-in flex-wrap gap-2 px-4 pt-1 pb-3.5">
                {s.tickers.map((t) => {
                  const st = byTicker.get(t)
                  return (
                    <Link
                      key={t}
                      to={`/app/co-phieu/${t}`}
                      className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-raised py-1 pr-1.5 pl-1 text-xs font-semibold transition-colors hover:border-muted"
                    >
                      <TickerLogo ticker={t} color={st?.color} size={20} />
                      {t}
                      {st && <ChangePill value={st.changePct} size="sm" />}
                    </Link>
                  )
                })}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Thẻ thị trường: tâm lý, biểu đồ VN-Index + biến động, chỉ số, độ rộng, ngành. */
export function MarketCard() {
  const { data: overview, error, refetch } = useOverview()
  const [range, setRange] = useState('1Y')
  const [showIndex, setShowIndex] = useState(true)
  const [showVol, setShowVol] = useState(true)
  const { data: history, isFetching } = useIndexHistory('VNINDEX', range)

  const intraday = range === '1D'
  const indexSeries = useMemo(() => (history ?? []).map((d) => ({ t: d.t, value: d.value })), [history])
  const volSeries = useMemo(() => (history ?? []).filter((d) => d.volatility != null).map((d) => ({ t: d.t, value: d.volatility })), [history])
  const vn = overview?.indices.find((i) => i.code === 'VNINDEX')

  const canVol = !intraday && volSeries.length > 0
  const volOn = showVol && canVol
  const indexOn = showIndex || !volOn
  // Nếu tắt VN-Index mà còn biến động → vẽ biến động làm chuỗi chính
  const series =
    !indexOn
      ? [{ id: 'vol', label: 'Chỉ số biến động', color: '#a78bfa', data: volSeries, area: true }]
      : [{ id: 'vn', label: 'VN-Index', color: '#f3f3f4', data: indexSeries, area: true }]
  const sub = indexOn && volOn ? { data: volSeries, color: '#a78bfa', label: 'Chỉ số biến động', format: (v) => `${v.toFixed(1).replace('.', ',')}%`, height: 56 } : undefined

  if (error) return <Card className="p-6"><ErrorState error={error} onRetry={refetch} /></Card>

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      {overview ? (
        <div>
          <p className="text-[13px] text-muted">{formatLongDate(overview.tradingDay)}</p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
            Thị trường đang <span className={MOOD_TONE[overview.mood.id] ?? 'text-fg'}>{overview.mood.label}</span>
          </h2>
          {vn && (
            <p className="num mt-1 text-sm text-dim">
              VN-Index {formatPoint(vn.value)} <ChangeText change={vn.change} pct={vn.changePct} digits={2} className="ml-1" />
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-64" />
        </div>
      )}

      <div className={cn('mt-5 transition-opacity', isFetching && 'opacity-60')}>
        <LineChart
          series={series}
          subSeries={sub}
          height={sub ? 300 : 260}
          yFormat={(v) => formatPoint(v)}
          xFormat={(t) => (intraday ? formatTime(t) : formatDate(t))}
          tooltipTitle={(t) => (intraday ? `Hôm nay, ${formatTime(t)}` : formatDate(t))}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <LegendToggle color="#f3f3f4" label="VN-Index" on={indexOn} onClick={() => volOn && setShowIndex(!indexOn)} />
          <LegendToggle color="#a78bfa" label="Biến động" on={volOn} onClick={() => canVol && (!volOn || indexOn) && setShowVol(!volOn)} />
          <Link to="/app/danh-muc" className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-xs text-muted transition-colors hover:text-fg">
            So với danh mục <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <Segmented size="sm" options={RANGES} value={range} onChange={setRange} ariaLabel="Khung thời gian" />
      </div>

      {overview && (
        <div className="mt-6 space-y-5">
          <IndexStrip indices={overview.indices} />
          <BreadthBar breadth={overview.breadth} liquidity={overview.liquidity} />
        </div>
      )}

      <div className="mt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="ds-h3">Hiệu suất ngành</h3>
          <span className="text-xs text-muted">Phiên gần nhất · bấm để xem mã</span>
        </div>
        <SectorList />
      </div>
    </Card>
  )
}
