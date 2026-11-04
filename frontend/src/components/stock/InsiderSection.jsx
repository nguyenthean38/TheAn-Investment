import { useMemo, useState } from 'react'
import { Button, Card, Chip, EmptyState, ErrorState, SectionHeader, Skeleton, TickMeter } from '@/components/ui'
import { useInsiders } from '@/hooks/useMarket'
import { cn } from '@/utils/cn'
import { formatDate, formatNumber, formatPrice, formatValueVnd } from '@/utils/format'
import { UserRound } from 'lucide-react'

const WINDOWS = [
  { months: 3, label: '3 tháng' },
  { months: 6, label: '6 tháng' },
  { months: 12, label: '12 tháng' },
]

/** Mục "Giao dịch nội bộ & cổ đông lớn". */
export function InsiderSection({ stock }) {
  const { data, isLoading, error, refetch } = useInsiders(stock.ticker)
  const [showAll, setShowAll] = useState(false)

  const summary = useMemo(() => {
    if (!data) return []
    const now = Date.now()
    return WINDOWS.map((w) => {
      const list = data.filter((x) => now - x.date <= w.months * 30.5 * 86400000)
      const buy = list.filter((x) => x.type === 'buy').reduce((a, x) => a + x.value, 0)
      const sell = list.filter((x) => x.type === 'sell').reduce((a, x) => a + x.value, 0)
      return { ...w, buy, sell, net: buy - sell, count: list.length }
    })
  }, [data])
  const maxV = Math.max(1, ...summary.flatMap((s) => [s.buy, s.sell]))
  const year = summary[2]

  return (
    <section id="noi-bo" className="scroll-mt-24">
      <SectionHeader
        title="Giao dịch nội bộ & cổ đông lớn"
        subtitle={year ? (year.net >= 0 ? `Mua ròng ${formatValueVnd(year.net)} trong 12 tháng` : `Bán ròng ${formatValueVnd(-year.net)} trong 12 tháng`) : 'Lãnh đạo, người liên quan và cổ đông lớn'}
        tone={year ? (year.net >= 0 ? 'up' : 'down') : undefined}
      />
      {isLoading ? (
        <Skeleton className="h-80" />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : !data.length ? (
        <Card>
          <EmptyState icon={UserRound} title="Chưa có giao dịch nội bộ" description="Doanh nghiệp chưa công bố giao dịch của người nội bộ trong 12 tháng qua." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card className="p-5">
            <h3 className="ds-h3">Khối lượng giao dịch</h3>
            <p className="ds-caption mb-4">Giá trị mua và bán theo khung thời gian</p>
            <div className="space-y-5">
              {summary.map((s) => (
                <div key={s.months}>
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="text-dim">{s.label}</span>
                    <span className={cn('num font-semibold', s.net >= 0 ? 'text-up' : 'text-down')}>
                      {s.net >= 0 ? '+' : '-'}
                      {formatValueVnd(Math.abs(s.net))}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-[11px] text-muted">Mua</span>
                    <TickMeter value={s.buy || 0} max={maxV} ticks={28} centered={false} className="flex-1 justify-between" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="w-8 text-[11px] text-muted">Bán</span>
                    <TickMeter value={-(s.sell || 0)} max={maxV} ticks={28} centered={false} className="flex-1 justify-between" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-[13px]">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-5 py-3 font-medium">Ngày</th>
                    <th className="px-3 py-3 font-medium">Người giao dịch</th>
                    <th className="px-3 py-3 font-medium">Loại</th>
                    <th className="px-3 py-3 text-right font-medium">KL thực hiện / đăng ký</th>
                    <th className="px-3 py-3 text-right font-medium">Giá</th>
                    <th className="px-5 py-3 text-right font-medium">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAll ? data : data.slice(0, 6)).map((x) => (
                    <tr key={x.id} className="border-t border-line hover:bg-raised/60">
                      <td className="num px-5 py-3 whitespace-nowrap text-muted">{formatDate(x.date)}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium whitespace-nowrap">{x.name}</div>
                        <div className="text-xs text-muted">{x.role}</div>
                      </td>
                      <td className="px-3 py-3">
                        <Chip tone={x.type === 'buy' ? 'up' : 'down'}>{x.type === 'buy' ? 'Mua' : 'Bán'}</Chip>
                      </td>
                      <td className="num px-3 py-3 text-right whitespace-nowrap">
                        {formatNumber(x.executed)} <span className="text-muted">/ {formatNumber(x.registered)}</span>
                        {x.executed < x.registered && <div className="text-[11px] text-ref">Khớp {Math.round((x.executed / x.registered) * 100)}%</div>}
                      </td>
                      <td className="num px-3 py-3 text-right">{formatPrice(x.price)}</td>
                      <td className={cn('num px-5 py-3 text-right font-semibold whitespace-nowrap', x.type === 'buy' ? 'text-up' : 'text-down')}>
                        {x.type === 'buy' ? '+' : '-'}
                        {formatValueVnd(x.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 6 && (
              <div className="border-t border-line px-5 py-3">
                <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Thu gọn' : `Xem tất cả ${data.length} giao dịch`}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </section>
  )
}
