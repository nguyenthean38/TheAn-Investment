import { useId } from 'react'

/** Đường xu hướng mini. Màu tự động theo chiều tăng/giảm nếu không truyền `color`. */
export function Sparkline({ values, width = 96, height = 28, color, area = true, baseline, className }) {
  const gid = useId().replace(/:/g, '')
  if (!values?.length) return <svg width={width} height={height} className={className} aria-hidden />
  const min = Math.min(...values, baseline ?? Infinity)
  const max = Math.max(...values, baseline ?? -Infinity)
  const span = max - min || 1
  const up = values[values.length - 1] >= (baseline ?? values[0])
  const c = color ?? (up ? 'var(--color-up)' : 'var(--color-down)')
  const pts = values.map((v, i) => [(i / (values.length - 1 || 1)) * width, 2 + (1 - (v - min) / span) * (height - 4)])
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('')
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.25" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {baseline != null && (
        <line x1={0} x2={width} y1={2 + (1 - (baseline - min) / span) * (height - 4)} y2={2 + (1 - (baseline - min) / span) * (height - 4)} stroke="rgb(255 255 255 / 0.2)" strokeDasharray="2 3" />
      )}
      {area && <path d={`${d}L${width},${height}L0,${height}Z`} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={c} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
