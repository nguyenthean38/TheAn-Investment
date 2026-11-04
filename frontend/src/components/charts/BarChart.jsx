import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useElementSize, niceTicks } from './utils'

/**
 * Biểu đồ cột nhóm.
 * data: [{ label, values: [number|null, …], dashed?: boolean[] }]
 * keys: [{ label, color }] — chú thích cho từng cột trong nhóm.
 * Hỗ trợ giá trị âm (trục 0 ở giữa). `colorFn(value, groupIndex, keyIndex)` để tô theo dấu.
 */
export function BarChart({ data, keys, height = 220, yFormat = (v) => v.toFixed(0), colorFn, className, showLegend = true }) {
  const [ref, { width }] = useElementSize()
  const [hover, setHover] = useState(null)
  const all = data.flatMap((d) => d.values.filter((v) => v != null))
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  const ticks = niceTicks(min, max, 4)
  const lo = Math.min(min, ticks[0] ?? min)
  const hi = Math.max(max, ticks[ticks.length - 1] ?? max)
  const right = 56
  const top = 8
  const bottom = 26
  const innerW = Math.max(10, width - right)
  const innerH = height - top - bottom
  const y = (v) => top + (1 - (v - lo) / (hi - lo || 1)) * innerH
  const groupW = innerW / Math.max(1, data.length)
  const nKeys = Math.max(1, keys.length)
  const barW = Math.max(3, Math.min(22, (groupW * 0.7) / nKeys))
  // Hiện nhãn cách quãng để không chồng chữ (ước ~44px mỗi nhãn)
  const labelEvery = Math.max(1, Math.ceil(44 / Math.max(1, groupW)))

  return (
    <div className={cn('w-full', className)}>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="block" onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'rgb(255 255 255 / 0.2)' : 'rgb(255 255 255 / 0.05)'} strokeDasharray={t === 0 ? undefined : '2 4'} />
                <text x={innerW + 8} y={y(t) + 4} className="num fill-faint text-[10.5px]">
                  {yFormat(t)}
                </text>
              </g>
            ))}
            {data.map((d, gi) => {
              const gx = gi * groupW + (groupW - barW * nKeys - (nKeys - 1) * 3) / 2
              return (
                <g key={gi} onMouseEnter={() => setHover(gi)}>
                  <rect x={gi * groupW} y={top} width={groupW} height={innerH} fill={hover === gi ? 'rgb(255 255 255 / 0.03)' : 'transparent'} />
                  {d.values.map((v, ki) => {
                    if (v == null) return null
                    const color = colorFn ? colorFn(v, gi, ki) : keys[ki]?.color
                    const y0 = y(Math.max(0, v))
                    const h = Math.max(1, Math.abs(y(v) - y(0)))
                    const dashed = d.dashed?.[ki]
                    return (
                      <rect
                        key={ki}
                        x={gx + ki * (barW + 3)}
                        y={y0}
                        width={barW}
                        height={h}
                        rx={Math.min(4, barW / 3)}
                        fill={dashed ? 'transparent' : color}
                        fillOpacity={dashed ? 0 : hover == null || hover === gi ? 1 : 0.55}
                        stroke={dashed ? color : 'none'}
                        strokeDasharray={dashed ? '3 2' : undefined}
                      />
                    )
                  })}
                  {(gi % labelEvery === 0 || gi === data.length - 1) && (data.length - 1 - gi) % labelEvery === 0 && (
                    <text x={gi * groupW + groupW / 2} y={height - 8} textAnchor="middle" className="num fill-faint text-[10.5px]">
                      {d.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
        {hover != null && data[hover] && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-xl border border-line-strong bg-canvas/95 px-3 py-2 text-[12px] shadow-xl"
            style={{ left: Math.min(Math.max(0, hover * groupW + groupW / 2 - 80), Math.max(0, width - 180)) }}
          >
            <div className="mb-1 text-[11px] text-muted">{data[hover].label}</div>
            {data[hover].values.map((v, ki) =>
              v == null ? null : (
                <div key={ki} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-dim">
                    <span className="size-2 rounded-sm" style={{ background: keys[ki]?.color }} />
                    {keys[ki]?.label}
                  </span>
                  <span className="num font-semibold">{yFormat(v)}</span>
                </div>
              ),
            )}
          </div>
        )}
      </div>
      {showLegend && keys.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
          {keys.map((k) => (
            <span key={k.label} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: k.color }} />
              {k.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
