import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { LineChart } from '@/components/charts'
import { ChangePill, LogoMark, Segmented, Skeleton, TickMeter, TickerLogo } from '@/components/ui'
import { useIndexHistory, useNews, useOverview, useRecap, useSectors, useStocks } from '@/hooks/useMarket'
import { formatLongDate, formatPercent, formatPoint, timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'

const RANGES = [
  { value: '1M', label: '1TH' },
  { value: '3M', label: '3TH' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1N' },
]

const MOOD_TONE = { bullish: 'text-up', positive: 'text-up', neutral: 'text-ref', cautious: 'text-down', bearish: 'text-down' }

/** Ô xem trước sản phẩm: dựng bằng component và dữ liệu thật của ứng dụng. */
export function ProductPreview({ className }) {
  const [range, setRange] = useState('1Y')
  const { data: overview } = useOverview()
  const { data: history } = useIndexHistory('VNINDEX', range)
  const { data: sectors } = useSectors()
  const { data: recap } = useRecap()
  const { data: news } = useNews({ limit: 6 })
  const { data: stocks = [] } = useStocks()
  const byTicker = new Map(stocks.map((s) => [s.ticker, s]))
  const vn = overview?.indices.find((i) => i.code === 'VNINDEX')

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute -inset-x-10 -top-16 bottom-10 rounded-[60px] bg-[radial-gradient(50%_50%_at_50%_40%,rgb(255_163_108/0.22),transparent_70%)] blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[22px] border border-line-strong bg-base shadow-[0_60px_160px_-40px_rgb(0_0_0/0.95)]">
        {/* Thanh cửa sổ */}
        <div className="flex h-10 items-center gap-3 border-b border-line bg-surface px-4">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
            <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
            <span className="size-2.5 rounded-full bg-[#28c840]/80" />
          </span>
          <span className="mx-auto hidden rounded-full border border-line bg-base px-4 py-0.5 text-[11px] text-faint sm:block">nhip.vn/app</span>
          <span className="w-12" />
        </div>

        <div className="p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <span className="flex items-center gap-2.5">
              <LogoMark size={22} />
              <span className="text-[15px] font-semibold">Chào buổi sáng, Minh Anh</span>
            </span>
            {vn && (
              <span className="num hidden text-xs text-muted sm:inline">
                VN-Index <span className="text-fg">{formatPoint(vn.value)}</span> <span className={vn.change >= 0 ? 'text-up' : 'text-down'}>{formatPercent(vn.changePct)}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_1fr]">
            {/* Thẻ thị trường */}
            <div className="card p-4 sm:p-5">
              <div className="text-xs text-muted">{overview ? formatLongDate(overview.tradingDay) : '…'}</div>
              <div className="mt-0.5 text-[15px] font-semibold">
                Thị trường đang <span className={MOOD_TONE[overview?.mood.id] ?? 'text-dim'}>{overview?.mood.label ?? '…'}</span>
              </div>
              <div className="mt-3">
                {history ? (
                  <LineChart
                    height={190}
                    series={[{ id: 'vn', label: 'VN-Index', color: '#f3f3f4', data: history, area: true }]}
                    subSeries={{ label: 'Biến động', color: '#a78bfa', data: history.map((d) => ({ t: d.t, value: d.volatility })), format: (v) => formatPercent(v, { sign: false, digits: 1 }), height: 34 }}
                    yFormat={(v) => formatPoint(v)}
                    xFormat={(t) => new Date(t).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })}
                    tooltipTitle={(t) => new Date(t).toLocaleDateString('vi-VN')}
                  />
                ) : (
                  <Skeleton className="h-[190px]" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-3 text-xs text-dim">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-[3px] rounded-full bg-fg" /> VN-Index
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-[3px] rounded-full bg-series-2" /> Biến động
                  </span>
                </span>
                <Segmented size="sm" options={RANGES} value={range} onChange={setRange} ariaLabel="Khung thời gian" />
              </div>
              <ul className="mt-4 hidden rounded-2xl border border-line bg-base px-3 sm:block">
                {(sectors ?? Array.from({ length: 5 })).slice(0, 5).map((s, i) => (
                  <li key={s?.id ?? i} className="flex items-center gap-3 border-b border-line py-2 text-[12.5px] last:border-0">
                    {s ? (
                      <>
                        <span className="min-w-0 flex-1 truncate text-dim">{s.name}</span>
                        <span className={cn('num w-14 text-right font-medium', s.changePct >= 0 ? 'text-up' : 'text-down')}>{formatPercent(s.changePct)}</span>
                        <TickMeter value={s.changePct} max={2} ticks={22} />
                      </>
                    ) : (
                      <Skeleton className="h-4 w-full" />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bản tin + tin tức */}
            <div className="flex min-w-0 flex-col gap-3">
              <div className="relative overflow-hidden rounded-[18px] border border-line bg-[linear-gradient(160deg,rgb(47_210_138/0.08),transparent_45%),#060608] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-raised px-2.5 py-1 text-[11px] font-medium">
                    <Sparkles className="size-3 text-brand" /> Bản tin thị trường
                  </span>
                  {recap && <span className="text-[11px] text-faint">Tổng hợp lúc {new Date(recap.generatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {recap ? (
                  <p className="line-clamp-5 text-[14px] leading-relaxed font-semibold text-fg sm:text-[15px]">{recap.headline}</p>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                )}
              </div>
              {(news ?? []).filter((n) => n.tickers.length).slice(0, 3).map((n) => {
                const s = byTicker.get(n.tickers[0])
                return (
                  <div key={n.id} className="card hidden p-4 sm:block">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-raised py-0.5 pr-2.5 pl-0.5 text-[11px] font-semibold">
                        <TickerLogo ticker={n.tickers[0]} color={s?.color} size={18} />
                        {n.tickers[0]}
                        {s && <ChangePill value={s.changePct} size="sm" />}
                      </span>
                      <span className="text-[11px] text-faint">{timeAgo(n.publishedAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-[13px] text-dim">{n.title}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
