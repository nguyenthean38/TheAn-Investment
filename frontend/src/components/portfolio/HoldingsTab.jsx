import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Card, Chip, EmptyState, ErrorState, Modal, Skeleton, TickerLogo } from '@/components/ui'
import { useDeleteHolding, useHoldings } from '@/hooks/useWatchlists'
import { formatBillion, formatChange, formatNumber, formatPercent, formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import { AllocationDonut } from './AllocationDonut'
import { HoldingModal } from './HoldingModal'

/** Tiền đồng gọn: 1,25 tỷ / 845,2 tr */
const fmtMoney = (v) => {
  if (v == null || Number.isNaN(v)) return '—'
  const a = Math.abs(v)
  if (a >= 1e9) return formatBillion(v / 1e9)
  return `${formatNumber(v / 1e6, 1)} tr`
}
const tone = (v) => (v > 0 ? 'text-up' : v < 0 ? 'text-down' : 'text-ref')

function SummaryCard({ label, value, sub, valueClass }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="ds-caption">{label}</div>
      <div className={cn('num mt-1.5 truncate text-xl font-semibold sm:text-2xl', valueClass)}>{value}</div>
      {sub && <div className="mt-1 truncate text-xs">{sub}</div>}
    </Card>
  )
}

/** Tab "Danh mục nắm giữ": vị thế nhập tay, lãi/lỗ, phân bổ ngành. */
export function HoldingsTab({ byTicker, stocksLoading }) {
  const { data: holdings, isLoading, error, refetch } = useHoldings()
  const del = useDeleteHolding()
  const [modal, setModal] = useState({ open: false, holding: null })
  const [confirm, setConfirm] = useState(null)

  const rows = useMemo(() => {
    const list = (holdings ?? [])
      .map((h) => {
        const s = byTicker.get(h.ticker)
        if (!s) return null
        const value = h.quantity * s.price
        const cost = h.quantity * h.avgPrice
        return { ...h, s, value, cost, pnl: value - cost, pnlPct: ((value - cost) / cost) * 100, today: h.quantity * s.change }
      })
      .filter(Boolean)
    const total = list.reduce((a, r) => a + r.value, 0)
    return list.map((r) => ({ ...r, weight: total ? (r.value / total) * 100 : 0 })).sort((a, b) => b.value - a.value)
  }, [holdings, byTicker])

  const total = rows.reduce((a, r) => a + r.value, 0)
  const cost = rows.reduce((a, r) => a + r.cost, 0)
  const pnl = total - cost
  const today = rows.reduce((a, r) => a + r.today, 0)
  const todayPct = total - today ? (today / (total - today)) * 100 : 0

  const sectors = useMemo(() => {
    const m = new Map()
    rows.forEach((r) => m.set(r.s.sectorName, (m.get(r.s.sectorName) ?? 0) + r.value))
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [rows])

  const openAdd = () => setModal({ open: true, holding: null })

  if (error) return <Card><ErrorState error={error} onRetry={refetch} /></Card>
  if (isLoading || stocksLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-[18px]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[18px]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="Danh mục đang trống"
            description="Thêm các vị thế bạn đang nắm giữ để theo dõi lãi/lỗ, tỷ trọng và mức độ tập trung theo ngành — tất cả trong một nơi."
            action={
              <Button variant="primary" onClick={openAdd}>
                <Plus className="size-4" /> Thêm vị thế đầu tiên
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Tổng giá trị thị trường" value={fmtMoney(total)} sub={<span className="text-muted">Vốn đầu tư {fmtMoney(cost)}</span>} />
            <SummaryCard
              label="Lãi/lỗ chưa thực hiện"
              value={`${pnl > 0 ? '+' : ''}${fmtMoney(pnl)}`}
              valueClass={tone(pnl)}
              sub={<span className={tone(pnl)}>{formatPercent(cost ? (pnl / cost) * 100 : 0)}</span>}
            />
            <SummaryCard label="Lãi/lỗ hôm nay" value={`${today > 0 ? '+' : ''}${fmtMoney(today)}`} valueClass={tone(today)} sub={<span className={tone(today)}>{formatPercent(todayPct)}</span>} />
            <SummaryCard label="Số mã nắm giữ" value={rows.length} sub={<span className="text-muted">{sectors.length} ngành</span>} />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                <h2 className="ds-h3">Vị thế</h2>
                <Button size="sm" variant="primary" onClick={openAdd}>
                  <Plus className="size-4" /> Thêm vị thế
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-sm">
                  <thead>
                    <tr className="border-y border-line text-left text-[11.5px] text-faint">
                      <th className="py-2.5 pr-3 pl-5 font-medium">Mã</th>
                      <th className="px-3 text-right font-medium">KL</th>
                      <th className="px-3 text-right font-medium">Giá vốn</th>
                      <th className="px-3 text-right font-medium">Giá hiện tại</th>
                      <th className="px-3 text-right font-medium">Giá trị</th>
                      <th className="px-3 text-right font-medium">Lãi/lỗ</th>
                      <th className="px-3 text-right font-medium">Tỷ trọng</th>
                      <th className="w-20 pr-5" aria-label="Thao tác" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="group border-b border-line transition-colors last:border-0 hover:bg-raised/60">
                        <td className="py-3 pr-3 pl-5">
                          <Link to={`/app/co-phieu/${r.ticker}`} className="flex items-center gap-3">
                            <TickerLogo ticker={r.ticker} color={r.s.color} size={30} />
                            <span className="min-w-0">
                              <span className="block font-semibold">{r.ticker}</span>
                              <span className="block max-w-[160px] truncate text-xs text-muted">{r.s.sectorName}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="num px-3 text-right">{formatNumber(r.quantity)}</td>
                        <td className="num px-3 text-right text-dim">{formatPrice(r.avgPrice)}</td>
                        <td className="num px-3 text-right">
                          <span className="block font-medium">{formatPrice(r.s.price)}</span>
                          <span className={cn('block text-[11px]', tone(r.s.change))}>{formatChange(r.s.change)}</span>
                        </td>
                        <td className="num px-3 text-right font-medium">{fmtMoney(r.value)}</td>
                        <td className={cn('num px-3 text-right', tone(r.pnl))}>
                          <span className="block font-medium">
                            {r.pnl > 0 ? '+' : ''}
                            {fmtMoney(r.pnl)}
                          </span>
                          <span className="block text-[11px]">{formatPercent(r.pnlPct)}</span>
                        </td>
                        <td className="px-3 text-right">
                          <span className="num text-dim">{formatPercent(r.weight, { sign: false, digits: 1 })}</span>
                          <span className="mt-1 ml-auto block h-1 w-16 overflow-hidden rounded-full bg-line">
                            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, r.weight)}%` }} />
                          </span>
                        </td>
                        <td className="pr-5 text-right">
                          <span className="inline-flex gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <button type="button" onClick={() => setModal({ open: true, holding: r })} aria-label={`Sửa vị thế ${r.ticker}`} className="rounded-lg p-1.5 text-muted hover:bg-overlay hover:text-fg">
                              <Pencil className="size-4" />
                            </button>
                            <button type="button" onClick={() => setConfirm(r)} aria-label={`Xoá vị thế ${r.ticker}`} className="rounded-lg p-1.5 text-muted hover:bg-down/10 hover:text-down">
                              <Trash2 className="size-4" />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="ds-h3 mb-4">Phân bổ theo ngành</h2>
              <AllocationDonut items={sectors} total={total} centerLabel="Tổng giá trị" centerValue={fmtMoney(total)} size={190} />
              {sectors[0] && sectors[0].value / total > 0.4 && (
                <p className="mt-4 rounded-xl border border-ref/25 bg-ref/[0.07] px-3 py-2.5 text-xs leading-relaxed text-dim">
                  Ngành <span className="font-medium text-fg">{sectors[0].label}</span> chiếm hơn 40% danh mục. Cân nhắc đa dạng hoá để giảm rủi ro tập trung.
                </p>
              )}
            </Card>
          </div>
        </>
      )}

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line-strong bg-raised text-dim">
            <Link2 className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="ds-h3">Kết nối công ty chứng khoán</h3>
              <Chip tone="brand">Sắp ra mắt</Chip>
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted">Đồng bộ danh mục tự động từ tài khoản chứng khoán của bạn — không cần nhập tay. Nhịp chỉ đọc dữ liệu, không bao giờ đặt lệnh thay bạn.</p>
          </div>
        </div>
        <Button variant="secondary" disabled>
          Kết nối
        </Button>
      </Card>

      <HoldingModal open={modal.open} holding={modal.holding} stocks={byTicker} onClose={() => setModal({ open: false, holding: null })} />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={`Xoá vị thế ${confirm?.ticker ?? ''}?`}
        description="Vị thế sẽ bị gỡ khỏi danh mục. Bạn có thể thêm lại bất cứ lúc nào."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Huỷ
            </Button>
            <Button variant="danger" loading={del.isPending} onClick={() => del.mutate(confirm.id, { onSuccess: () => setConfirm(null) })}>
              Xoá vị thế
            </Button>
          </div>
        }
      />
    </div>
  )
}
