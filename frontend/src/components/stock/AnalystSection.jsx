import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkle } from 'lucide-react'
import { useElementSize } from '@/components/charts'
import { Card, ChangePill, Chip, ErrorState, SectionHeader, Skeleton } from '@/components/ui'
import { useAnalysts, useStockHistory } from '@/hooks/useMarket'
import { cn } from '@/utils/cn'
import { formatDate, formatPercent, formatPrice } from '@/utils/format'
import { ACTION_LABEL, RATING_COLOR, RATING_LABEL, pct } from './shared'

const ORDER = ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']
const CONSENSUS_TONE = { 'Mua mạnh': 'up', 'Khả quan': 'up', 'Trung lập': 'ref', 'Thận trọng': 'down' }

/** Mục "Khuyến nghị của CTCK" [A]. */
export function AnalystSection({ stock }) {
  const { data, isLoading, error, refetch } = useAnalysts(stock.ticker)
  return (
    <section id="khuyen-nghi" className="scroll-mt-24">
      <SectionHeader
        title="Khuyến nghị của CTCK"
        kbd="A"
        subtitle={data ? `Đồng thuận: ${data.consensus.toLowerCase()} · ${data.total} công ty phân tích` : 'Tổng hợp báo cáo phân tích gần nhất'}
        tone={data ? CONSENSUS_TONE[data.consensus] : undefined}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <Card className="p-5">
              <h3 className="ds-h3">Phân bổ khuyến nghị</h3>
              <p className="ds-caption">Số công ty chứng khoán theo từng mức</p>
              <RatingRadar counts={data.counts} consensus={data.consensus} />
              <RatingBar counts={data.counts} total={data.total} />
            </Card>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="ds-h3">Giá mục tiêu</h3>
                  <p className="ds-caption">Trung vị 12 tháng so với giá hiện tại</p>
                </div>
                <div className="text-right">
                  <div className="num text-xl font-bold">{formatPrice(data.target.median)}đ</div>
                  <div className={cn('num text-[13px] font-medium', data.target.upside >= 0 ? 'text-up' : 'text-down')}>
                    {formatPercent(data.target.upside)} tiềm năng
                  </div>
                </div>
              </div>
              <TargetFan stock={stock} target={data.target} />
            </Card>
          </div>
          <Card className="mt-4 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
              <h3 className="ds-h3">Báo cáo gần đây</h3>
              <span className="text-[11.5px] text-faint">Tên công ty phân tích là mô phỏng</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-5 py-2.5 font-medium">Hành động</th>
                    <th className="px-3 py-2.5 font-medium">Khuyến nghị</th>
                    <th className="px-3 py-2.5 font-medium">Công ty</th>
                    <th className="px-3 py-2.5 text-right font-medium">Giá mục tiêu</th>
                    <th className="px-3 py-2.5 text-right font-medium">So với giá hiện tại</th>
                    <th className="px-5 py-2.5 text-right font-medium">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {data.actions.map((a) => (
                    <tr key={a.id} className="border-t border-line transition-colors hover:bg-raised/60">
                      <td className="px-5 py-3">
                        <ActionBadge action={a.action} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {a.prevRating !== a.rating && a.action !== 'init' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-muted">{RATING_LABEL[a.prevRating]}</span>
                            <ArrowRight className="size-3 text-faint" />
                            <span style={{ color: RATING_COLOR[a.rating] }}>{RATING_LABEL[a.rating]}</span>
                          </span>
                        ) : (
                          <span style={{ color: RATING_COLOR[a.rating] }}>{RATING_LABEL[a.rating]}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-dim">{a.house}</td>
                      <td className="num px-3 py-3 text-right whitespace-nowrap">
                        {a.prevTarget !== a.target && a.action !== 'init' && <span className="text-muted">{formatPrice(a.prevTarget)} → </span>}
                        <span className="font-semibold">{formatPrice(a.target)}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ChangePill value={pct(a.target, stock.price)} />
                      </td>
                      <td className="num px-5 py-3 text-right whitespace-nowrap text-muted">{formatDate(a.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </section>
  )
}

function ActionBadge({ action }) {
  const map = {
    init: { tone: 'info', Icon: Sparkle },
    upgrade: { tone: 'up', Icon: ArrowUpRight },
    downgrade: { tone: 'down', Icon: ArrowDownRight },
    reiterate: { tone: 'neutral', Icon: ArrowRight },
  }
  const { tone, Icon } = map[action] ?? map.reiterate
  return (
    <Chip tone={tone}>
      <Icon className="size-3" /> {ACTION_LABEL[action]}
    </Chip>
  )
}

/** Biểu đồ ngũ giác 5 mức khuyến nghị. */
function RatingRadar({ counts, consensus }) {
  const size = 220
  const c = size / 2
  const R = 78
  const max = Math.max(1, ...ORDER.map((k) => counts[k]))
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5
  const pt = (i, r) => [c + Math.cos(angle(i)) * r, c + Math.sin(angle(i)) * r]
  const poly = ORDER.map((k, i) => pt(i, 10 + (counts[k] / max) * (R - 10)).join(',')).join(' ')
  return (
    <div className="relative mx-auto mt-2 w-full max-w-[260px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img" aria-label="Phân bổ khuyến nghị">
        <defs>
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#ffa36c" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffa36c" stopOpacity="0.08" />
          </radialGradient>
        </defs>
        {[0.33, 0.66, 1].map((f) => (
          <polygon key={f} points={ORDER.map((_, i) => pt(i, R * f).join(',')).join(' ')} fill="none" stroke="rgb(255 255 255 / 0.07)" />
        ))}
        {ORDER.map((_, i) => {
          const [x, y] = pt(i, R)
          return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgb(255 255 255 / 0.06)" />
        })}
        <polygon points={poly} fill="url(#radar-fill)" stroke="#ffa36c" strokeWidth="1.5" strokeLinejoin="round" />
        {ORDER.map((k, i) => {
          const [x, y] = pt(i, 10 + (counts[k] / max) * (R - 10))
          return <circle key={k} cx={x} cy={y} r="3" fill={RATING_COLOR[k]} />
        })}
        {ORDER.map((k, i) => {
          const [x, y] = pt(i, R + 22)
          return (
            <text key={k} x={x} y={y} textAnchor="middle" className="text-[10px]" fill="#85858e">
              <tspan x={x} dy="-2">
                {RATING_LABEL[k]}
              </tspan>
              <tspan x={x} dy="12" className="num font-semibold" fill={RATING_COLOR[k]}>
                {counts[k]}
              </tspan>
            </text>
          )
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-canvas/80 px-2 py-0.5 text-[11px] font-semibold text-fg">{consensus}</span>
      </div>
    </div>
  )
}

function RatingBar({ counts, total }) {
  return (
    <div className="mt-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-overlay">
        {ORDER.map((k) => (counts[k] ? <span key={k} style={{ width: `${(counts[k] / total) * 100}%`, background: RATING_COLOR[k] }} /> : null))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>Mua {Math.round(((counts.strong_buy + counts.buy) / total) * 100)}%</span>
        <span>Trung lập {Math.round((counts.hold / total) * 100)}%</span>
        <span>Bán {Math.round(((counts.sell + counts.strong_sell) / total) * 100)}%</span>
      </div>
    </div>
  )
}

/** Biểu đồ "quạt" giá mục tiêu: giá 1 năm qua → 3 nhánh cao / trung vị / thấp. */
function TargetFan({ stock, target }) {
  const [ref, { width }] = useElementSize()
  const { data: hist } = useStockHistory(stock.ticker, '1Y')
  const height = 260
  if (!hist) return <Skeleton className="mt-4 h-[260px]" />
  const values = hist.map((d) => d.value)
  const min = Math.min(...values, target.low) * 0.96
  const max = Math.max(...values, target.high) * 1.04
  const histW = width * 0.62
  const right = 120
  const y = (v) => 14 + (1 - (v - min) / (max - min)) * (height - 40)
  const x = (i) => (i / (values.length - 1)) * histW
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const last = { x: histW, y: y(values[values.length - 1]) }
  const endX = Math.max(histW + 40, width - right)
  const branches = [
    { key: 'high', label: 'Cao nhất', v: target.high, color: '#2fd28a' },
    { key: 'median', label: 'Trung vị', v: target.median, color: '#ffa36c' },
    { key: 'low', label: 'Thấp nhất', v: target.low, color: '#ff5a6a' },
  ]
  return (
    <div ref={ref} className="relative mt-4" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" role="img" aria-label="Giá mục tiêu">
          <defs>
            <linearGradient id="fan-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f3f3f4" stopOpacity="0.12" />
              <stop offset="1" stopColor="#f3f3f4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${last.x},${last.y} ${endX},${y(target.high)} ${endX},${y(target.low)}`} fill="#ffa36c" fillOpacity="0.06" />
          <path d={`${path}L${histW},${height - 26}L0,${height - 26}Z`} fill="url(#fan-area)" />
          <path d={path} fill="none" stroke="#f3f3f4" strokeWidth="1.6" strokeLinejoin="round" />
          <line x1={histW} x2={histW} y1={8} y2={height - 26} stroke="rgb(255 255 255 / 0.12)" strokeDasharray="2 4" />
          <text x={histW - 6} y={height - 8} textAnchor="end" className="fill-faint text-[10.5px]">
            Hôm nay
          </text>
          <text x={endX} y={height - 8} textAnchor="end" className="fill-faint text-[10.5px]">
            12 tháng tới
          </text>
          {branches.map((b) => (
            <g key={b.key}>
              <line x1={last.x} y1={last.y} x2={endX} y2={y(b.v)} stroke={b.color} strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
              <circle cx={endX} cy={y(b.v)} r="3.5" fill={b.color} />
              <text x={endX + 10} y={y(b.v) - 2} className="num text-[12px] font-semibold" fill={b.color}>
                {formatPrice(b.v)}
              </text>
              <text x={endX + 10} y={y(b.v) + 12} className="text-[10.5px]" fill="#85858e">
                {b.label} · {formatPercent(pct(b.v, stock.price), { digits: 1 })}
              </text>
            </g>
          ))}
          <circle cx={last.x} cy={last.y} r="4" fill="#f3f3f4" stroke="#09090b" strokeWidth="2" />
        </svg>
      )}
    </div>
  )
}
