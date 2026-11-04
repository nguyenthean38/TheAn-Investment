import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { useElementSize, niceTicks } from '@/components/charts'
import { Card, ChangePill, Chip, ErrorState, SectionHeader, Segmented, Skeleton } from '@/components/ui'
import { useEarnings } from '@/hooks/useMarket'
import { cn } from '@/utils/cn'
import { formatBillion, formatDate, formatPercent, formatPrice, weekdayName } from '@/utils/format'
import { pct } from './shared'

/** Mục "Kết quả kinh doanh" [E]. */
export function EarningsSection({ stock }) {
  const { data, isLoading, error, refetch } = useEarnings(stock.ticker)
  const [view, setView] = useState('overview')
  const lastActual = data?.history[data.history.length - 1]?.actualEps
  const forecast = data ? pct(data.next.estEps, lastActual) : null
  const beats = data?.history.filter((h) => h.beat).length ?? 0

  return (
    <section id="ket-qua" className="scroll-mt-24">
      <SectionHeader
        title="Kết quả kinh doanh"
        kbd="E"
        subtitle={data ? `EPS dự phóng quý tới ${forecast >= 0 ? 'tăng' : 'giảm'} ${formatPercent(Math.abs(forecast), { sign: false, digits: 1 })} · vượt kỳ vọng ${beats}/${data.history.length} quý gần nhất` : 'So sánh lợi nhuận thực tế với dự phóng'}
        tone={data ? (forecast >= 0 ? 'up' : 'down') : undefined}
        action={
          <Segmented
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'overview', label: 'Tổng quan' },
              { value: 'history', label: 'Lịch sử' },
            ]}
          />
        }
      />
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : view === 'overview' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="ds-h3">Lợi nhuận trên mỗi cổ phiếu (EPS)</h3>
                <p className="ds-caption">Đơn vị: đồng/cổ phiếu</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border-2 border-brand" /> Dự phóng
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-fg" /> Thực tế
                </span>
              </div>
            </div>
            <EpsDotPlot history={data.history} next={data.next} />
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.history.slice(-3).map((h) => (
              <QuarterCard key={h.period} h={h} />
            ))}
            <NextCard next={data.next} lastActual={lastActual} />
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Quý · Ngày công bố</th>
                  <th className="px-3 py-3 font-medium">Kết quả</th>
                  <th className="px-3 py-3 text-right font-medium">EPS dự phóng</th>
                  <th className="px-3 py-3 text-right font-medium">EPS thực tế</th>
                  <th className="px-3 py-3 text-right font-medium">DT dự phóng</th>
                  <th className="px-3 py-3 text-right font-medium">DT thực tế</th>
                  <th className="px-5 py-3 text-right font-medium">Phản ứng giá</th>
                </tr>
              </thead>
              <tbody>
                {[...data.history].reverse().map((h) => (
                  <tr key={h.period} className="border-t border-line hover:bg-raised/60">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-semibold">{h.period}</span> <span className="text-muted">· {formatDate(h.reportDate)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Chip tone={h.beat ? 'up' : 'down'}>{h.beat ? 'Vượt' : 'Hụt'}</Chip>
                    </td>
                    <td className="num px-3 py-3 text-right text-dim">{formatPrice(h.estEps)}</td>
                    <td className="num px-3 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold">{formatPrice(h.actualEps)}</span>{' '}
                      <span className={cn('text-xs', h.epsSurprise >= 0 ? 'text-up' : 'text-down')}>({formatPercent(h.epsSurprise, { digits: 1 })})</span>
                    </td>
                    <td className="num px-3 py-3 text-right text-dim">{formatBillion(h.estRevenue, { compact: false })}</td>
                    <td className="num px-3 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold">{formatBillion(h.actualRevenue, { compact: false })}</span>{' '}
                      <span className={cn('text-xs', h.revenueSurprise >= 0 ? 'text-up' : 'text-down')}>({formatPercent(h.revenueSurprise, { digits: 1 })})</span>
                    </td>
                    <td className="px-5 py-3 text-right">{h.reaction != null ? <ChangePill value={h.reaction} /> : <span className="text-faint">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  )
}

function QuarterCard({ h }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{h.period}</span>
        <Chip tone={h.beat ? 'up' : 'down'}>{h.beat ? 'Vượt kỳ vọng' : 'Hụt kỳ vọng'}</Chip>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="ds-caption">EPS</div>
          <div className="num font-semibold">{formatPrice(h.actualEps)}đ</div>
          <ChangePill size="sm" value={h.epsSurprise} digits={1} className="mt-1" />
        </div>
        <div>
          <div className="ds-caption">Doanh thu</div>
          <div className="num font-semibold">{formatBillion(h.actualRevenue)}</div>
          <ChangePill size="sm" value={h.revenueSurprise} digits={1} className="mt-1" />
        </div>
      </div>
      <p className="mt-3 text-[11.5px] text-faint">Công bố {formatDate(h.reportDate)}</p>
    </Card>
  )
}

function NextCard({ next, lastActual }) {
  const d = new Date(next.reportDate)
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-brand/30 bg-gradient-to-br from-brand/12 via-surface to-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{next.period}</span>
        <CalendarClock className="size-4 text-brand" />
      </div>
      <div className="mt-3 ds-caption">Dự kiến công bố</div>
      <div className="font-semibold">
        {weekdayName(d)}, {formatDate(d)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="ds-caption">EPS dự phóng</div>
          <div className="num font-semibold">{formatPrice(next.estEps)}đ</div>
          <ChangePill size="sm" value={pct(next.estEps, lastActual)} digits={1} className="mt-1" />
        </div>
        <div>
          <div className="ds-caption">DT dự phóng</div>
          <div className="num font-semibold">{formatBillion(next.estRevenue)}</div>
        </div>
      </div>
    </div>
  )
}

/** Biểu đồ chấm EPS: vòng rỗng = dự phóng, chấm đặc = thực tế. */
function EpsDotPlot({ history, next }) {
  const [ref, { width }] = useElementSize()
  const height = 250
  const cols = [...history.map((h) => ({ ...h, kind: 'past' })), { ...next, kind: 'next' }]
  const vals = cols.flatMap((c) => [c.estEps, c.actualEps]).filter((v) => v != null)
  const ticks = niceTicks(Math.min(...vals) * 0.9, Math.max(...vals) * 1.08, 4)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const right = 56
  const innerW = Math.max(10, width - right)
  const colW = innerW / cols.length
  const y = (v) => 10 + (1 - (v - lo) / (hi - lo || 1)) * (height - 64)
  return (
    <div ref={ref} className="mt-4" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.05)" strokeDasharray="2 4" />
              <text x={innerW + 8} y={y(t) + 4} className="num fill-faint text-[10.5px]">
                {formatPrice(t)}
              </text>
            </g>
          ))}
          {cols.map((c, i) => {
            const cx = i * colW + colW / 2
            const color = c.kind === 'next' ? '#ffa36c' : c.beat ? '#2fd28a' : '#ff5a6a'
            return (
              <g key={c.period}>
                {c.kind === 'next' && <rect x={i * colW + 4} y={4} width={colW - 8} height={height - 50} rx={10} fill="#ffa36c" fillOpacity="0.05" stroke="#ffa36c" strokeOpacity="0.2" strokeDasharray="3 3" />}
                {c.actualEps != null && <line x1={cx} x2={cx} y1={y(c.estEps)} y2={y(c.actualEps)} stroke={color} strokeOpacity="0.5" strokeWidth="2" />}
                <circle cx={cx} cy={y(c.estEps)} r="6.5" fill="#09090b" stroke="#ffa36c" strokeWidth="2" />
                {c.actualEps != null && <circle cx={cx} cy={y(c.actualEps)} r="5.5" fill="#f3f3f4" />}
                <text x={cx} y={height - 30} textAnchor="middle" className="num fill-muted text-[10.5px]">
                  {c.period}
                </text>
                <text x={cx} y={height - 14} textAnchor="middle" className="text-[10.5px] font-semibold" fill={color}>
                  {c.kind === 'next' ? 'Sắp tới' : c.beat ? 'Vượt' : 'Hụt'}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
