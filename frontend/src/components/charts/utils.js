import { useLayoutEffect, useState } from 'react'

/**
 * Đo kích thước phần tử (ResizeObserver). Trả về callback ref → đo được cả khi
 * phần tử chỉ xuất hiện sau lần render đầu (VD: sau skeleton).
 */
export function useElementSize() {
  const [el, setEl] = useState(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!el) return
    const update = () => setSize((s) => (s.width === el.clientWidth && s.height === el.clientHeight ? s : { width: el.clientWidth, height: el.clientHeight }))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return [setEl, size]
}

/** Các mốc chia trục "đẹp" giữa min và max. */
export function niceTicks(min, max, count = 4) {
  const span = max - min
  if (!(span > 0)) return [min]
  const raw = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag
  const out = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10))
  return out
}

export const SERIES_COLORS = ['#f3f3f4', '#ffa36c', '#a78bfa', '#38bdf8', '#f472b6', '#a3e635', '#facc15', '#2dd4bf']
