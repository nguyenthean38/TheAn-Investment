import { Fragment, useMemo, useState } from 'react'
import { Mic, Sparkles, TrendingUp, Flag } from 'lucide-react'
import { niceTicks, useElementSize } from '@/components/charts'
import { Card, Chip, ErrorState, SectionHeader, Skeleton } from '@/components/ui'
import { useMacro } from '@/hooks/useMarket'
import { vnNow } from '@/lib/time'
import { formatMediumDate, formatTime, weekdayShort } from '@/utils/format'
import { cn } from '@/utils/cn'

export const FLAGS = { VN: '🇻🇳', US: '🇺🇸', CN: '🇨🇳' }
const COUNTRY_NAME = { VN: 'Việt Nam', US: 'Mỹ', CN: 'Trung Quốc' }

/** "3,02%" → 3.02 ; "+12,4%" → 12.4 ; "256K" → 256 */
function parseNum(s) {
  if (s == null) return null
  const n = parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
  return Number.isNaN(n) ? null : n
}

/** Vạch mức ảnh hưởng (1–3). */
export function ImpactBars({ level }) {
  const color = level >= 3 ? 'bg-down' : level === 2 ? 'bg-brand' : 'bg-muted'
  return (
    <span className="inline-flex items-end gap-[3px]" role="img" aria-label={`Mức ảnh hưởng ${level}/3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn('w-[4px] rounded-sm', i <= level ? color : 'bg-overlay')} style={{ height: 5 + i * 4 }} />
      ))}
    </span>
  )
}

/** Thẻ triển vọng vĩ mô (tóm tắt tự động). */
function OutlookCard({ outlook }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-white/[0.07] bg-[#07070a] p-6 sm:p-8">
      <div className="pointer-events-none absolute -top-28 -right-10 size-80 rounded-full bg-up/12 blur-[100px]" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-up/30 bg-up/10 py-1 pr-3 pl-2 text-xs font-medium text-up">
          <TrendingUp className="size-3.5" /> {outlook.label} ↗
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Sparkles className="size-3.5" /> Tổng hợp tự động từ số liệu vĩ mô mới nhất
        </span>
      </div>
      <p className="relative mt-5 max-w-4xl text-lg leading-[1.6] font-semibold text-fg/90 sm:text-[22px]">{outlook.summary}</p>
    </div>
  )
}

/** Đường cong lợi suất trái phiếu Chính phủ: hiện tại vs tuần trước. */
function YieldCurve({ data }) {
  const [ref, { width }] = useElementSize()
  const [hover, setHover] = useState(null)
  const height = 240
  const pad = { l: 8, r: 48, t: 16, b: 30 }
  const vals = data.flatMap((d) => [d.value, d.prev])
  const ticks = niceTicks(Math.min(...vals) - 0.1, Math.max(...vals) + 0.1, 4)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const iw = Math.max(10, width - pad.l - pad.r)
  const ih = height - pad.t - pad.b
  const x = (i) => pad.l + (i / (data.length - 1)) * iw
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * ih
  const path = (k) => data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d[k])}`).join('')
  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onMouseLeave={() => setHover(null)} role="img" aria-label="Đường cong lợi suất trái phiếu Chính phủ">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.05)" />
              <text x={pad.l + iw + 8} y={y(t) + 4} className="num fill-faint text-[10.5px]">
                {t.toFixed(1).replace('.', ',')}%
              </text>
            </g>
          ))}
          <path d={path('prev')} fill="none" stroke="var(--color-muted)" strokeWidth={1.4} strokeDasharray="4 4" />
          <path d={path('value')} fill="none" stroke="var(--color-brand)" strokeWidth={2} />
          {data.map((d, i) => (
            <g key={d.tenor} onMouseEnter={() => setHover(i)}>
              <rect x={x(i) - iw / data.length / 2} y={pad.t} width={iw / data.length} height={ih} fill="transparent" />
              <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 3} fill="var(--color-brand)" stroke="#09090b" strokeWidth={2} />
              <text x={x(i)} y={height - 8} textAnchor="middle" className={cn('num text-[10.5px]', hover === i ? 'fill-fg' : 'fill-faint')}>
                {d.tenor}
              </text>
            </g>
          ))}
        </svg>
      )}
      {hover != null && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl border border-line-strong bg-canvas/95 px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(Math.max(0, x(hover) - 70), width - 150) }}
        >
          <div className="mb-1 text-muted">Kỳ hạn {data[hover].tenor.replace('N', ' năm')}</div>
          <div className="num flex justify-between gap-4">
            <span className="text-brand">Hiện tại</span> {data[hover].value.toFixed(2).replace('.', ',')}%
          </div>
          <div className="num flex justify-between gap-4">
            <span className="text-muted">Tuần trước</span> {data[hover].prev.toFixed(2).replace('.', ',')}%
          </div>
        </div>
      )}
    </div>
  )
}

const COUNTRY_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'VN', label: `${FLAGS.VN} Việt Nam` },
  { value: 'US', label: `${FLAGS.US} Mỹ` },
  { value: 'CN', label: `${FLAGS.CN} Trung Quốc` },
]
const IMPACT_FILTERS = [
  { value: 0, label: 'Mọi mức' },
  { value: 2, label: 'Trung bình trở lên' },
  { value: 3, label: 'Chỉ mức cao' },
]

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-8 rounded-full border px-3 text-[13px] whitespace-nowrap transition-colors',
        active ? 'border-brand/50 bg-brand/10 text-fg' : 'border-line-strong text-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

/** Lịch kinh tế: sự kiện đã qua / sắp diễn ra, lọc theo quốc gia & mức ảnh hưởng. */
function EconomicCalendar({ events }) {
  const [country, setCountry] = useState('all')
  const [impact, setImpact] = useState(0)
  const now = vnNow().getTime()
  const list = useMemo(() => events.filter((e) => (country === 'all' || e.country === country) && e.impact >= impact), [events, country, impact])
  const firstUpcoming = list.findIndex((e) => e.date >= now)

  const valueCell = (v) => (v == null ? <span className="text-faint">—</span> : v)
  const actualCell = (e) => {
    if (e.kind === 'speech') return <Chip className="h-5 text-[11px]"><Mic className="size-3" /> Phát biểu</Chip>
    if (e.kind === 'event') return <Chip className="h-5 text-[11px]"><Flag className="size-3" /> Sự kiện</Chip>
    if (e.actual == null) return <span className="text-faint">{e.date >= now ? 'Chưa công bố' : '—'}</span>
    const a = parseNum(e.actual)
    const f = parseNum(e.forecast)
    const tone = a == null || f == null || a === f ? 'text-fg' : a > f ? 'text-up' : 'text-down'
    return <span className={cn('font-semibold', tone)}>{e.actual}</span>
  }

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader title="Lịch kinh tế" subtitle="Các số liệu vĩ mô và sự kiện có thể tác động tới thị trường" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {COUNTRY_FILTERS.map((c) => (
          <FilterChip key={c.value} active={country === c.value} onClick={() => setCountry(c.value)}>
            {c.label}
          </FilterChip>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-line-strong sm:block" />
        {IMPACT_FILTERS.map((c) => (
          <FilterChip key={c.value} active={impact === c.value} onClick={() => setImpact(c.value)}>
            {c.label}
          </FilterChip>
        ))}
      </div>
      <div className="-mx-5 overflow-x-auto sm:-mx-6">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2.5 pr-3 pl-5 font-medium sm:pl-6">Sự kiện</th>
              <th className="px-3 py-2.5 text-right font-medium">Kỳ trước</th>
              <th className="px-3 py-2.5 text-right font-medium">Dự báo</th>
              <th className="px-3 py-2.5 text-right font-medium">Thực tế</th>
              <th className="px-3 py-2.5 font-medium">Thời gian</th>
              <th className="py-2.5 pr-5 pl-3 text-right font-medium sm:pr-6">Ảnh hưởng</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted">
                  Không có sự kiện phù hợp bộ lọc.
                </td>
              </tr>
            )}
            {list.map((e, i) => (
              <Fragment key={e.id}>
                {i === firstUpcoming && (
                  <tr aria-hidden>
                    <td colSpan={6} className="px-5 py-1.5 sm:px-6">
                      <div className="flex items-center gap-3 text-[11px] font-semibold tracking-wide text-down uppercase">
                        Sắp diễn ra <span className="h-px flex-1 bg-down/40" />
                      </div>
                    </td>
                  </tr>
                )}
                <tr className={cn('border-b border-line last:border-0 hover:bg-raised/40', e.date < now && 'text-dim')}>
                  <td className="py-3 pr-3 pl-5 sm:pl-6">
                    <span className="flex items-center gap-2.5">
                      <span className="text-base" title={COUNTRY_NAME[e.country]} aria-label={COUNTRY_NAME[e.country]}>
                        {FLAGS[e.country]}
                      </span>
                      <span className="font-medium text-fg">{e.title}</span>
                    </span>
                  </td>
                  <td className="num px-3 py-3 text-right">{valueCell(e.prev)}</td>
                  <td className="num px-3 py-3 text-right">{valueCell(e.forecast)}</td>
                  <td className="num px-3 py-3 text-right">{actualCell(e)}</td>
                  <td className="num px-3 py-3 whitespace-nowrap text-muted">
                    {weekdayShort(e.date)}, {formatMediumDate(e.date, false)} · {formatTime(e.date)}
                  </td>
                  <td className="py-3 pr-5 pl-3 text-right sm:pr-6">
                    <ImpactBars level={e.impact} />
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function MacroTab() {
  const { data, isLoading, error, refetch } = useMacro()
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-[18px]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-[18px]" />
          <Skeleton className="h-72 rounded-[18px]" />
        </div>
      </div>
    )
  return (
    <div className="space-y-6">
      <OutlookCard outlook={data.outlook} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Đường cong lợi suất TPCP"
            subtitle="Lợi suất trái phiếu Chính phủ theo kỳ hạn"
            action={
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded bg-brand" /> Hiện tại
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0 w-4 border-t border-dashed border-muted" /> Tuần trước
                </span>
              </div>
            }
          />
          <YieldCurve data={data.yieldCurve} />
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Lãi suất & chỉ số chính" subtitle="Cập nhật theo công bố gần nhất" />
          <div className="grid grid-cols-2 gap-3">
            {data.rates.map((r) => (
              <div key={r.label} className="rounded-2xl border border-line bg-base p-4">
                <div className="text-xs leading-[1.5] text-muted">{r.label}</div>
                <div className="num mt-1.5 text-xl font-semibold">{r.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <EconomicCalendar events={data.events} />
    </div>
  )
}
