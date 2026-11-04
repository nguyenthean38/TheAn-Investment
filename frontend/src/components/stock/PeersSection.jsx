import { useMemo, useState } from 'react'
import { AlertCircle, LineChart as LineIcon, Pencil, Plus, RotateCcw, Search, X } from 'lucide-react'
import { Button, Card, ChangePill, Chip, ErrorState, SectionHeader, Skeleton, TickerCell, TickerLogo } from '@/components/ui'
import { usePeers, useStockSearch } from '@/hooks/useMarket'
import { useUI } from '@/store/ui'
import { cn } from '@/utils/cn'
import { formatBillion, formatPercent, formatRatio } from '@/utils/format'

const MAX_PEERS = 8

/** Mục "So sánh cùng ngành" [P]. */
export function PeersSection({ stock }) {
  const [custom, setCustom] = useState(null)
  const [editing, setEditing] = useState(false)
  const { data: defaults } = usePeers(stock.ticker)
  const { data, isLoading, error, refetch } = usePeers(stock.ticker, custom ?? undefined)
  const toast = useUI((s) => s.toast)

  const peers = data ?? []
  const stats = useMemo(() => {
    const range = (k) => {
      const vals = peers.map((p) => p[k]).filter((v) => v != null && Number.isFinite(v))
      return { min: Math.min(...vals), max: Math.max(...vals), avg: vals.reduce((a, b) => a + b, 0) / (vals.length || 1) }
    }
    return { pe: range('pe'), pb: range('pb') }
  }, [peers])
  const tickers = peers.map((p) => p.ticker)
  const cheaper = stats.pe.avg ? stock.pe < stats.pe.avg : false

  return (
    <section id="cung-nganh" className="scroll-mt-24">
      <SectionHeader
        title="So sánh cùng ngành"
        kbd="P"
        subtitle={data ? `P/E ${cheaper ? 'thấp hơn' : 'cao hơn'} trung bình nhóm ${formatPercent(Math.abs((stock.pe / stats.pe.avg - 1) * 100), { sign: false, digits: 0 })}` : 'Định giá và hiệu quả so với doanh nghiệp tương đồng'}
        tone={data ? (cheaper ? 'up' : 'down') : undefined}
        action={
          !editing && (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" /> Chỉnh sửa danh sách
              </Button>
              <Button size="sm" variant="secondary" to={`/app/so-sanh?tickers=${tickers.join(',')}`}>
                <LineIcon className="size-3.5" /> Vẽ biểu đồ
              </Button>
            </div>
          )
        }
      />
      {editing && (
        <PeerEditor
          stock={stock}
          initial={tickers.filter((t) => t !== stock.ticker)}
          defaults={(defaults ?? []).map((p) => p.ticker).filter((t) => t !== stock.ticker)}
          onCancel={() => setEditing(false)}
          onSave={(list) => {
            setCustom(list)
            setEditing(false)
            toast('Đã cập nhật danh sách so sánh.', 'success')
          }}
        />
      )}
      {isLoading ? (
        <Skeleton className="h-72" />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Mã</th>
                  <th className="px-3 py-3 text-right font-medium">Vốn hoá</th>
                  <th className="px-3 py-3 font-medium">P/E</th>
                  <th className="px-3 py-3 font-medium">P/B</th>
                  <th className="px-3 py-3 text-right font-medium">ROE</th>
                  <th className="px-3 py-3 text-right font-medium">Tăng trưởng DT</th>
                  <th className="px-3 py-3 text-right font-medium">1 năm</th>
                  <th className="px-5 py-3 text-right font-medium">Hôm nay</th>
                </tr>
              </thead>
              <tbody>
                {peers.map((p) => {
                  const self = p.ticker === stock.ticker
                  return (
                    <tr key={p.ticker} className={cn('border-t border-line hover:bg-raised/60', self && 'bg-brand/[0.04]')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <TickerCell ticker={p.ticker} name={p.name} color={p.color} size={30} link={!self} />
                          {self && <Chip tone="brand">Cổ phiếu này</Chip>}
                        </div>
                      </td>
                      <td className="num px-3 py-3 text-right whitespace-nowrap">{formatBillion(p.marketCap)}</td>
                      <td className="px-3 py-3">
                        <RangeCell value={p.pe} {...stats.pe} digits={1} />
                      </td>
                      <td className="px-3 py-3">
                        <RangeCell value={p.pb} {...stats.pb} digits={2} />
                      </td>
                      <td className="num px-3 py-3 text-right">{formatPercent(p.roe, { sign: false, digits: 1 })}</td>
                      <td className="px-3 py-3 text-right">
                        <ChangePill value={p.revenueGrowth} digits={1} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ChangePill value={p.perf1Y} digits={1} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ChangePill value={p.changePct} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-3 text-[11.5px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-fg" /> Hiện tại
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-[2px] bg-brand" /> Trung bình nhóm
            </span>
            {custom && (
              <button type="button" onClick={() => setCustom(null)} className="ml-auto inline-flex items-center gap-1 text-dim hover:text-fg">
                <RotateCcw className="size-3" /> Khôi phục mặc định
              </button>
            )}
          </div>
        </Card>
      )}
    </section>
  )
}

/** Giá trị + thanh khoảng (min–max nhóm), vạch cam = trung bình. */
function RangeCell({ value, min, max, avg, digits }) {
  const span = max - min || 1
  const pos = ((value - min) / span) * 100
  const avgPos = ((avg - min) / span) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="num w-10 text-right font-medium">{formatRatio(value, digits)}</span>
      <span className="relative h-1.5 w-24 rounded-full bg-overlay">
        <span className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 bg-brand" style={{ left: `${avgPos}%` }} />
        <span className={cn('absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas', value <= avg ? 'bg-up' : 'bg-fg')} style={{ left: `${pos}%` }} />
      </span>
    </div>
  )
}

function PeerEditor({ stock, initial, defaults, onCancel, onSave }) {
  const [list, setList] = useState(initial)
  const [q, setQ] = useState('')
  const term = q.trim()
  const { data: results = [] } = useStockSearch(term, 6)
  const full = list.length >= MAX_PEERS
  const add = (t) => !full && !list.includes(t) && t !== stock.ticker && setList((l) => [...l, t])

  return (
    <Card className="mb-4 animate-slide-up p-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <div className="flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-base px-3.5 focus-within:border-brand/60">
            <Search className="size-4 text-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm và thêm mã so sánh…" aria-label="Tìm mã cổ phiếu" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
          </div>
          {term && (
            <ul className="mt-2 space-y-1">
              {results
                .filter((r) => r.ticker !== stock.ticker)
                .map((r) => {
                  const added = list.includes(r.ticker)
                  return (
                    <li key={r.ticker} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-raised">
                      <TickerLogo ticker={r.ticker} color={r.color} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{r.ticker}</span>
                        <span className="block truncate text-xs text-muted">{r.name}</span>
                      </span>
                      <Button size="xs" variant={added ? 'ghost' : 'secondary'} disabled={added || full} onClick={() => add(r.ticker)}>
                        {added ? 'Đã thêm' : (
                          <>
                            Thêm <Plus className="size-3" />
                          </>
                        )}
                      </Button>
                    </li>
                  )
                })}
              {!results.length && <li className="px-2 py-3 text-sm text-muted">Không tìm thấy mã phù hợp.</li>}
            </ul>
          )}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-dim">Đang so sánh với</span>
            {full && (
              <span className="inline-flex items-center gap-1 text-xs text-down">
                <AlertCircle className="size-3.5" /> Tối đa {MAX_PEERS} mã
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {list.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-raised py-1 pr-1.5 pl-3 text-[13px] font-semibold">
                {t}
                <button type="button" aria-label={`Bỏ ${t}`} onClick={() => setList((l) => l.filter((x) => x !== t))} className="rounded-full p-0.5 text-muted hover:bg-hover hover:text-fg">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {!list.length && <span className="text-sm text-muted">Chưa chọn mã nào.</span>}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-xs text-muted">
          Đã chọn {list.length} mã ·{' '}
          <button type="button" onClick={() => setList(defaults)} className="text-dim underline-offset-4 hover:text-fg hover:underline">
            Khôi phục mặc định
          </button>
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Huỷ
          </Button>
          <Button size="sm" variant="primary" disabled={!list.length} onClick={() => onSave(list)}>
            Lưu lựa chọn
          </Button>
        </div>
      </div>
    </Card>
  )
}
