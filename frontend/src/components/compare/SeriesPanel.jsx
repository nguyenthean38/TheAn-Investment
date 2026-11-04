import { useEffect, useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Kbd, TickerLogo } from '@/components/ui'
import { usePeers, useStockSearch } from '@/hooks/useMarket'
import { cn } from '@/utils/cn'

export const INDEX_ID = 'VNINDEX'
export const MAX_SERIES = 6

/** Cột trái: thêm mã, danh sách chuỗi đang chọn, gợi ý so sánh. */
export function SeriesPanel({ series, onAdd, onRemove, adding, setAdding, allowIndex }) {
  const tickers = series.map((s) => s.id)
  const full = tickers.length >= MAX_SERIES
  const first = tickers.find((t) => t !== INDEX_ID)
  const { data: peers = [] } = usePeers(first)
  const suggestions = [
    ...(allowIndex && !tickers.includes(INDEX_ID) ? [{ ticker: INDEX_ID, name: 'Chỉ số VN-Index', color: '#64748b' }] : []),
    ...peers.filter((p) => !tickers.includes(p.ticker)),
  ].slice(0, 5)

  return (
    <aside className="flex flex-col gap-5">
      <div>
        {adding ? (
          <AddSearch onPick={(t) => (onAdd(t), setAdding(false))} onClose={() => setAdding(false)} exclude={tickers} />
        ) : (
          <button
            type="button"
            disabled={full}
            onClick={() => setAdding(true)}
            className="flex h-10 w-full items-center gap-2 rounded-xl border border-dashed border-line-strong px-3 text-sm text-dim transition-colors hover:border-muted hover:text-fg disabled:opacity-40"
          >
            <Plus className="size-4" /> {full ? `Tối đa ${MAX_SERIES} chuỗi` : 'Thêm mã so sánh'}
            <Kbd className="ml-auto">C</Kbd>
          </button>
        )}
      </div>

      <div>
        <h3 className="ds-label mb-2">Đang so sánh</h3>
        <ul className="space-y-1.5">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-base py-2 pr-1.5 pl-2">
              <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{s.label}</span>
                <span className="block truncate text-[11.5px] text-muted">{s.name}</span>
              </span>
              <button type="button" onClick={() => onRemove(s.id)} disabled={series.length <= 1} aria-label={`Bỏ ${s.label}`} className="rounded-lg p-1.5 text-faint hover:bg-raised hover:text-down disabled:opacity-30">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {suggestions.length > 0 && !full && (
        <div>
          <h3 className="ds-label mb-2">Gợi ý so sánh</h3>
          <ul className="space-y-0.5">
            {suggestions.map((p) => (
              <li key={p.ticker}>
                <button type="button" onClick={() => onAdd(p.ticker)} className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-raised">
                  <TickerLogo ticker={p.ticker === INDEX_ID ? 'VNI' : p.ticker} color={p.color} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{p.ticker === INDEX_ID ? 'VN-Index' : p.ticker}</span>
                    <span className="block truncate text-[11px] text-muted">{p.name}</span>
                  </span>
                  <Plus className="size-4 text-faint group-hover:text-brand" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

function AddSearch({ onPick, onClose, exclude }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const { data = [] } = useStockSearch(q.trim(), 6)
  const results = data.filter((s) => !exclude.includes(s.ticker))
  useEffect(() => ref.current?.focus(), [])
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      onPick(results[active].ticker)
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-brand/50 bg-base">
      <div className="flex h-10 items-center gap-2 px-3">
        <Search className="size-4 text-muted" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(onClose, 150)}
          placeholder="Nhập mã hoặc tên…"
          aria-label="Tìm mã để so sánh"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
        />
      </div>
      <ul className="border-t border-line p-1">
        {results.map((s, i) => (
          <li key={s.ticker}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(s.ticker)}
              onMouseMove={() => setActive(i)}
              className={cn('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left', i === active && 'bg-hover')}
            >
              <TickerLogo ticker={s.ticker} color={s.color} size={24} />
              <span className="text-[13px] font-medium">{s.ticker}</span>
              <span className="min-w-0 truncate text-[11.5px] text-muted">{s.name}</span>
            </button>
          </li>
        ))}
        {!results.length && <li className="px-2 py-3 text-center text-xs text-muted">Không tìm thấy mã phù hợp.</li>}
      </ul>
    </div>
  )
}
