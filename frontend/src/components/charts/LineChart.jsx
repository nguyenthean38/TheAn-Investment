import { useId, useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { formatPercent } from '@/utils/format'
import { useElementSize, niceTicks } from './utils'

/**
 * Biểu đồ đường SVG tự vẽ (không phụ thuộc thư viện).
 *
 * series: [{ id, label, color, data: [{ t, value }], area?, dashed?, width?, axis?: 'left'|'right' }]
 *   - Trục X theo CHỈ SỐ của series đầu tiên (bỏ khoảng trống cuối tuần / nghỉ trưa).
 * baseline: { value, label } — đường nét đứt (giá tham chiếu).
 * volume: [{ t, value, up? }] — cột khối lượng phía dưới.
 * normalize: true → quy đổi mọi series về % thay đổi so với điểm đầu.
 * subSeries: { data, color, label, format, height } — biểu đồ phụ (VD chỉ số biến động).
 */
export function LineChart({
  series,
  height = 280,
  baseline,
  volume,
  normalize = false,
  subSeries,
  yFormat = (v) => v.toFixed(2),
  xFormat = (t) => new Date(t).toLocaleDateString('vi-VN'),
  tooltipTitle,
  showYAxis = true,
  endLabels = true,
  grid = true,
  className,
  onHoverIndex,
}) {
  const [ref, { width }] = useElementSize()
  const [hover, setHover] = useState(null)
  const gid = useId().replace(/:/g, '')

  const prepared = useMemo(() => {
    if (!series?.length || !series[0].data?.length) return null
    const primary = series[0].data
    const n = primary.length
    const index = new Map(primary.map((d, i) => [d.t, i]))
    const list = series.map((s) => {
      const first = s.data.find((d) => d.value != null)?.value
      const pts = s.data
        .map((d, i) => ({ i: s === series[0] ? i : (index.get(d.t) ?? (s.data.length === n ? i : -1)), t: d.t, raw: d.value, v: d.value == null ? null : normalize && first ? (d.value / first - 1) * 100 : d.value }))
        .filter((p) => p.i >= 0 && p.v != null)
      return { ...s, pts }
    })
    const all = list.flatMap((s) => s.pts.map((p) => p.v))
    if (baseline?.value != null && !normalize) all.push(baseline.value)
    let min = Math.min(...all)
    let max = Math.max(...all)
    if (min === max) {
      min -= 1
      max += 1
    }
    const pad = (max - min) * 0.08
    return { list, n, min: min - pad, max: max + pad, primary }
  }, [series, baseline, normalize])

  const subH = subSeries ? (subSeries.height ?? 56) : 0
  const volH = volume ? 44 : 0
  const right = showYAxis ? 64 : 8
  const top = 12
  const mainH = height - subH - volH - (subSeries ? 12 : 0) - 24
  const innerW = Math.max(10, width - right - 4)

  if (!prepared) return <div ref={ref} style={{ height }} className={cn('skeleton', className)} />

  const { list, n, min, max } = prepared
  const x = (i) => 4 + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v) => top + (1 - (v - min) / (max - min)) * mainH
  const ticks = niceTicks(min, max, 4)

  const pathOf = (pts) => pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join('')

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = Math.round(((px - 4) / innerW) * (n - 1))
    const clamped = Math.max(0, Math.min(n - 1, i))
    setHover(clamped)
    onHoverIndex?.(clamped)
  }
  const handleLeave = () => {
    setHover(null)
    onHoverIndex?.(null)
  }

  const hoverX = hover != null ? x(hover) : null
  const tooltipLeft = hoverX != null ? Math.min(Math.max(hoverX + 14, 0), width - 200) : 0
  const flip = hoverX != null && hoverX > width - 230

  // Biểu đồ phụ
  let sub = null
  if (subSeries?.data?.length) {
    const vals = subSeries.data.map((d) => d.value).filter((v) => v != null)
    const smin = Math.min(...vals)
    const smax = Math.max(...vals)
    const sy0 = top + mainH + volH + 24
    const sy = (v) => sy0 + (1 - (v - smin) / (smax - smin || 1)) * (subH - 8)
    const idx = new Map(prepared.primary.map((d, i) => [d.t, i]))
    const pts = subSeries.data.map((d, i) => ({ i: idx.get(d.t) ?? i, v: d.value })).filter((p) => p.v != null)
    sub = { pts, sy, sy0, path: pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${sy(p.v).toFixed(1)}`).join('') }
  }

  // Cột khối lượng
  let vol = null
  if (volume?.length) {
    const vmax = Math.max(...volume.map((v) => v.value))
    const vy0 = top + mainH + 8
    const bw = Math.max(1, (innerW / n) * 0.6)
    vol = volume.map((v, i) => ({ x: x(i) - bw / 2, w: bw, h: (v.value / vmax) * (volH - 6), y0: vy0 + volH - 6, up: v.up }))
  }

  return (
    <div ref={ref} className={cn('relative select-none', className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" onMouseMove={handleMove} onMouseLeave={handleLeave} role="img" aria-label={series.map((s) => s.label).join(', ')}>
          <defs>
            {list.map((s, k) => (
              <linearGradient key={k} id={`${gid}-g${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
            <pattern id={`${gid}-dots`} width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.7" fill="rgb(255 255 255 / 0.09)" />
            </pattern>
          </defs>

          {grid && <rect x={4} y={top} width={innerW} height={mainH} fill={`url(#${gid}-dots)`} />}
          {grid &&
            ticks.map((tv) => (
              <g key={tv}>
                <line x1={4} x2={4 + innerW} y1={y(tv)} y2={y(tv)} stroke="rgb(255 255 255 / 0.05)" />
                {showYAxis && (
                  <text x={width - right + 10} y={y(tv) + 4} className="num fill-faint text-[10.5px]">
                    {normalize ? formatPercent(tv, { digits: Math.abs(max - min) < 6 ? 1 : 0 }) : yFormat(tv)}
                  </text>
                )}
              </g>
            ))}

          {baseline?.value != null && !normalize && (
            <g>
              <line x1={4} x2={4 + innerW} y1={y(baseline.value)} y2={y(baseline.value)} stroke="var(--color-ref)" strokeOpacity="0.55" strokeDasharray="3 4" />
              {baseline.label && (
                <text x={8} y={y(baseline.value) - 6} className="fill-ref text-[10.5px]" fillOpacity="0.8">
                  {baseline.label}
                </text>
              )}
            </g>
          )}
          {normalize && min < 0 && max > 0 && <line x1={4} x2={4 + innerW} y1={y(0)} y2={y(0)} stroke="rgb(255 255 255 / 0.18)" strokeDasharray="3 4" />}

          {vol?.map((b, i) => (
            <rect key={i} x={b.x} y={b.y0 - b.h} width={b.w} height={b.h} rx={1} fill={b.up == null ? 'rgb(255 255 255 / 0.14)' : b.up ? 'rgb(47 210 138 / 0.35)' : 'rgb(255 90 106 / 0.35)'} />
          ))}

          {list.map((s, k) => {
            const d = pathOf(s.pts)
            const last = s.pts[s.pts.length - 1]
            return (
              <g key={s.id ?? k}>
                {s.area && last && <path d={`${d}L${x(last.i)},${top + mainH}L${x(s.pts[0].i)},${top + mainH}Z`} fill={`url(#${gid}-g${k})`} />}
                <path d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? 1.6} strokeDasharray={s.dashed ? '4 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />
                {last && hover == null && <circle cx={x(last.i)} cy={y(last.v)} r={3} fill={s.color} />}
                {last && endLabels && showYAxis && (
                  <g transform={`translate(${width - right + 4},${y(last.v) - 9})`}>
                    <rect width={right - 6} height={18} rx={5} fill={s.color} fillOpacity="0.16" />
                    <text x={(right - 6) / 2} y={12.5} textAnchor="middle" className="num text-[10.5px] font-semibold" fill={s.color}>
                      {normalize ? formatPercent(last.v, { digits: 1 }) : yFormat(last.v)}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {sub && (
            <g>
              <path d={sub.path} fill="none" stroke={subSeries.color} strokeWidth={1.2} />
              <text x={8} y={sub.sy0 + 2} className="fill-faint text-[10px]">
                {subSeries.label}
              </text>
            </g>
          )}

          {hoverX != null && (
            <g pointerEvents="none">
              <line x1={hoverX} x2={hoverX} y1={top} y2={height - 20} stroke="rgb(255 255 255 / 0.25)" />
              {list.map((s, k) => {
                const p = s.pts.find((q) => q.i === hover)
                return p ? <circle key={k} cx={hoverX} cy={y(p.v)} r={4} fill={s.color} stroke="#09090b" strokeWidth={2} /> : null
              })}
            </g>
          )}

          {/* nhãn trục X: đầu – cuối */}
          <text x={4} y={height - 4} className="num fill-faint text-[10.5px]">
            {xFormat(prepared.primary[0].t)}
          </text>
          <text x={4 + innerW} y={height - 4} textAnchor="end" className="num fill-faint text-[10.5px]">
            {xFormat(prepared.primary[n - 1].t)}
          </text>
        </svg>
      )}

      {hover != null && (
        <div
          className="pointer-events-none absolute top-3 z-10 min-w-[180px] rounded-xl border border-line-strong bg-canvas/95 px-3 py-2.5 shadow-2xl backdrop-blur"
          style={flip ? { left: hoverX - 14 - 190 } : { left: tooltipLeft }}
        >
          <div className="mb-1.5 text-[11px] text-muted">{tooltipTitle ? tooltipTitle(prepared.primary[hover].t) : xFormat(prepared.primary[hover].t)}</div>
          {list.map((s, k) => {
            const p = s.pts.find((q) => q.i === hover)
            if (!p) return null
            return (
              <div key={k} className="flex items-center justify-between gap-4 py-0.5 text-[12.5px]">
                <span className="flex items-center gap-2 text-dim">
                  <span className="h-3 w-[3px] rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="num font-semibold text-fg">{normalize ? formatPercent(p.v) : yFormat(p.raw)}</span>
              </div>
            )
          })}
          {sub &&
            (() => {
              const p = sub.pts.find((q) => q.i === hover)
              return p ? (
                <div className="flex items-center justify-between gap-4 py-0.5 text-[12.5px]">
                  <span className="flex items-center gap-2 text-dim">
                    <span className="h-3 w-[3px] rounded-full" style={{ background: subSeries.color }} />
                    {subSeries.label}
                  </span>
                  <span className="num font-semibold text-fg">{subSeries.format ? subSeries.format(p.v) : p.v}</span>
                </div>
              ) : null
            })()}
        </div>
      )}
    </div>
  )
}
