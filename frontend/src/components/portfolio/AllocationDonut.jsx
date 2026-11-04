import { useState } from 'react'
import { SERIES_COLORS } from '@/components/charts'
import { formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

const COLORS = ['#ffa36c', '#a78bfa', '#38bdf8', '#2fd28a', '#f472b6', '#facc15', '#a3e635', '#2dd4bf', ...SERIES_COLORS]

/** Biểu đồ vành khuyên phân bổ tỷ trọng (SVG thuần). items: [{ label, value }] */
export function AllocationDonut({ items, total, centerLabel, centerValue, size = 200 }) {
  const [hover, setHover] = useState(null)
  const r = size / 2 - 14
  const c = 2 * Math.PI * r
  const gap = items.length > 1 ? 3 : 0
  let acc = 0
  const arcs = items.map((it, i) => {
    const frac = total ? it.value / total : 0
    const len = Math.max(0, frac * c - gap)
    const arc = { ...it, i, frac, dash: `${len} ${c - len}`, offset: -acc, color: COLORS[i % COLORS.length] }
    acc += frac * c
    return arc
  })
  const active = hover != null ? arcs[hover] : null

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center xl:flex-col">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label="Phân bổ danh mục theo ngành">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={16} />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={hover === a.i ? 22 : 16}
              strokeDasharray={a.dash}
              strokeDashoffset={a.offset}
              strokeLinecap="butt"
              className="cursor-pointer transition-[stroke-width,opacity] duration-150"
              opacity={hover == null || hover === a.i ? 1 : 0.35}
              onMouseEnter={() => setHover(a.i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="text-[11px] text-muted">{active ? active.label : centerLabel}</span>
          <span className="num mt-0.5 text-lg font-semibold">{active ? formatPercent(active.frac * 100, { sign: false, digits: 1 }) : centerValue}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1.5">
        {arcs.map((a) => (
          <li
            key={a.label}
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
            className={cn('flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-colors', hover === a.i && 'bg-raised')}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: a.color }} />
              <span className="truncate text-dim">{a.label}</span>
            </span>
            <span className="num font-medium">{formatPercent(a.frac * 100, { sign: false, digits: 1 })}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
